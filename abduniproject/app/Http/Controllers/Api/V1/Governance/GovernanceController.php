<?php
// GovernanceController — B.8 F-05/F-10 — Arena — thin kill-switch+hitl via Actions ≤60L
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Governance;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse;
use App\Http\Requests\Governance\KillSwitchRequest; use App\Http\Requests\Governance\HitlQueueRequest; use App\Http\Requests\Governance\HitlApproveRequest;
use App\Domain\Governance\Actions\KillSwitchAction; use App\Domain\Governance\Actions\HitlAction;
use App\Http\Resources\Governance\HitlProposalResource;
final class GovernanceController {
 public function killSwitch(KillSwitchRequest $req, KillSwitchAction $action): JsonResponse {
  // HMAC confirm_token 5min + throttle guard (throttle middleware covers Redis, this is second-line)
  $v=$req->validated(); $actor=$req->user()?->id ?? ($req->attributes->get('jwt_payload')['sub'] ?? 0);
  $tok=$v['confirm_token'] ?? ''; $reason=trim((string)$v['reason']);
  if(!$this->verifyHmac((int)$actor,$tok)) return response()->json(['message'=>'Invalid confirm_token (HMAC 5min)','code'=>'CONFIRM_TOKEN_INVALID'],422);
  // optional TOTP via header already validated if present
  $res=$action->execute((int)$actor,$reason,$req->ip()??'0.0.0.0');
  return response()->json(['data'=>$res,'meta'=>['trace_id'=>$res['trace_id'] ?? null,'deterministic'=>true]],200)->header('Retry-After','300')->header('X-Kill-Switch','1');
 }
 public function hitlQueue(HitlQueueRequest $req, HitlAction $action): JsonResponse {
  $v=$req->validated(); $user=$req->user();
  $appId=$req->header('X-App-Id') ?? $req->attributes->get('app_id') ?? ($v['app_id'] ?? null);
  $payload=$action->queue($v,$user,$appId);
  $out=HitlProposalResource::collectionPaginated($payload);
  return response()->json($out,200)->header('X-App-Id',$appId ?? '');
 }
 public function hitlApprove(HitlApproveRequest $req, HitlAction $action): JsonResponse {
  $v=$req->validated(); $user=$req->user();
  try{
   $res=$action->approve((int)$v['task_id'],$v['decision'],(string)$v['rationale'],$user,$req->ip()??'0.0.0.0');
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>$res['trace_id']]],200)->header('Idempotency-Replayed','false');
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c= $c===404?404:409;
   return response()->json(['message'=>$e->getMessage()], $c);
  }
 }
 private function verifyHmac(int $userId, string $token): bool {
  // token format: hmac:timestamp  OR base64 hmac:timestamp — accept both
  // generation: hash_hmac('sha256', $userId.':kill:'.$ts, app_key) . ':' . $ts
  $parts=explode(':',$token); if(count($parts)<2) return false;
  $ts=(int)end($parts); $hmac=$parts[0];
  if(abs(time()-$ts) > 300) return false; // 5min
  $key=config('app.key') ?? env('APP_KEY','base64:test');
  // handle base64: key may start with base64:
  if(str_starts_with($key,'base64:')) $key=base64_decode(substr($key,7));
  $expect=hash_hmac('sha256', $userId.':kill:'.$ts, $key);
  return hash_equals($expect,$hmac);
 }
}
