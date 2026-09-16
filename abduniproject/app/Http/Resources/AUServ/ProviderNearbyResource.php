<?php
// ProviderNearbyResource — B.7 F-04 — Arena — distance_m + micro payload
declare(strict_types=1);
namespace App\Http\Resources\AUServ;
use Illuminate\Http\Resources\Json\JsonResource;
final class ProviderNearbyResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  return [
   'id'=>$r->id ?? null,'uuid'=>$r->uuid ?? null,'specialty'=>$r->specialty ?? null,
   'distance_m'=>isset($r->distance_m)? (int)$r->distance_m : null,
   'is_active'=>(bool)($r->is_active ?? true),'app_id'=>$r->app_id ?? 'AU SERV',
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
