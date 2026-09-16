<?php
// AuCalibratorHealthCheck — B.12 F-08 — every5m R37 cached 10s + lock 4m — reuses SelfHealing — Arena
declare(strict_types=1);
namespace App\Console\Commands;
use Illuminate\Console\Command; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
final class AuCalibratorHealthCheck extends Command {
 protected $signature='au:calibrator-health-check';
 protected $description='Every5m calibrator health 100→90 check — cached 10s + 4m lock — coalesced alert';
 public function handle(): int {
  $lock=Cache::lock('calibrator:health:check', 240);
  if(!$lock->get()){ $this->info('calibrator lock held'); return 0; }
  try{
   $health=(int)(Cache::get('calibrator:health') ?? DB::table('stats_calibrator_daily')->where('stat_date',\Carbon\Carbon::today('Africa/Cairo')->toDateString())->value('health_score') ?? 95);
   $threshold=(int) config('ai.calibrator_threshold', env('CALIBRATOR_HEALTH_THRESHOLD',90));
   Cache::put('calibrator:health', $health, 10);
   if($health < $threshold){
    try{ event(new \App\Events\GovernanceAlerted('calibrator_drop', $health, 'health '.$health.'<'.$threshold)); }catch(\Throwable){}
    try{ app(\App\Services\Calibrator\CalibratorSelfHealingEngine::class)->evaluate(new \App\Events\AgentConfidenceEvaluated(1, $health, 'calibrator_cron', app()->bound('trace_id')?app('trace_id'):bin2hex(random_bytes(8)), 0, 0.0)); }catch(\Throwable){}
   }
   $this->info("calibrator health {$health} threshold {$threshold}");
  } finally { $lock->release(); }
  return 0;
 }
}
