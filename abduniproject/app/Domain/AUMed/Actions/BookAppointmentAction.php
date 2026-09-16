<?php
// BookAppointmentAction — B.7 F-07 — Arena — pgsql pgp_sym_encrypt with PGCRYPTO_KEY — connection pgsql
declare(strict_types=1);
namespace App\Domain\AUMed\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Str;
final class BookAppointmentAction {
 public function execute(array $v, int $patientUserId, string $appId='AU MED'): object {
  $pg = DB::connection('pgsql');
  $provider=$pg->table('amed_medical_providers')->where('id',$v['provider_id'])->first();
  if(!$provider) throw new \RuntimeException('Provider not found',404);
  if(($provider->app_id ?? 'AU MED')!=='AU MED') throw new \RuntimeException('Provider app mismatch',422);
  $uuid=(string)Str::uuid();
  $key=env('PGCRYPTO_KEY','arena-pgcrypto-key-v1-change-in-prod');
  $scheduled=$v['scheduled_at'];
  $complaint=$v['complaint_raw'];
  // pgsql encrypted insert via raw pgp_sym_encrypt
  $pg->statement("INSERT INTO amed_medical_appointments (uuid, patient_user_id, provider_id, app_id, complaint_encrypted, scheduled_at, status, created_at) VALUES (?, ?, ?, ?, pgp_sym_encrypt(?, ?), ?, 'scheduled', NOW())", [$uuid,$patientUserId,$v['provider_id'],$appId,$complaint,$key,$scheduled]);
  $row=$pg->table('amed_medical_appointments')->where('uuid',$uuid)->first();
  return $row;
 }
}
