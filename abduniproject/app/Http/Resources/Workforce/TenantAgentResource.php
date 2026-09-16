<?php
// TenantAgentResource — B.9 F-09 — Arena — tenant isolated subscription + agent eager
declare(strict_types=1);
namespace App\Http\Resources\Workforce;
use Illuminate\Http\Resources\Json\JsonResource;
final class TenantAgentResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource; $isArr=is_array($r);
  $get=function($k,$d=null) use($r,$isArr){ return $isArr ? ($r[$k] ?? $d) : ($r->$k ?? $d); };
  return [
   'id'=>$get('id'),
   'agent_id'=>(int)($get('agent_id') ?? 0),
   'agent'=>$get('agent') ? ['id'=>$get('agent')['id'] ?? $get('agent')->id ?? null,'code'=>$get('agent')['code'] ?? $get('agent')->code ?? null,'name'=>$get('agent')['name'] ?? $get('agent')->name ?? null] : null,
   'app_id'=>$get('app_id'),
   'status'=>$get('status'),
   'started_at'=>$get('started_at'),
   'ends_at'=>$get('ends_at'),
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
