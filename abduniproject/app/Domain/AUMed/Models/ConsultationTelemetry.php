<?php
// ConsultationTelemetry — Arena — B.5 — HMAC anonymized zero raw — WORM chain pgsql F-03
declare(strict_types=1);
namespace App\Domain\AUMed\Models;
use Illuminate\Database\Eloquent\Model; use Illuminate\Support\Facades\DB;
final class ConsultationTelemetry extends Model {
 protected $connection='pgsql'; protected $table='amed_consultation_telemetry';
 public $timestamps=false;
 protected $fillable=['appointment_id','nlp_hash','payload_hash','prev_hash','hash_current','app_id','created_at'];
 protected static function booted(): void {
  static::creating(function(self $m){
   if(empty($m->nlp_hash)){
    $key=env('TELEMETRY_HMAC_KEY','arena-telemetry-hmac-v1');
    $canonical=json_encode(['appointment'=>$m->appointment_id], JSON_SORT_KEYS);
    $m->nlp_hash=hash_hmac('sha256',$canonical,$key);
   }
   $prev=DB::connection('pgsql')->table('amed_consultation_telemetry')->where('appointment_id',$m->appointment_id)->orderByDesc('id')->value('hash_current');
   $m->prev_hash=$prev; $m->payload_hash=$m->payload_hash ?? $m->nlp_hash;
   $m->hash_current=hash('sha256', ($prev??'').$m->payload_hash);
  });
  static::updating(fn()=>false); static::deleting(fn()=>false);
 }
}
