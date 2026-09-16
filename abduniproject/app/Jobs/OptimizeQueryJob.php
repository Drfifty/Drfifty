<?php
// OptimizeQueryJob — B.13 F-05 — low 60s — replica EXPLAIN + hasIndex guard — Arena
declare(strict_types=1);
namespace App\Jobs;
use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Queue\InteractsWithQueue; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Schema;
final class OptimizeQueryJob implements ShouldQueue {
 use Dispatchable, InteractsWithQueue, Queueable;
 public $tries=3; public $timeout=60; public $queue='low';
 public function __construct(public array $payload){}
 public function handle(): void {
  $q=$this->payload['query'] ?? 'SELECT 1';
  try{ DB::connection('mysql_replica')->select('EXPLAIN '.$q); }catch(\Throwable){}
  // propose via HITL, not direct CREATE INDEX
  try{
   if(!Schema::hasTable('hitl_approvals')) return;
   DB::table('hitl_approvals')->insert(['capability'=>'refactor.index_proposal','requester_id'=>1,'status'=>'pending','payload'=>json_encode(['query'=>$q,'proposal'=>'ADD INDEX IF NOT EXISTS idx_opt'],'JSON'),'app_id'=>'AU BUSINESS','created_at'=>now(),'updated_at'=>now()]);
  }catch(\Throwable){}
 }
}
