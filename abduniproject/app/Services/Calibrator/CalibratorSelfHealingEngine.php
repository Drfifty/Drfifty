<?php
// CalibratorSelfHealingEngine — Arena — B.4 F-11 — price/promo/reroute — R37 stats isolation
declare(strict_types=1);
namespace App\Services\Calibrator;
use App\Events\AgentConfidenceEvaluated; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Log;
final class CalibratorSelfHealingEngine {
 public function evaluate(AgentConfidenceEvaluated $e): void {
  Log::info('calibrator_evaluate',['agent'=>$e->agentId,'conf'=>$e->confidence,'trace'=>$e->traceId]);
  // Deterministic actions — NEVER COUNT(*) on live app_wallets/escrow_clearings, use stats tables
  if($e->confidence < 70){
   // reroute workflow: example dispatch to nearest provider via stats
   try{ DB::table('stats_wallet_daily')->where('agent_id',$e->agentId)->increment('healing_reroutes'); }catch(\Throwable){}
  } elseif($e->confidence < 85){
   // auto-promotion flag for stagnant_deals (stats isolated)
   try{ DB::table('stagnant_deals')->where('agent_id',$e->agentId)->where('is_promoted',0)->limit(5)->update(['is_promoted'=>1]); }catch(\Throwable){}
  }
  // price adjustment via TieredPricingEngine (deterministic)
  try{ app(\App\Services\Rules\Pricing\TieredPricingEngine::class)->adjust($e->agentId, $e->confidence); }catch(\Throwable){}
 }
}
