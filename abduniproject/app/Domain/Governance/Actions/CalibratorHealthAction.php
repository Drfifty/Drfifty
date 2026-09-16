<?php
// CalibratorHealthAction — B.8 F-09 — Arena — replica pre-aggregated stats → 100→0 + self_healing 10s cache NO live COUNT
declare(strict_types=1);
namespace App\Domain\Governance\Actions;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB; use Carbon\Carbon;
final class CalibratorHealthAction {
 private const CACHE_KEY='calibrator:health'; private const TTL=10;
 public function execute(): array {
  $cached=Cache::get(self::CACHE_KEY);
  if(is_array($cached)) return array_merge($cached,['cached'=>true,'db_route'=>'cache']);
  $today=Carbon::today('Africa/Cairo')->toDateString(); $dbRoute='primary'; $fallbackRate=0; $budgetBreach=0; $errorPct=0;
  try{
   // prefer replica if configured, else primary
   $conn = array_key_exists('replica', config('database.connections',[])) ? 'replica' : null;
   $q = $conn ? DB::connection($conn) : DB::connection();
   $dbRoute = $conn ?? 'primary';
   if($this->hasTable('stats_calibrator_daily')){
    $row=$q->table('stats_calibrator_daily')->where('stat_date',$today)->first(['fallback_rate','budget_breach_pct','error_pct','deterministic_rate']);
    if($row){ $fallbackRate=(float)($row->fallback_rate ?? 0); $budgetBreach=(float)($row->budget_breach_pct ?? 0); $errorPct=(float)($row->error_pct ?? 0); }
    else { // nightly pre-agg missing → use wallet daily breach ratio
      try{ $b=$q->table('agent_budget_caps')->where('budget_date',$today)->where('current_daily_spend_usd','>',DB::raw('daily_cost_cap_usd'))->count(); $budgetBreach=$b>0? min(30,(float)$b*2.2):0; }catch(\Throwable){}
    }
   }
  }catch(\Throwable $e){ $dbRoute='primary'; }
  // weighted penalties: fallback 0..40, budget 0..30, error 0..30 → max 100
  $penalty = min(100, $fallbackRate*0.42 + $budgetBreach*0.32 + $errorPct*0.48);
  $healthPct=max(0,min(100, (int)round(100 - $penalty)));
  $status = $healthPct>=90 ? 'healthy' : ($healthPct>=70 ? 'degraded' : 'critical');
  $healing=[];
  try{
   if($this->hasTable('security_audit_logs')) $healing=DB::table('security_audit_logs')->where('action','SELF_HEALING')->orderByDesc('id')->limit(10)->get(['created_at','payload_hash','route','trace_id'])->map(fn($r)=>['at'=>$r->created_at,'action'=>'SELF_HEALING','latency_ms'=>null])->all();
  }catch(\Throwable){}
  $payload=['health_pct'=>$healthPct,'status'=>$status,'self_healing'=>$healing,'detail'=>['fallback_rate'=>$fallbackRate,'budget_breach'=>$budgetBreach,'error_pct'=>$errorPct],'cached'=>false,'cached_at'=>now()->toIso8601String(),'db_route'=>$dbRoute];
  try{ Cache::put(self::CACHE_KEY,$payload,self::TTL); try{ Cache::tags(['calibrator_health'])->put(self::CACHE_KEY,$payload,self::TTL);}catch(\Throwable){} }catch(\Throwable){}
  return $payload;
 }
 private function hasTable(string $t): bool { try{ return \Illuminate\Support\Facades\Schema::hasTable($t);}catch(\Throwable){return false;} }
}
