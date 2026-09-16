<?php
// MedicalAppointment — Arena — B.5 — pgsql + pgcrypto pgp_sym_encrypt — connection pgsql
declare(strict_types=1);
namespace App\Domain\AUMed\Models;
use Illuminate\Database\Eloquent\Model; use Illuminate\Support\Facades\DB;
final class MedicalAppointment extends Model {
 protected $connection='pgsql'; protected $table='amed_medical_appointments';
 protected $fillable=['uuid','patient_user_id','provider_id','app_id','complaint_encrypted','scheduled_at','status'];
 protected $casts=['scheduled_at'=>'datetime'];
 // Decrypt accessor via pgcrypto (F-04) — uses PGCRYPTO_KEY env
 public function getComplaintAttribute(): ?string {
  if(!$this->complaint_encrypted) return null;
  try{
   $row=DB::connection('pgsql')->selectOne("SELECT pgp_sym_decrypt(?::bytea, ?) as plain", [$this->complaint_encrypted, env('PGCRYPTO_KEY','arena-pgcrypto-key-v1')]);
   return $row->plain ?? null;
  }catch(\Throwable){ return null; }
 }
 public function setComplaintAttribute(string $plain): void {
  $enc=DB::connection('pgsql')->selectOne("SELECT pgp_sym_encrypt(?, ?) as enc", [$plain, env('PGCRYPTO_KEY','arena-pgcrypto-key-v1')]);
  $this->attributes['complaint_encrypted']=$enc->enc ?? $plain;
 }
 public function provider(){ return $this->belongsTo(MedicalProvider::class,'provider_id'); }
}
