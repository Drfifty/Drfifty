<?php
// ProviderResource — B.7 F-07 — Arena — pgsql trust pre-aggregated
declare(strict_types=1);
namespace App\Http\Resources\AUMed;
use Illuminate\Http\Resources\Json\JsonResource;
final class ProviderResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  return [
   'id'=>$r->id,'uuid'=>$r->uuid ?? null,'specialty'=>$r->specialty ?? null,
   'is_verified'=>(bool)($r->is_verified ?? false),'trust_score'=>$r->trust_score ?? null,
   'app_id'=>$r->app_id ?? 'AU MED','clinic_location'=>isset($r->clinic_location)? (string)$r->clinic_location : null,
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
