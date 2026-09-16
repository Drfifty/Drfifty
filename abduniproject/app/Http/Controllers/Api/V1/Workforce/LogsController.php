<?php
// LogsController — B.9 F-11 — Arena — thin logs stats isolated 10s cache
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Workforce;
use Illuminate\Http\JsonResponse; use App\Http\Requests\Workforce\LogsRequest;
use App\Domain\Workforce\Actions\TenantLogsAction; use App\Http\Resources\Workforce\ExecutionLogResource;
final class LogsController {
 public function index(int $id, LogsRequest $req, TenantLogsAction $action): JsonResponse {
  $v=$req->validated(); $user=$req->user(); $tenantId=(int)($user->id ?? $user->tenant_id ?? 0);
  $appId=(string)($req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU BUSINESS');
  if($id<1 || $id>13) return response()->json(['message'=>'Invalid agent_id 1..13'],422);
  try{
   $payload=$action->logs($tenantId,$appId,$id,$v);
   $data=collect($payload['data'] ?? [])->map(fn($r)=> (new ExecutionLogResource($r))->toArray($req))->all();
   return response()->json(['data'=>$data,'meta'=>['page'=>$payload['page'],'per_page'=>$payload['per_page'],'cached'=>$payload['cached']??false,'db_route'=>$payload['db_route']??'primary','trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->header('X-Cache',($payload['cached']??false)?'HIT':'MISS');
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=404;
   return response()->json(['message'=>$e->getMessage()], $c);
  }
 }
}
