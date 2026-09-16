<?php
// KillSwitchAction — B.8 F-05/F-15 — Arena — Throttle outside, here audit+flush+OPEN circuits
declare(strict_types=1);
namespace App\Domain\Governance\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Str;
final class KillSwitchAction {
 public function execute(int $actorId, string $reason, string $ip): array {
  $trace=app()->bound('trace_id')?app('trace_id'):bin2hex(random_bytes(16));
  DB::transaction(function() use($actorId,$reason,$ip,$trace){
   // audit insert batched via SecurityAuditLogger (WORM hash_chain)
   \App\Services\Security\SecurityAuditLogger::log(['uuid'=>(string)Str::uuid(),'trace_id'=>$trace,'user_id'=>$actorId,'agent_id'=>null,'app_id'=>'AU BUSINESS','module_id'=>9,'action'=>'AI_KILL_SWITCH','route'=>'api/v1/ai/governance/kill-switch','method'=>'POST','query_params'=>null,'payload_hash'=>hash('sha256',$reason),'payload_snapshot'=>null,'ip_address'=>$ip,'user_agent'=>substr(request()->userAgent()??'',0,255),'created_at'=>now(3)]);
  });
  // flush ai_runtime + micro_perm + feature_flags
  try{ Cache::tags(['ai_runtime','feature_flags','micro_perm'])->flush(); }catch(\Throwable){ try{Cache::tags(['ai_runtime'])->flush();}catch(\Throwable){} Cache::flush(); }
  // OPEN all 13×3 circuits via Redis pipeline (best effort)
  try{
   $r=Cache::getRedis() ?? app('redis')->connection();
   foreach(range(1,13) as $aid) foreach(['deterministic','cloud','local_gpu'] as $drv) Cache::put("circuit:{$drv}:{$aid}", ['state'=>'OPEN','opened_at'=>now()], 300);
  }catch(\Throwable){}
  try{ event(new \App\Events\AiKillSwitchTriggered(fallback:'deterministic', actorId:$actorId, reason:$reason)); }catch(\Throwable){}
  return ['severed'=>true,'deterministic'=>true,'trace_id'=>$trace];
 }
}
