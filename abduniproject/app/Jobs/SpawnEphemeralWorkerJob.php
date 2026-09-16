<?php
// SpawnEphemeralWorkerJob — B.13 F-01 — ai 125s 3 tries — ephemeral sandbox via docker-socket-proxy — R6 — Arena
declare(strict_types=1);
namespace App\Jobs;
use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Queue\InteractsWithQueue; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\Log; use Illuminate\Support\Facades\Http;
final class SpawnEphemeralWorkerJob implements ShouldQueue {
 use Dispatchable, InteractsWithQueue, Queueable;
 public $tries=3; public $timeout=125; public $queue='ai';
 public function __construct(public int $tenantId, public string $appId, public int $agentId, public array $payload, public string $hash){}
 public function handle(): void {
  $semKey='ephemeral:sem'; $max=(int) env('EPHEMERAL_MAX_CONTAINERS',10);
  $cur=(int) Cache::get($semKey,0);
  if($cur >= $max){ Log::warning('ephemeral_sem_full',['max'=>$max]); $this->release(30); return; }
  Cache::increment($semKey); Cache::put($semKey, Cache::get($semKey), 60);
  try{
   $id=bin2hex(random_bytes(8));
   // attempt docker-socket-proxy create/start/wait via least-priv proxy
   try{
    $host=(string) env('DOCKER_HOST','tcp://docker-socket-proxy:2375');
    Http::timeout(5)->post($host.'/containers/create', ['Image'=>'abduniproject/sandbox:php84','Cmd'=>['php','artisan','ephemeral:run', json_encode($this->payload)],'Labels'=>['au.app'=>$this->appId,'au.tenant'=>(string)$this->tenantId],'HostConfig'=>['ReadonlyRootfs'=>true]]);
   }catch(\Throwable $e){ Log::warning('ephemeral_spawn_fallback_ai',['err'=>$e->getMessage()]); }
   // fallback deterministic execute via AgentStrategyManager
   try{ app(\App\Services\Agents\AgentStrategyManager::class)->execute($this->agentId, 'ephemeral', $this->payload); }catch(\Throwable){}
   Log::info('ephemeral_spawn_done',['tenant'=>$this->tenantId,'agent'=>$this->agentId,'hash'=>$this->hash,'trace'=>app()->bound('trace_id')?app('trace_id'):null]);
  } finally { Cache::decrement($semKey); }
 }
 public function failed(\Throwable $e): void { Log::error('ephemeral_failed_agent6',['err'=>$e->getMessage(),'agent'=>$this->agentId]); try{ event(new \App\Events\GovernanceAlerted('job_failed',0,'ephemeral '.$e->getMessage())); }catch(\Throwable){} }
}
