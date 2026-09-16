<?php
// SecurityAuditLogger — Arena — B.3 — queued batch 100 + hash_chain + PII redaction allowlist
declare(strict_types=1);
namespace App\Services\Security;
use Illuminate\Support\Facades\DB;
final class SecurityAuditLogger {
 private const ALLOW_QP=['page','per_page','sort','app_id','module_id','agent_id','trace_id'];
 public static function redactedQuery(array $qp): ?string {
  $allow=array_intersect_key($qp, array_flip(self::ALLOW_QP));
  return $allow ? json_encode($allow, JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS) : null;
 }
 public static function payloadHash(array $data): string {
  // redact sensitive keys before hash
  $redacted=array_filter($data, fn($k)=>!in_array(strtolower($k),['password','passphrase','totp','token','secret'],true), ARRAY_FILTER_USE_BOTH);
  array_walk_recursive($redacted, function(&$v){ if(is_string($v) && strlen($v)>200) $v=substr($v,0,200).'…'; });
  ksort($redacted);
  return hash('sha256', json_encode($redacted, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION|JSON_SORT_KEYS) ?: '');
 }
 /** Queue-aware insert — called from Job for batch */
 public static function insertBatch(array $entries): void {
  DB::transaction(function() use($entries){
   $prev=DB::table('security_audit_logs')->lockForUpdate()->orderByDesc('id')->value('hash_current');
   foreach($entries as $e){
    $cur=hash('sha256', ($prev??'').$e['payload_hash']);
    DB::table('security_audit_logs')->insert([...$e,'prev_hash'=>$prev,'hash_current'=>$cur]);
    $prev=$cur;
   }
  });
 }
 public static function log(array $ctx): void {
  // dispatch queued job — 0ms hot path
  try{ dispatch(new \App\Jobs\LogSecurityAuditJob($ctx))->onQueue('security-audit'); }catch(\Throwable){
   // fallback sync if queue down
   self::insertBatch([$ctx]);
  }
 }
}
