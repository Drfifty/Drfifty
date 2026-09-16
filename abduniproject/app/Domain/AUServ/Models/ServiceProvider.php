<?php
// ServiceProvider — Arena — B.5 — POINT SRID 4326 + POLYGON + SPATIAL R37
declare(strict_types=1);
namespace App\Domain\AUServ\Models;
use Illuminate\Database\Eloquent\Model; use Illuminate\Database\Eloquent\Builder; use App\Domain\Shared\Traits\TenantScoped;
final class ServiceProvider extends Model {
 use TenantScoped;
 protected $table='service_providers'; protected $fillable=['uuid','user_id','app_id','specialty','is_active','provider_location','coverage_zone'];
 protected $casts=['is_active'=>'boolean'];
 public function user(){ return $this->belongsTo(\App\Models\User::class,'user_id'); }
 // Sub-ms radius F-06
 public function scopeWithinRadius(Builder $q, float $lng, float $lat, int $radiusM): Builder {
  return $q->whereRaw("ST_Distance_Sphere(provider_location, ST_SRID(POINT(?,?),4326)) < ?", [$lng,$lat,$radiusM]);
 }
 public function scopeCovers(Builder $q, float $lng, float $lat): Builder {
  return $q->whereRaw("ST_Within(ST_SRID(POINT(?,?),4326), coverage_zone)", [$lng,$lat]);
 }
}
