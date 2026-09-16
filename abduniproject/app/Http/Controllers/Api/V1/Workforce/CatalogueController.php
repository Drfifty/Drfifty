<?php
// CatalogueController — B.9 F-09 — Arena — thin ≤60L catalogue browse cached 60s
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Workforce;
use Illuminate\Http\JsonResponse; use App\Http\Requests\Workforce\CatalogueRequest;
use App\Domain\Workforce\Actions\CatalogueAction; use App\Http\Resources\Workforce\WorkforceCatalogResource;
final class CatalogueController {
 public function index(CatalogueRequest $req, CatalogueAction $action): JsonResponse {
  $v=$req->validated(); $payload=$action->execute($v);
  $data=collect($payload['data'] ?? [])->map(fn($r)=> (new WorkforceCatalogResource($r))->toArray($req))->all();
  return response()->json(['data'=>$data,'meta'=>['page'=>$payload['page'],'per_page'=>$payload['per_page'],'cached'=>$payload['cached']??false,'db_route'=>$payload['db_route']??'primary','trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->header('X-Cache',($payload['cached']??false)?'HIT':'MISS')->header('X-DB-Route',$payload['db_route']??'primary');
 }
}
