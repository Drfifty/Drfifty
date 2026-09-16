<?php
// AuthUserResource — B.6 F-09 — Arena — allowlist only + hashed id for logs
declare(strict_types=1);
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
final class AuthUserResource extends JsonResource {
 public function toArray($request): array {
  $u = $this->resource;
  return [
   'id'=>$u->id ?? $u['id'] ?? null,'uuid'=>$u->uuid ?? $u['uuid'] ?? null,
   'name'=>$u->name ?? $u['name'] ?? null,'email'=>$u->email ?? $u['email'] ?? null,
   'app_id'=>$u->app_id ?? 'AU BUSINESS','status'=>$u->status ?? 'active',
   'locale'=>$u->locale ?? 'ar','email_verified'=>!empty($u->email_verified_at ?? null),
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
