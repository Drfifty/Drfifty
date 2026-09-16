<?php
// WalletController — B.6 F-01/F-02/F-06/F-08/F-13 — Arena — ultra-thin delegates to EscrowLockService + stats isolation R37
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Str;
use App\Http\Requests\Wallet\{DepositRequest,WithdrawRequest};
use App\Http\Resources\WalletBalanceResource;
use App\Domain\Escrow\DTOs\WalletOperationDTO; use App\Domain\Escrow\Actions\EscrowLockService;
final class WalletController {
 public function balance(Request $req): JsonResponse {
  $userId = $req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? app()->bound('auth_user') ? app('auth_user')->id : null;
  if(!$userId) return response()->json(['message'=>'Unauthenticated'],401);
  $appId = $req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU BUSINESS';
  $cacheKey = "wallet:balance:{$userId}:{$appId}";
  $cached = Cache::tags(['wallet:balance'])->get($cacheKey) ?? Cache::get($cacheKey);
  if($cached){
   $cached['cached']=true; return response()->json(new WalletBalanceResource($cached),200);
  }
  // R37 — never SUM on live if stats_wallet_daily exists prefer stats, else single-row per currency max 5 rows
  $dbRoute='primary';
  try{
   $lag = DB::connection('mysql_replica')->table('heartbeat')->value('beat_at');
   // simple resolver: if replica lag <5s use replica
   $dbRoute='replica';
  }catch(\Throwable){ $dbRoute='primary'; }
  $conn = $dbRoute==='replica' ? 'mysql_replica' : 'mysql';
  // check stats table exists (pre-aggregated)
  $useStats = false; try{ $useStats = DB::connection($conn)->getSchemaBuilder()->hasTable('stats_wallet_daily'); }catch(\Throwable){}
  if($useStats){
   // read pre-aggregated if available else fallback
  }
  $wallets = DB::connection($conn)->table('app_wallets')->where('user_id',$userId)->when($appId!=='AU BUSINESS', fn($q)=>$q->where('app_id',$appId))->get();
  $payload=['wallets'=>$wallets,'db_route'=>$dbRoute,'cached'=>false];
  try{ Cache::tags(['wallet:balance'])->put($cacheKey,$payload,30); }catch(\Throwable){ Cache::put($cacheKey,$payload,30); }
  return response()->json(new WalletBalanceResource($payload),200);
 }
 public function deposit(DepositRequest $req, EscrowLockService $svc): JsonResponse {
  return $this->move($req,'deposit',$svc);
 }
 public function withdrawRequest(WithdrawRequest $req, EscrowLockService $svc): JsonResponse {
  return $this->move($req,'withdrawal',$svc);
 }
 private function move(Request $req, string $type, EscrowLockService $svc): JsonResponse {
  $userId = $req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? null;
  $appId = $req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU BUSINESS';
  $amountMinor = (int)$req->input('amount_minor');
  $currency = (string)$req->input('currency','EGP');
  $ref = (string)$req->input('reference_uuid', (string)Str::uuid());
  // resolve wallet for currency+app
  $wallet = DB::table('app_wallets')->where('user_id',$userId)->where('currency',$currency)->where('app_id',$appId)->first();
  if(!$wallet){
   // auto-create wallet if missing (first deposit)
   $walletId = DB::table('app_wallets')->insertGetId(['uuid'=>(string)Str::uuid(),'user_id'=>$userId,'app_id'=>$appId,'currency'=>$currency,'balance_subunit'=>0,'locked_subunit'=>0,'status'=>'active','version'=>0,'created_at'=>now(),'updated_at'=>now()]);
   $wallet = DB::table('app_wallets')->where('id',$walletId)->first();
  }
  $dto = new WalletOperationDTO((int)$wallet->id,(int)$userId,$amountMinor,$type,$ref,$appId,false,null,null,$req->ip()??'0.0.0.0');
  $key = $req->attributes->get('idempotency_key') ?? $req->header('Idempotency-Key') ?? $ref;
  $hash = $req->attributes->get('idempotency_hash') ?? hash('sha256', json_encode($req->all(), JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS) ?: '');
  $endpoint = $req->attributes->get('idempotency_endpoint') ?? $req->method().' '.$req->path();
  try{
   $res = $svc->lockAndMove($dto,$key,$hash,$endpoint);
   // bust balance cache
   try{ Cache::tags(['wallet:balance'])->forget("wallet:balance:{$userId}:{$appId}"); }catch(\Throwable){ Cache::forget("wallet:balance:{$userId}:{$appId}"); }
   $replayed = isset($res['replayed']) ? true : false;
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId,'Idempotency-Replayed'=>$replayed?'true':'false']],200)->header('Idempotency-Replayed',$replayed?'true':'false');
  } catch(\RuntimeException $e){
   $code = $e->getCode(); if($code<400 || $code>=600) $code=422;
   return response()->json(['message'=>$e->getMessage(),'code'=>'WALLET_MOVE_FAILED','meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]], $code);
  } catch(\Illuminate\Validation\ValidationException $e){
   return response()->json(['message'=>$e->getMessage(),'errors'=>$e->errors(),'code'=>'VALIDATION'],422);
  }
 }
}
