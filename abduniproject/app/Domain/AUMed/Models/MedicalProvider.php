<?php
declare(strict_types=1);
namespace App\Domain\AUMed\Models;
use Illuminate\Database\Eloquent\Model;
final class MedicalProvider extends Model {
 protected $connection='pgsql'; protected $table='amed_medical_providers';
 protected $fillable=['uuid','user_id','app_id','specialty','is_verified','clinic_location'];
 protected $casts=['is_verified'=>'boolean'];
 // GEOGRAPHY scope F-06 PostGIS
 public function scopeNearby($q, float $lng, float $lat, int $radiusM){
  return $q->whereRaw("ST_DWithin(clinic_location, ST_MakePoint(?,?)::geography, ?)", [$lng,$lat,$radiusM]);
 }
}
