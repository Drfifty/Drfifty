<?php
// AuRedTeamSimulation — B.12 F-10 — hourly replica-isolated low queue — pen+legal+slowQuery — Arena
declare(strict_types=1);
namespace App\Console\Commands;
use Illuminate\Console\Command; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
final class AuRedTeamSimulation extends Command {
 protected $signature='au:red-team-simulation';
 protected $description='Hourly red-team sim — replica slowQuery + legal + pen — pushed low queue 60s';
 public function handle(): int {
  $lock=Cache::lock('redteam:sim', 3300);
  if(!$lock->get()){ $this->info('redteam lock held'); return 0; }
  try{
   // slow query analysis — replica heartbeat fallback
   $resolver=app(\App\Infrastructure\Database\ReplicaConnectionResolver::class ?? null);
   $conn = $resolver ? $resolver->resolve() : 'mysql';
   dispatch(function() use ($conn){ try{ DB::connection($conn)->select('SELECT 1'); \Illuminate\Support\Facades\Log::info('redteam_slow_query_probe',['conn'=>$conn]); }catch(\Throwable){} })->onQueue('low');
   dispatch(function(){ try{ DB::table('security_audit_logs')->where('created_at','<',now()->subDays(90))->limit(10)->get(); }catch(\Throwable){} })->onQueue('low');
   dispatch(function(){ try{ event(new \App\Events\GovernanceAlerted('red_team_tick', 85, 'red-team probe')); }catch(\Throwable){} })->onQueue('low');
   $this->info('redteam dispatched 3 low jobs');
  } finally { $lock->release(); }
  return 0;
 }
}
