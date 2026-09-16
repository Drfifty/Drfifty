<?php
declare(strict_types=1);
namespace App\Domain\AUDeals\Models;
use Illuminate\Database\Eloquent\Model;
final class DealItem extends Model {
 protected $table='deal_items'; protected $fillable=['listing_id','sku','attributes','price_minor','stock'];
 protected $casts=['attributes'=>'array','price_minor'=>'integer'];
 public function listing(){ return $this->belongsTo(DealsListing::class,'listing_id'); }
}
