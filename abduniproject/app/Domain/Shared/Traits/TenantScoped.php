<?php
// TenantScoped — Arena — B.5 — app_id multi-tenancy R12
declare(strict_types=1);
namespace App\Domain\Shared\Traits;
use Illuminate\Database\Eloquent\Builder;
trait TenantScoped {
 public function scopeTenant(Builder $q, string $appId): Builder { return $q->where('app_id',$appId); }
 public function scopeActive(Builder $q): Builder { return $q->where('is_active',1); }
}
