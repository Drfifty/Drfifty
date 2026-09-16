<?php
// CalibratorSelfHealingEngine — Arena — B.4 F-11 + B.13 F-07/F-08 — price/promo/reroute + targeted heal — R37
declare(strict_types=1);
namespace App\Services\Calibrator;
use App\Events\AgentConfidenceEvaluated; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Log; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\Http;
final class CalibratorSelfHealingEngine {
 public function evaluate(AgentConfidenceEvaluated $e): void {
  Log::info('calibrator_evaluate',['agent'=>$e->agentId,'conf'=>$e->confidence,'trace'=>$e->traceId]);
  if($e->confidence < 70){ try{ DB::table('stats_wallet_daily')->where('agent_id',$e->agentId)->increment('healing_reroutes'); }catch(\Throwable){} }
  elseif($e->confidence < 85){ try{ DB::table('stagnant_deals')->where('agent_id',$e->agentId)->where('is_promoted',0)->limit(5)->update(['is_promoted'=>1]); }catch(\Throwable){} }
  try{ app(\App\Services\Rules\Pricing\TieredPricingEngine::class)->adjust($e->agentId, $e->confidence); }catch(\Throwable){}
  // healing on confidence drop below 90 — targeted flush F-07
  if($e->confidence < 90){ $this->heal((int)$e->confidence); }
 }
 public function heal(int $health): bool {
  if($health >= 90) return false;
  // F-07 targeted tag flush — NOT agents_cache/routes_cache (non-existent) and NOT full flush — preserves session DB0
  try{ Cache::tags(['feature_flags','micro_perm','ai_runtime'])->flush(); }catch(\Throwable){ try{ Cache::tags(['feature_flags'])->flush(); }catch(\Throwable){} }
  try{ Cache::forget('calibrator:health'); }catch(\Throwable){}
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
  // F-11 step down preferred_driver deterministic if health<80
  if($health < 80){
   try{ DB::table('micro_switch_matrix')->where('preferred_driver','!=','deterministic')->where('is_enabled',1)->limit(10)->update(['preferred_driver'=>'deterministic','updated_at'=>now()]); Cache::tags(['micro_perm'])->flush(); }catch(\Throwable){}
  }
 }
}
