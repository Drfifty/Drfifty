<?php
// RotateTokenAction — B.6 F-04 — Arena — hashed family + reuse revocation + single-flight via Cache::lock
declare(strict_types=1);
namespace App\Domain\Auth\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Str; use App\Services\Auth\JwtService;
final class RotateTokenAction {
 private const REFRESH_TTL_DAYS = 7; // 20160 min
 public function issueFamily(int $userId, string $ip, string $ua, string $appId='AU BUSINESS'): array {
  $raw = bin2hex(random_bytes(32)); // 64 hex
  $hash = hash('sha256',$raw);
  $device = hash('sha256',$ip.'|'.substr($ua,0,255).'|'.$appId);
  $expires = now()->addDays(self::REFRESH_TTL_DAYS);
  DB::table('refresh_tokens')->insert([
   'uuid'=>(string)Str::uuid(),'user_id'=>$userId,'token_hash'=>$hash,
   'device_fingerprint'=>$device,'ip_address'=>$ip,'user_agent'=>substr($ua,0,500),
   'expires_at'=>$expires,'revoked_at'=>null,'rotated_from_id'=>null,'last_used_at'=>now(),
   'created_at'=>now(),'updated_at'=>now(),
  ]);
  $access = JwtService::issueAccess($userId,$appId, app()->bound('trace_id')?app('trace_id'):null);
  return ['access'=>$access,'refresh_raw'=>$raw,'refresh_hash'=>$hash,'expires_at'=>$expires];
 }
 public function refreshFromCookie(string $rawCookie, string $ip, string $ua): array {
  $hash = hash('sha256', trim($rawCookie));
  $lock = Cache::lock('refresh:'.$hash,5);
  try{ $lock->block(3); }catch(\Throwable){}
  try{
   $row = DB::table('refresh_tokens')->where('token_hash',$hash)->lockForUpdate()->first();
   if(!$row) throw new \RuntimeException('Invalid refresh token',401);
   if($row->revoked_at) {
    // REUSE DETECTED — revoke entire family chain
    $this->revokeFamily($row->user_id,$hash);
    throw new \RuntimeException('Refresh token reuse detected — family revoked',401);
   }
   if(now()->greaterThan($row->expires_at)) throw new \RuntimeException('Refresh token expired',401);
   // rotate: revoke old
   DB::table('refresh_tokens')->where('id',$row->id)->update(['revoked_at'=>now(),'last_used_at'=>now()]);
   // issue new
   $new = $this->issueFamily((int)$row->user_id,$ip,$ua,(string)($row->app_id ?? 'AU BUSINESS'));
   // link chain
   try{ DB::table('refresh_tokens')->where('token_hash',$new['refresh_hash'])->update(['rotated_from_id'=>$row->id]); }catch(\Throwable){}
   $access = $new['access'];
   return ['user_id'=>$row->user_id,'access'=>$access,'refresh_raw'=>$new['refresh_raw']];
  } finally { try{$lock->release();}catch(\Throwable){} }
 }
 private function revokeFamily(int $userId, string $anyHash): void {
  try{
   DB::table('refresh_tokens')->where('user_id',$userId)->whereNull('revoked_at')->update(['revoked_at'=>now()]);
   // async audit
   \App\Services\Security\SecurityAuditLogger::log([
    'uuid'=>(string)Str::uuid(),'trace_id'=>app()->bound('trace_id')?app('trace_id'):bin2hex(random_bytes(16)),
    'user_id'=>$userId,'agent_id'=>null,'app_id'=>null,'module_id'=>null,'action'=>'REFRESH_REUSE_DETECTED',
    'route'=>'api/v1/auth/refresh','method'=>'POST','query_params'=>null,'payload_hash'=>hash('sha256','reuse:'.$anyHash),
    'payload_snapshot'=>null,'ip_address'=>request()->ip()??'0.0.0.0','user_agent'=>substr(request()->userAgent()??'',0,255),'created_at'=>now(3),
   ]);
  }catch(\Throwable){}
 }
}
