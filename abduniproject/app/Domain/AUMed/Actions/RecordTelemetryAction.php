<?php
// RecordTelemetryAction — B.7 F-07 — Arena — HMAC TELEMETRY_HMAC_KEY + prev/hash_current WORM partitioned 90d
declare(strict_types=1);
namespace App\Domain\AUMed\Actions;
use Illuminate\Support\Facades\DB;
final class RecordTelemetryAction {
 public function execute(array $v, string $appId='AU MED'): array {
  $pg=DB::connection('pgsql');
  $appointment=$pg->table('amed_medical_appointments')->where('id',$v['appointment_id'])->first();
  if(!$appointment) throw new \RuntimeException('Appointment not found',404);
  $canonical=$v['nlp_canonical_json']; if(is_array($canonical)) { ksort($canonical); $canonical=json_encode($canonical, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'{}'; }
  $hmacKey=env('TELEMETRY_HMAC_KEY','arena-telemetry-hmac-v1-change-in-prod');
  $nlpHash=hash_hmac('sha256',(string)$canonical,$hmacKey);
  $payloadHash=hash('sha256',(string)$canonical);
  $prev=$pg->table('amed_consultation_telemetry')->orderByDesc('id')->value('hash_current');
  $cur=hash('sha256',($prev??'').$payloadHash.$nlpHash);
  $id=$pg->table('amed_consultation_telemetry')->insertGetId(['appointment_id'=>$v['appointment_id'],'nlp_hash'=>$nlpHash,'payload_hash'=>$payloadHash,'prev_hash'=>$prev,'hash_current'=>$cur,'app_id'=>$appId,'created_at'=>now()], 'id');
  return ['id'=>$id,'appointment_id'=>$v['appointment_id'],'nlp_hash'=>$nlpHash,'payload_hash'=>$payloadHash,'hash_current'=>$cur];
 }
}
