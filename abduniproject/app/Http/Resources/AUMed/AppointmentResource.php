<?php
// AppointmentResource — B.7 F-07 — Arena — never exposes complaint_encrypted raw, only decrypted accessor not returned
declare(strict_types=1);
namespace App\Http\Resources\AUMed;
use Illuminate\Http\Resources\Json\JsonResource;
final class AppointmentResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  return [
   'id'=>$r->id,'uuid'=>$r->uuid ?? null,'provider_id'=>$r->provider_id ?? null,
   'patient_user_id'=>$r->patient_user_id ?? null,'scheduled_at'=>$r->scheduled_at ?? null,
   'status'=>$r->status ?? 'scheduled','app_id'=>$r->app_id ?? 'AU MED',
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
