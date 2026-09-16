<?php
// ModuleStatusResource — B.8 F-04 — Arena — flag_key/is_core/hibernated + micro snapshot
declare(strict_types=1);
namespace App\Http\Resources\Governance;
use Illuminate\Http\Resources\Json\JsonResource;
final class ModuleStatusResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  return [
   'modules'=>$r['modules'] ?? [],'agents'=>$r['agents'] ?? [],
   'quarantine'=>$r['quarantine'] ?? false,'degraded'=>$r['degraded'] ?? false,
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'cached'=> $r['cached'] ?? false],
  ];
 }
}
