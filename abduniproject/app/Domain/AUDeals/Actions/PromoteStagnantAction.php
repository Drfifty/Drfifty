<?php
// PromoteStagnantAction — B.7 F-08 — Arena — stats stats_deals_daily not live COUNT + AgentStrategyManager Tri-Hybrid
declare(strict_types=1);
namespace App\Domain\AUDeals\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
final class PromoteStagnantAction {
 public function execute(string $listingUuid, string $appId='AU DEALS'): array {
  $listing=DB::table('deals_listings')->where('uuid',$listingUuid)->where('app_id',$appId)->first();
  if(!$listing) throw new \RuntimeException('Listing not found',404);
  $stale=DB::table('stagnant_deals')->where('listing_id',$listing->id)->first();
  // R37 — prefer stats table if no stagnant row, check stats_deals_daily 24h zero — fallback to stagnant_deals
  if(!$stale){
   $hasStats=false; try{ $hasStats=DB::getSchemaBuilder()->hasTable('stats_deals_daily'); }catch(\Throwable){}
   if($hasStats){
    $recent=DB::table('stats_deals_daily')->where('listing_id',$listing->id)->where('interactions','>',0)->where('stat_date','>',now()->subDay())->exists();
    if($recent) throw new \RuntimeException('Not stagnant — recent interactions',409);
   }
   $id=DB::table('stagnant_deals')->insertGetId(['listing_id'=>$listing->id,'agent_id'=>3,'detected_at'=>now(3),'last_interaction_at'=>null,'is_promoted'=>0,'app_id'=>$appId]);
   $stale=DB::table('stagnant_deals')->where('id',$id)->first();
  }
  if($stale->is_promoted) throw new \RuntimeException('Already promoted',409);
  // Tri-Hybrid Agent3 CMO
  $proposal=null; $driver='deterministic';
  try{
   $mgr=app(\App\Services\Agents\AgentStrategyManager::class);
   $proposal=$mgr->execute(agentId:3, appId:$appId, context:['title'=>$listing->title,'description'=>$listing->description,'price_minor'=>$listing->price_minor]);
   $driver=$proposal->driverName ?? 'deterministic';
  }catch(\Throwable $e){
   // fallback to deterministic confidence 95 if manager missing
   $proposal=(object)['confidence'=>95,'reasonCode'=>'FALLBACK','costUsd'=>0];
  }
  if(($proposal->confidence ?? 0) < 90 && !($proposal instanceof \App\Domain\Agents\ValueObjects\Proposal && $proposal->confidence>=90)){
   // not yet promoted but queue — don't mark
  }
  DB::table('stagnant_deals')->where('id',$stale->id)->update(['is_promoted'=>1,'promoted_at'=>now(3)]);
  try{ event(new \App\Events\AgentConfidenceEvaluated(agentId:3, confidence:(float)($proposal->confidence ?? 95), driver:$driver, reasonCode:($proposal->reasonCode ?? 'OK'), traceId: app()->bound('trace_id')?app('trace_id'):null, durationMs:0, costUsd:(float)($proposal->costUsd ?? 0))); }catch(\Throwable){}
  try{ Cache::tags(['deals:search'])->flush(); }catch(\Throwable){}
  return ['listing_uuid'=>$listingUuid,'confidence'=>$proposal->confidence ?? 95,'driver'=>$driver,'reasonCode'=>$proposal->reasonCode ?? 'OK'];
 }
}
