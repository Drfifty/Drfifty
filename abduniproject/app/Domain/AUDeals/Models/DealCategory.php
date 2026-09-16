<?php
declare(strict_types=1);
namespace App\Domain\AUDeals\Models;
use Illuminate\Database\Eloquent\Model; use App\Domain\Shared\Traits\TenantScoped;
final class DealCategory extends Model {
 use TenantScoped;
 protected $table='deal_categories'; protected $fillable=['uuid','parent_id','slug','name','name_ar','app_id','schema_json','is_hidden'];
 protected $casts=['schema_json'=>'array','is_hidden'=>'boolean'];
 public function parent(){ return $this->belongsTo(self::class,'parent_id'); }
 public function children(){ return $this->hasMany(self::class,'parent_id'); }
 public function listings(){ return $this->hasMany(DealsListing::class,'category_id'); }
}
