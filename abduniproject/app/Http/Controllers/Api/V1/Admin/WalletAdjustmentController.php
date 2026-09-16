<?php
// WalletAdjustmentController — B.6 F-05/F-01 — Arena — super_admin via micro + Gate — TRIM≥15 + ip + WORM
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Admin;
use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\DB; use Illuminate\Support\Str;
use App\Http\Requests\Wallet\WalletAdjustmentRequest;
use App\Domain\Escrow\DTOs\WalletOperationDTO; use App\Domain\Escrow\Actions\EscrowLockService;
final class WalletAdjustmentController {
 public function adjust(WalletAdjustmentRequest $req, EscrowLockService $svc): JsonResponse {
  $v=$req->validated();
  $rationale=trim((string)$v['mandatory_rationale']);
  if(mb_strlen($rationale)<15) return response()->json(['message'=>'mandatory_rationale min 15 after trim','code'=>'VALIDATION'],422);
  $userId=$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? null;
  $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU BUSINESS';
  $wallet=DB::table('app_wallets')->where('id',$v['wallet_id'])->first();
  if(!$wallet) return response()->json(['message'=>'Wallet not found'],404);
  $amountMinor=abs((int)$v['amount_minor']);
  $type = (int)$v['amount_minor'] > 0 ? 'adjustment' : 'withdrawal'; // positive credit
  // For negative adjustment we treat as debit
  if((int)$v['amount_minor'] < 0) $type='withdrawal';
  $dto=new WalletOperationDTO((int)$wallet->id,(int)$userId,$amountMinor,$type,(string)$v['reference_uuid'],$appId,true,$rationale,null,$req->ip()??'0.0.0.0');
  $key=$req->attributes->get('idempotency_key') ?? $req->header('Idempotency-Key') ?? $v['reference_uuid'];
  $hash=$req->attributes->get('idempotency_hash') ?? hash('sha256', json_encode($v, JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'');
  $endpoint=$req->attributes->get('idempotency_endpoint') ?? $req->method().' '.$req->path();
  try{
   $res=$svc->lockAndMove($dto,$key,$hash,$endpoint);
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->header('Idempotency-Replayed','false');
  }catch(\Illuminate\Validation\ValidationException $e){
   return response()->json(['message'=>$e->getMessage(),'errors'=>$e->errors()],422);
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=422;
   return response()->json(['message'=>$e->getMessage(),'code'=>'ADJUST_FAILED'], $c);
  }
 }
}
