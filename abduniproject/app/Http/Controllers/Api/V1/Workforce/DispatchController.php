<?php
// DispatchController — B.9 F-08/F-12 — Arena — thin dispatch queued + budget/circuit/HITL 202
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Workforce;
use Illuminate\Http\JsonResponse; use App\Http\Requests\Workforce\DispatchRequest;
use App\Domain\Workforce\Actions\DispatchAction;
final class DispatchController {
 public function store(int $id, DispatchRequest $req, DispatchAction $action): JsonResponse {
  $v=$req->validated(); $user=$req->user(); $tenantId=(int)($user->id ?? $user->tenant_id ?? 0);
  $appId=(string)($req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU BUSINESS');
  $agentId=$id ?: (int)($v['agent_id'] ?? 0);
  if($agentId<1 || $agentId>13) return response()->json(['message'=>'Invalid agent_id 1..13'],422);
  try{
   $res=$action->execute($tenantId,$appId,$agentId,(array)($v['task_payload'] ?? []),$req->ip()??'0.0.0.0');
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>$res['trace_id']??null]],200)->header('Idempotency-Replayed','false');
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c===202) return response()->json(['message'=>'HITL approval required','code'=>'HITL_APPROVAL_REQUIRED'],202);
   if($c<400||$c>=600) $c= $c===429?429:($c===503?503:($c===403?403:422));
   return response()->json(['message'=>$e->getMessage()], $c);
  }
 }
}
