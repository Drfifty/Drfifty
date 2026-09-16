<?php
// CalibratorHealingListener — Arena — B.4 F-11 — async queue calibrator — Pre-Op <15ms
declare(strict_types=1);
namespace App\Listeners;
use App\Events\AgentConfidenceEvaluated; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Support\Facades\Cache;
final class CalibratorHealingListener implements ShouldQueue {
 public string $queue='calibrator';
 public function handle(AgentConfidenceEvaluated $e): void {
  if($e->confidence >= 90) return;
  if(!Cache::get('calibrator:enabled', true)) return;
  $start=microtime(true);
  try{ app(\App\Services\Calibrator\CalibratorSelfHealingEngine::class)->evaluate($e); }catch(\Throwable $ex){ \Log::warning('calibrator_healing_failed',['e'=>$ex->getMessage()]); }
  $ms=(microtime(true)-$start)*1000;
  if($ms > 15) \Log::warning('calibrator_pre_op_slow',['ms'=>$ms]);
 }
}
