<?php
// AppServiceProvider — Arena — B.11 F-04/F-16 — Clock binding + skew TTL + Reverb guard
declare(strict_types=1);
namespace App\Providers;
use Illuminate\Support\ServiceProvider;
use App\Services\Time\ClockInterface;
use App\Services\Time\SystemClock;
final class AppServiceProvider extends ServiceProvider {
 public function register(): void {
  $this->app->singleton(ClockInterface::class, fn() => new SystemClock());
  $this->app->alias(ClockInterface::class, 'clock');
 }
 public function boot(): void {
  if (app()->environment('production') && env('BROADCAST_CONNECTION', 'reverb') !== 'reverb') {
   \Illuminate\Support\Facades\Log::warning('BROADCAST_CONNECTION not reverb in prod', ['trace' => app()->bound('trace_id') ? app('trace_id') : null]);
  }
  // B.12 F-14 — failed 3 attempts → dead-letter + instant alert Agent 6 SecOps — queue bulkhead
  try{
   \Illuminate\Support\Facades\Queue::failing(function(\Illuminate\Queue\Events\JobFailed $e){
    try{
     \Illuminate\Support\Facades\Log::error('job_failed_alert_agent6', ['queue'=>$e->connectionName.':'.$e->job->getQueue(),'payload'=>$e->job->payload(),'exception'=>$e->exception->getMessage(),'trace'=>app()->bound('trace_id')?app('trace_id'):null]);
     event(new \App\Events\GovernanceAlerted('job_failed', 0, substr($e->exception->getMessage(),0,200)));
    }catch(\Throwable){}
   });
  }catch(\Throwable){}
 }
}
