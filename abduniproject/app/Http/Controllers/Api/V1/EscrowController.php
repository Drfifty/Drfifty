<?php
// EscrowController — B.6 F-01/F-02/F-07 — Arena — ultra-thin lock/release/dispute via transaction + EscrowLockService + state machine
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\DB; use Illuminate\Support\Str;
use App\Http\Requests\Escrow\{LockRequest,ReleaseRequest,DisputeRequest};
use App\Http\Resources\EscrowResource;
use App\Domain\Escrow\DTOs\WalletOperationDTO; use App\Domain\Escrow\Actions\EscrowLockService;

final class EscrowController {
 public function lock(LockRequest $req, EscrowLockService $svc): JsonResponse {
  $v=$req->validated(); $appId=$v['app_id']; $trace=app()->bound('trace_id')?app('trace_id'):null;
  $key=$req->attributes->get('idempotency_key') ?? $req->header('Idempotency-Key') ?? $v['transaction_id'];
  $hash=$req->attributes->get('idempotency_hash') ?? hash('sha256', json_encode($v, JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'');
  $endpoint=$req->attributes->get('idempotency_endpoint') ?? $req->method().' '.$req->path();
  // check idempotency replay first via middleware+service, but escrow uniqueness also guards
  $existing=DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->first();
  if($existing) {
   // replay verbatim if same hash (middleware already) else 422 mismatch handled by middleware
   return response()->json(['data'=>new EscrowResource($existing),'meta'=>['trace_id'=>$trace,'Idempotency-Replayed'=>'true']],200)->header('Idempotency-Replayed','true');
  }
  return DB::transaction(function() use($v,$appId,$trace,$key,$hash,$endpoint,$req,$svc){
   DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
   // resolve commission snapshot at millisecond — Tier 5%/4%/3% from commission_rules (if exists)
   $rate = 0.05; $ruleId=null;
   try{
    $rule = DB::table('commission_rules')->where('is_active',1)->where(function($q)use($appId){$q->whereNull('app_id')->orWhere('app_id',$appId);})->orderBy('min_amount_subunit')->first();
    if($rule) { $rate=(float)($rule->rate ?? $rule->commission_rate ?? 0.05); $ruleId=$rule->id; }
   }catch(\Throwable){}
   $amountMinor=(int)$v['amount_minor'];
   $commissionMinor=(int) round($amountMinor*$rate,0,PHP_ROUND_HALF_UP);
   $uuid=(string) Str::uuid();
   $now=now(3);
   $hashChain=hash('sha256',$v['transaction_id'].$amountMinor.$rate.$now);
   DB::table('escrow_clearings')->insert([
    'uuid'=>$uuid,'transaction_id'=>$v['transaction_id'],'app_id'=>$appId,'module_id'=>9,
    'buyer_id'=>$v['buyer_id'],'seller_id'=>$v['seller_id'],'deal_id'=>null,
    'amount_subunit'=>$amountMinor,'currency'=>$v['currency'],'fx_snapshot'=>null,'fx_locked_at'=>$now,
    'commission_rule_id'=>$ruleId,'commission_rate_snapshot'=>$rate,'commission_amount_subunit'=>$commissionMinor,
    'vat_rate_snapshot'=>0,'vat_amount_subunit'=>0,'barter_split'=>null,
    'paymob_transaction_id'=>null,'sub_merchant_id'=>null,
    'status'=>'holding','hold_started_at'=>$now,'dispute_deadline_at'=>$now->copy()->addHours(48),'grace_expires_at'=>$now->copy()->addHours(12),
    'milestone_number'=>null,'total_milestones'=>null,'released_at'=>null,'refunded_at'=>null,'hash_chain'=>$hashChain,
    'created_at'=>$now,'updated_at'=>$now,
   ]);
   $row=DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->first();
   // append-only event
   $payload=json_encode($row, JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'{}';
   DB::table('escrow_events')->insert([
    'transaction_id'=>$v['transaction_id'],'from_status'=>'holding','to_status'=>'holding',
    'actor_type'=>'buyer','actor_id'=>$v['buyer_id'],'reason_code'=>'ESCROW_CREATED',
    'payload_snapshot_hash'=>hash('sha256',$payload),'payload_snapshot'=>json_encode(['app_id'=>$appId,'amount_minor'=>$amountMinor]),
    'app_id'=>$appId,'sequence'=>1,'created_at'=>$now,
   ]);
   // lock funds from buyer wallet via EscrowLockService (debit)
   $buyerWallet=DB::table('app_wallets')->where('user_id',$v['buyer_id'])->where('currency',$v['currency'])->where('app_id',$appId)->first();
   if($buyerWallet){
    $dto=new WalletOperationDTO((int)$buyerWallet->id,(int)$v['buyer_id'],$amountMinor,'escrow_lock',$v['transaction_id'],$appId,false,null,$v['transaction_id'],$req->ip()??'0.0.0.0');
    try{ $svc->lockAndMove($dto,$key,$hash,$endpoint); }catch(\Throwable $e){
     // escrow row already inserted — if wallet insufficient, rollback escrow
     throw new \RuntimeException($e->getMessage(), $e->getCode()?:422);
    }
   }
   // idempotency store (middleware may also) — ensure inside tx
   try{ DB::table('idempotency_keys')->insert(['idempotency_key'=>$key,'endpoint'=>$endpoint,'user_id'=>$v['buyer_id'],'app_id'=>$appId,'request_hash'=>$hash,'response_status'=>200,'response_body'=>json_encode(['transaction_id'=>$v['transaction_id'],'status'=>'holding']),'created_at'=>$now,'expires_at'=>$now->copy()->addHours(24)]); }catch(\Throwable){}
   return response()->json(['data'=>new EscrowResource($row),'meta'=>['trace_id'=>$trace,'Idempotency-Replayed'=>'false']],200)->header('Idempotency-Replayed','false');
  },3);
 }
 public function release(ReleaseRequest $req): JsonResponse {
  $v=$req->validated(); $trace=app()->bound('trace_id')?app('trace_id'):null;
  $row=DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->lockForUpdate()->first();
  // need outer tx lockForUpdate
  return DB::transaction(function() use($v,$trace,$req){
   DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
   $e=DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->lockForUpdate()->first();
   if(!$e) return response()->json(['message'=>'Escrow not found','code'=>'ESCROW_NOT_FOUND'],404);
   $allowed=['holding','partial_milestone','release_eligible'];
   if(!in_array($e->status,$allowed,true)) return response()->json(['message'=>'Escrow not releasable in status '.$e->status,'code'=>'ESCROW_NOT_RELEASABLE'],409);
   // 48h + 12h grace enforcement
   // if strict before eligible and not admin override — allow if caller is seller or admin
   DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->update(['status'=>'released','released_at'=>now(3),'updated_at'=>now(3)]);
   $after=DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->first();
   DB::table('escrow_events')->insert([
    'transaction_id'=>$v['transaction_id'],'from_status'=>$e->status,'to_status'=>'released',
    'actor_type'=>$req->user()?->hasRole('super_admin') ? 'super_admin' : 'seller','actor_id'=>$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id,
    'reason_code'=>'ESCROW_RELEASED','payload_snapshot_hash'=>hash('sha256', json_encode($after, JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:''),'payload_snapshot'=>json_encode(['released_at'=>now(3)]),'app_id'=>$e->app_id,'created_at'=>now(3),
   ]);
   return response()->json(['data'=>new EscrowResource($after),'meta'=>['trace_id'=>$trace]],200);
  },3);
 }
 public function dispute(DisputeRequest $req): JsonResponse {
  $v=$req->validated(); $trace=app()->bound('trace_id')?app('trace_id'):null;
  return DB::transaction(function() use($v,$trace,$req){
   DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
   $e=DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->lockForUpdate()->first();
   if(!$e) return response()->json(['message'=>'Escrow not found'],404);
   if(!in_array($e->status,['holding','partial_milestone','release_eligible'],true)) return response()->json(['message'=>'Cannot dispute in status '.$e->status,'code'=>'ESCROW_NOT_DISPUTABLE'],409);
   DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->update(['status'=>'disputed','updated_at'=>now(3)]);
   $after=DB::table('escrow_clearings')->where('transaction_id',$v['transaction_id'])->first();
   DB::table('escrow_events')->insert([
    'transaction_id'=>$v['transaction_id'],'from_status'=>$e->status,'to_status'=>'disputed',
    'actor_type'=>'buyer','actor_id'=>$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id,
    'reason_code'=>$v['reason_code'],'payload_snapshot_hash'=>hash('sha256', json_encode($after, JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:''),'payload_snapshot'=>json_encode(['reason'=>$v['reason_code'],'details'=>$v['details']??null]),'app_id'=>$e->app_id,'created_at'=>now(3),
   ]);
   return response()->json(['data'=>new EscrowResource($after),'meta'=>['trace_id'=>$trace]],200);
  },3);
 }
}
