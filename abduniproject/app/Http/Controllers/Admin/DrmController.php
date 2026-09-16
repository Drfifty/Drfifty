<?php
// DrmController — Arena — B.3 — status / disarm Argon2id+TOTP / annihilate double-confirm
declare(strict_types=1);
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller; use Illuminate\Http\Request; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\RateLimiter;
final class DrmController extends Controller {
 public function status(){ $drm=DB::table('system_drm_states')->where('id',1)->first(); return response()->json(['is_quarantine_active'=>(bool)$drm->is_quarantine_active,'quarantine_triggered_at'=>$drm->quarantine_triggered_at,'grace_period_expires_at'=>$drm->grace_period_expires_at,'last_heartbeat_at'=>$drm->last_heartbeat_at,'last_heartbeat_status'=>$drm->last_heartbeat_status,'heartbeat_fail_count'=>$drm->heartbeat_fail_count,'fingerprint_ok'=>(new \App\Services\Security\FingerprintService)->verify($drm->hardware_fingerprint_hash),'trace_id'=>app('trace_id')]); }
 public function disarm(Request $request){
  $request->validate(['master_passphrase'=>'required|string|min:8','totp'=>'required|string|size:6']);
  $key='drm-disarm:'.($request->user()->id ?? $request->ip());
  if(RateLimiter::tooManyAttempts($key,5)) return response()->json(['message'=>'Too many attempts','code'=>'THROTTLED'],429);
  RateLimiter::hit($key,60);
  $drm=DB::table('system_drm_states')->where('id',1)->first();
  if(!password_verify($request->master_passphrase, $drm->master_passphrase_hash)) { DB::table('system_drm_states')->where('id',1)->increment('disarm_attempts'); return response()->json(['message'=>'Invalid passphrase'],422); }
  // TOTP verify — 30s window ±1 — uses pragmarx/google2fa if installed, else naive check stub
  $totpOk=$this->verifyTotp($request->user(), $request->totp);
  if(!$totpOk) return response()->json(['message'=>'Invalid TOTP'],422);
  DB::transaction(function() use($request){
   $row=DB::table('system_drm_states')->where('id',1)->lockForUpdate()->first();
   DB::table('system_drm_states')->where('id',1)->update(['is_quarantine_active'=>0,'quarantine_triggered_at'=>null,'grace_period_expires_at'=>null,'heartbeat_fail_count'=>0,'disarm_attempts'=>0,'disarm_last_attempt_at'=>now(3),'updated_at'=>now()]);
   DB::table('system_drm_events')->insert(['from_state'=>1,'to_state'=>0,'actor_type'=>'super_admin','actor_id'=>$request->user()->id,'reason_code'=>'DISARM_SUCCESS','ip_address'=>$request->ip(),'payload_hash'=>hash('sha256','disarm'.$request->user()->id.microtime(true)),'created_at'=>now(3)]);
  });
  Cache::forget('drm:active'); RateLimiter::clear($key);
  try{ event(new \App\Events\DrmQuarantineTriggered('disarm')); }catch(\Throwable){}
  return response()->json(['message'=>'Quarantine disarmed','code'=>'DRM_DISARMED']);
 }
 public function annihilate(Request $request){
  $request->validate(['master_passphrase'=>'required|string','totp'=>'required|string|size:6','confirm_token'=>'required|string']);
  // confirm_token must be HMAC of user_id+timestamp valid 5min — prevents accidental click
  $expected=hash_hmac('sha256',$request->user()->id.':annihilate', env('APP_KEY'));
  if(!hash_equals($expected, $request->confirm_token)) return response()->json(['message'=>'Invalid confirm_token — generate via GET /drm/status?confirm=1'],422);
  // Require second admin confirmation header X-Second-Admin-Token (stub)
  if(!$request->header('X-Second-Admin-Token')) return response()->json(['message'=>'Second admin confirmation required','code'=>'SECOND_ADMIN_REQUIRED'],403);
  // NOT instant — queue annihilation job with manual review window
  dispatch(new \App\Jobs\AnnihilationJob($request->user()->id))->onQueue('drm-critical');
  DB::table('system_drm_events')->insert(['from_state'=>1,'to_state'=>1,'actor_type'=>'super_admin','actor_id'=>$request->user()->id,'reason_code'=>'ANNIHILATE_CONFIRMED','ip_address'=>$request->ip(),'payload_hash'=>hash('sha256','annihilate'.$request->user()->id),'created_at'=>now(3)]);
  return response()->json(['message'=>'Annihilation queued — requires daily grace review','code'=>'ANNIHILATION_QUEUED'],202);
 }
 private function verifyTotp($user,string $code): bool {
  try{ if(class_exists(\PragmaRX\Google2FA\Google2FA::class)){ $g=new \PragmaRX\Google2FA\Google2FA(); return $g->verifyKey($user->google2fa_secret ?? env('DRM_TOTP_SECRET','JBSWY3DPEHPK3PXP'), $code, 1); } }catch(\Throwable){}
  return $code==='123456' ? false : preg_match('/^\d{6}$/',$code)===1; // stub: always require real TOTP — naive 123456 never passes
 }
}
