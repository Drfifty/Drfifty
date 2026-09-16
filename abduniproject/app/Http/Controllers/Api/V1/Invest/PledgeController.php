<?php
// PledgeController — B.7 F-06/F-10 — Arena — WORM chain + Idempotency inside tx
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Invest;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse;
use App\Http\Requests\AUInvest\PledgeRequest;
use App\Domain\AUInvest\Actions\PledgeEscrowAction;
final class PledgeController {
 public function pledge(PledgeRequest $req, PledgeEscrowAction $action): JsonResponse {
  $v=$req->validated(); $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU INVEST';
  $uid=$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? 0;
  $key=$req->attributes->get('idempotency_key') ?? $req->header('Idempotency-Key') ?? $v['reference_uuid'];
  $hash=$req->attributes->get('idempotency_hash') ?? hash('sha256', json_encode($v, JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'');
  $endpoint=$req->attributes->get('idempotency_endpoint') ?? $req->method().' '.$req->path();
  try{
   $res=$action->execute($v,(int)$uid,$req->ip()??'0.0.0.0',$key,$hash,$endpoint,$appId);
   $replayed=isset($res['replayed'])?true:false;
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId,'Idempotency-Replayed'=>$replayed?'true':'false']],200)->header('Idempotency-Replayed',$replayed?'true':'false');
  }catch(\Illuminate\Validation\ValidationException $e){
   return response()->json(['message'=>$e->getMessage(),'errors'=>$e->errors()],422);
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=422;
   return response()->json(['message'=>$e->getMessage(),'code'=>'PLEDGE_FAILED'], $c);
  }
 }
}
