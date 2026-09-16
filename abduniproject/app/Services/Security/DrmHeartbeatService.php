<?php
// DrmHeartbeatService — Arena — B.3 — HMAC+nonce 5min ping, 48h=576 fails debounce, atomic quarantine, Reverb+email
declare(strict_types=1);
namespace App\Services\Security;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\Http; use Illuminate\Support\Facades\Mail;
final class DrmHeartbeatService {
 public function beat(): void {
  $fp=FingerprintService::generate();
  $nonce=bin2hex(random_bytes(16));
  $hmacKey=(string)env('DRM_HMAC_KEY','arena-drm-hmac-v1');
  $sig=hash_hmac('sha256',$nonce.$fp,$hmacKey);
  $url=(string)env('DRM_VERIFY_URL','');
  $ok=false;
  if($url){
   try{ $res=Http::timeout(5)->withHeaders(['X-Signature'=>$sig,'X-Nonce'=>$nonce])->post($url,['fingerprint'=>$fp,'nonce'=>$nonce]); $ok=$res->ok() && ($res->json('valid')===true); }catch(\Throwable $e){ $ok=false; }
  } else {
   // no remote configured → local fingerprint verify only
   $stored=DB::table('system_drm_states')->where('id',1)->value('hardware_fingerprint_hash');
   $ok=$stored ? (new FingerprintService)->verify($stored) : true;
  }
  if($ok){
   DB::table('system_drm_states')->where('id',1)->update(['last_heartbeat_at'=>now(3),'last_heartbeat_status'=>'ok','heartbeat_fail_count'=>0,'updated_at'=>now()]);
   Cache::forget('drm:active'); return;
  }
  DB::table('system_drm_states')->where('id',1)->increment('heartbeat_fail_count');
  DB::table('system_drm_states')->where('id',1)->update(['last_heartbeat_at'=>now(3),'last_heartbeat_status'=>'fail','updated_at'=>now()]);
  $fail=(int)DB::table('system_drm_states')->where('id',1)->value('heartbeat_fail_count');
  if($fail >= 576){ // 48h × 12 per hour (5min)
   DB::transaction(function(){
    $drm=DB::table('system_drm_states')->where('id',1)->lockForUpdate()->first();
    if($drm->is_quarantine_active) return;
    DB::table('system_drm_states')->where('id',1)->update(['is_quarantine_active'=>1,'quarantine_triggered_at'=>now(3),'grace_period_expires_at'=>now(3)->addDays(7),'updated_at'=>now()]);
    $payload=json_encode(['trigger'=>'heartbeat_48h','fail'=>$drm->heartbeat_fail_count??576], JSON_SORT_KEYS);
    DB::table('system_drm_events')->insert(['from_state'=>0,'to_state'=>1,'actor_type'=>'heartbeat','actor_id'=>null,'reason_code'=>'HEARTBEAT_48H_FAIL','ip_address'=>request()->ip() ?? '127.0.0.1','payload_hash'=>hash('sha256',$payload),'created_at'=>now(3)]);
   });
   Cache::forget('drm:active');
   try{ event(new \App\Events\DrmQuarantineTriggered('heartbeat_48h')); }catch(\Throwable){}
   // Email super_admin — queued via Mail
   try{ $admin=DB::table('users')->where('is_super_admin',1)->first(); if($admin) Mail::raw('Quarantine activated 48h heartbeat fail',fn($m)=>$m->to($admin->email)->subject('[DRM] Quarantine Activated')); }catch(\Throwable){}
  }
 }
}
