<?php
// SecurityProbeJob — B.13 F-04 — low 60s 3 tries — replica R37 — HITL pending — Arena
declare(strict_types=1);
namespace App\Jobs;
use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Queue\InteractsWithQueue; use Illuminate\Support\Facades\DB;
final class SecurityProbeJob implements ShouldQueue {
 use Dispatchable, InteractsWithQueue, Queueable;
 public $tries=3; public $timeout=60; public $queue='low';
 public function handle(): void {
  $rows=DB::connection('mysql_replica')->table('security_audit_logs')->where('created_at','>',now()->subDay())->where('payload_hash','like','%leak%')->limit(10)->get();
  foreach($rows as $r){
   DB::table('hitl_approvals')->insert(['capability'=>'security.vulnerability','requester_id'=>1,'status'=>'pending','payload'=>json_encode(['audit_id'=>$r->id ?? 0]),'app_id'=>'AU BUSINESS','created_at'=>now(),'updated_at'=>now()]);
  }
 }
 public function failed(\Throwable $e): void { \Illuminate\Support\Facades\Log::error('security_probe_failed_agent6',['err'=>$e->getMessage()]); try{ event(new \App\Events\GovernanceAlerted('job_failed',0,'security '.$e->getMessage())); }catch(\Throwable){} }
}
