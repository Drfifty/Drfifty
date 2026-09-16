<?php
// HealthScoreResource — B.8 F-09 — Arena — 100→0 from stats cache 10s
declare(strict_types=1);
namespace App\Http\Resources\Governance;
use Illuminate\Http\Resources\Json\JsonResource;
final class HealthScoreResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  return [
   'health_pct'=>(int)($r['health_pct'] ?? 100),'status'=>$r['status'] ?? 'healthy',
   'self_healing'=>$r['self_healing'] ?? [],'score_detail'=>$r['detail'] ?? null,
   'cached'=>$r['cached'] ?? false,'db_route'=>$r['db_route'] ?? 'primary',
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'cached_at'=>$r['cached_at'] ?? null],
  ];
 }
}
