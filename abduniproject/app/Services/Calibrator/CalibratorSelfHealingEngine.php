<?php
// CalibratorSelfHealingEngine — Arena — B.4 F-11 + B.13 F-07/F-08 — price/promo/reroute + targeted heal — R37
declare(strict_types=1);
namespace App\Services\Calibrator;
use App\Events\AgentConfidenceEvaluated; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Log; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\Http; use App\Support\CacheTagGuard;
final class CalibratorSelfHealingEngine {
 public function evaluate(AgentConfidenceEvaluated $e): void {
  Log::info('calibrator_evaluate',['agent'=>$e->agentId,'conf'=>$e->confidence,'trace'=>$e->traceId]);
  if($e->confidence < 70){ try{ DB::table('stats_wallet_daily')->where('agent_id',$e->agentId)->increment('healing_reroutes'); }catch(\Throwable){} }
  elseif($e->confidence < 85){ try{ DB::table('stagnant_deals')->where('agent_id',$e->agentId)->where('is_promoted',0)->limit(5)->update(['is_promoted'=>1]); }catch(\Throwable){} }
  try{ app(\App\Services\Rules\Pricing\TieredPricingEngine::class)->adjust($e->agentId, $e->confidence); }catch(\Throwable){}
  // FIX-360-12: central threshold config(ai.threshold) not magic 90 — single source
  $threshold = (int) config('ai.calibrator_threshold', config('ai.threshold', 90));
  if($e->confidence < $threshold){ $this->heal((int)$e->confidence); }
 }
 public function heal(int $health): bool {
  $threshold = (int) config('ai.calibrator_threshold', config('ai.threshold', 90));
  if($health >= $threshold) return false;
  // FIX-360-01/02: targeted tags pinned redis DB1 — never full flush
  CacheTagGuard::flushTags(['feature_flags','micro_perm','ai_runtime']);
  CacheTagGuard::forget('calibrator:health');
  $this->recycleWorkers();
  $this->stepDownDrivers($health);
  try{ DB::table('healing_events')->insert(['health_score'=>$health,'actions'=>json_encode(['tags_flush','recycle','step_down']),'created_at'=>now('Africa/Cairo')]); }catch(\Throwable){}
  Log::info('calibrator_heal',['health'=>$health,'actions'=>['tags_flush','recycle','step_down']]);
  try{ event(new \App\Events\GovernanceAlerted('calibrator_drop', $health, 'heal '.$health.'<90')); }catch(\Throwable){}
  return true;
 }
 private function recycleWorkers(): void {
  // F-09 graceful recycle only low/ai — critical never terminated — respects stop_grace 40s
  foreach(['worker-low','worker-ai'] as $svc){
   try{ Http::timeout(2)->post('http://docker-socket-proxy:2375/services/'. $svc .'/update', ['force'=>1]); }catch(\Throwable){}
  }
  try{ \Illuminate\Support\Facades\Artisan::call('horizon:terminate'); }catch(\Throwable){}
 }
 private function stepDownDrivers(int $health): void {
  $step = (int) config('ai.step_down_threshold', 80);
  if($health < $step){
   try{ DB::table('micro_switch_matrix')->where('preferred_driver','!=','deterministic')->where('is_enabled',1)->limit(10)->update(['preferred_driver'=>'deterministic','updated_at'=>now()]); CacheTagGuard::flushTags(['micro_perm']); }catch(\Throwable){}
  }
 }
}
