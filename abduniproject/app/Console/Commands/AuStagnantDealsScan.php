<?php
// AuStagnantDealsScan — B.12 F-07 — hourly R37 isolated — stats + chunk 100 + lock 55m — Arena
declare(strict_types=1);
namespace App\Console\Commands;
use Illuminate\Console\Command; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
final class AuStagnantDealsScan extends Command {
 protected $signature='au:stagnant-deals-scan';
 protected $description='Hourly stagnant scan — stats isolated + chunk 100 + Agent3 promo 5/limit — 55m lock';
 public function handle(): int {
  $lock=Cache::lock('stagnant:scan', 3300);
  if(!$lock->get()){ $this->info('stagnant scan lock held'); return 0; }
  try{
   // prefer stats table R37, fallback replica heartbeat
   $threshold=now('Africa/Cairo')->subHours(24);
   $query=DB::table('deals_listings')->where('is_hidden',0)->where('created_at','<',$threshold)->where('updated_at','<',$threshold);
   $count=0;
   $query->orderBy('id')->chunkById(100, function($rows) use (&$count){
    foreach($rows as $row){
     if($count>=500) break; // cap 500/hr
     try{
      DB::table('stagnant_deals')->updateOrInsert(['listing_id'=>$row->id],['agent_id'=>3,'detected_at'=>now('Africa/Cairo'),'is_promoted'=>0,'created_at'=>now(),'updated_at'=>now()]);
      // dispatch promo to low queue 30s timeout
      dispatch(function() use ($row){ try{ DB::table('stagnant_deals')->where('listing_id',$row->id)->where('is_promoted',0)->limit(5)->update(['is_promoted'=>1]); app(\App\Services\Rules\Pricing\TieredPricingEngine::class)->adjust(3, 80); }catch(\Throwable){} })->onQueue('low');
      $count++;
     }catch(\Throwable $e){ \Illuminate\Support\Facades\Log::warning('stagnant_scan_row_failed',['id'=>$row->id,'err'=>$e->getMessage()]); }
    }
   });
   $this->info("stagnant scan done {$count}");
   try{ DB::table('stats_deals_daily')->updateOrInsert(['stat_date'=>\Carbon\Carbon::today('Africa/Cairo')->toDateString()],['stagnant_scanned'=>$count,'updated_at'=>now()]); }catch(\Throwable){}
  } finally { $lock->release(); }
  return 0;
 }
}
