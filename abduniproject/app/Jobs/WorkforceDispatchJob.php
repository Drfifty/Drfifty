<?php
// WorkforceDispatchJob — B.9 F-08/F-13 — Arena — queue workforce ephemeral swarm + Reverb progress
declare(strict_types=1);
namespace App\Jobs;
use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Queue\InteractsWithQueue; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
final class WorkforceDispatchJob implements ShouldQueue {
 use Dispatchable, InteractsWithQueue, Queueable;
 public $tries=3; public $timeout=120;
 public function __construct(public int $logId, public int $tenantId, public string $appId, public int $agentId, public array $payload){}
 public function handle(): void {
  try{
   DB::table('agent_execution_logs')->where('id',$this->logId)->update(['status'=>'running','updated_at'=>now(3)]);
   event(new \App\Events\WorkforceDispatched($this->tenantId,$this->appId,$this->agentId,$this->logId,'running'));
   // deterministic execution placeholder 2s max (Pillar 1)
   usleep(200000); // 200ms simulate
   DB::table('agent_execution_logs')->where('id',$this->logId)->update(['status'=>'completed','updated_at'=>now(3)]);
   // stats pre-agg increment (R37)
   try{ $d=\Carbon\Carbon::today('Africa/Cairo')->toDateString(); DB::table('stats_agent_daily')->updateOrInsert(['stat_date'=>$d,'agent_id'=>$this->agentId],['total_runs'=>DB::raw('total_runs+1'),'total_tokens'=>DB::raw('total_tokens+200'),'total_cost'=>DB::raw('total_cost+0.02'),'updated_at'=>now()]); }catch(\Throwable){}
   event(new \App\Events\WorkforceDispatched($this->tenantId,$this->appId,$this->agentId,$this->logId,'completed'));
   try{ Cache::tags(['workforce:logs'])->flush(); }catch(\Throwable){}
  } catch(\Throwable $e){
   DB::table('agent_execution_logs')->where('id',$this->logId)->update(['status'=>'failed','updated_at'=>now(3)]);
   event(new \App\Events\WorkforceDispatched($this->tenantId,$this->appId,$this->agentId,$this->logId,'failed'));
   throw $e;
  }
 }
}
