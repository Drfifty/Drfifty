<?php
// TenantController — B.9 F-09 — Arena — thin tenant-agents cursor20 isolated
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Workforce;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse;
use App\Domain\Workforce\Actions\TenantLogsAction; use App\Http\Resources\Workforce\TenantAgentResource;
final class TenantController {
 public function index(Request $req, TenantLogsAction $action): JsonResponse {
  $user=$req->user(); $tenantId=(int)($user->id ?? $user->tenant_id ?? 0);
  $appId=(string)($req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU BUSINESS');
  $page=max(1,(int)($req->query('page',1))); $perPage=min(20,max(1,(int)($req->query('per_page',20))));
  $payload=$action->tenantAgents($tenantId,$appId,$page,$perPage);
  $data=collect($payload['data'] ?? [])->map(fn($r)=> (new TenantAgentResource($r))->toArray($req))->all();
  return response()->json(['data'=>$data,'meta'=>['page'=>$payload['page'],'per_page'=>$payload['per_page'],'trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200);
 }
}
