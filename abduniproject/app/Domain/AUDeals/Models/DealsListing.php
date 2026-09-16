<?php
// DealsListing — Arena — B.5 — FULLTEXT ngram + SPATIAL SRID 4326 + app_id scoped R37 pre-aggregated
declare(strict_types=1);
namespace App\Domain\AUDeals\Models;
use Illuminate\Database\Eloquent\Model; use Illuminate\Database\Eloquent\Builder; use App\Domain\Shared\Traits\TenantScoped;
final class DealsListing extends Model {
 use TenantScoped;
 protected $table='deals_listings'; protected $fillable=['uuid','tenant_id','category_id','app_id','title','description','price_minor','currency','stock','geo_point','is_hidden','is_stagnant'];
 protected $casts=['price_minor'=>'integer','is_hidden'=>'boolean','is_stagnant'=>'boolean','created_at'=>'datetime'];
 public function category(){ return $this->belongsTo(DealCategory::class,'category_id'); }
 public function items(){ return $this->hasMany(DealItem::class,'listing_id'); }
 // FULLTEXT ngram search F-05
 public function scopeSearch(Builder $q, string $term): Builder {
  $t=trim($term); if($t==='') return $q;
  return $q->whereRaw("MATCH(title,description) AGAINST(? IN BOOLEAN MODE)", [$t]);
 }
 // SPATIAL radius F-06 SRID 4326
 public function scopeNearby(Builder $q, float $lng, float $lat, int $radiusM): Builder {
  return $q->whereRaw("ST_Distance_Sphere(geo_point, ST_SRID(POINT(?,?),4326)) < ?", [$lng,$lat,$radiusM]);
 }
}
