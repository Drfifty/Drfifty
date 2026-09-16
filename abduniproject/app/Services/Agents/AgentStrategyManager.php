<?php
// AgentStrategyManager — Arena — B.4 — Tri-Hybrid adapter — deterministic first → preferred → fallback — event decoupled
declare(strict_types=1);
namespace App\Services\Agents;
use App\Domain\Agents\ValueObjects\Proposal; use App\Infrastructure\Cache\AgentRuntimeCache; use App\Services\Agents\Drivers\DeterministicRuleDriver; use App\Services\Agents\Drivers\CloudLlmDriver; use App\Services\Agents\Drivers\LocalGpuDriver; use App\Events\AgentConfidenceEvaluated; use Illuminate\Support\Facades\Log;
final class AgentStrategyManager {
 public function __construct(private DeterministicRuleDriver $deterministic, private CloudLlmDriver $cloud, private LocalGpuDriver $localGpu){}
 public function execute(int $agentId, string $appId, array $context): Proposal {
  $start=microtime(true);
  $runtime=AgentRuntimeCache::resolve($agentId,$appId);
  $threshold=(int)($runtime['threshold'] ?? 90);
  $trace=app()->bound('trace_id') ? app('trace_id') : bin2hex(random_bytes(16));
  // F-06 re-sanitize prompt before LLM
  $prompt=(string)($context['prompt'] ?? '');
  if($prompt !== ''){
   try{ $scan=app(\App\Services\Security\RegexDataLeakDetectorInterface::class)->scan($prompt); if($scan['action']==='BLOCK'){ Log::warning('agent_prompt_blocked',['agent'=>$agentId]); return new Proposal(0,'',0,0,'REGEX_MISMATCH'); } }catch(\Throwable){}
  }
  // F-12 budget terminal
  if(BudgetGuard::checkExceeded($agentId)){
   try{ dispatch(new \App\Jobs\HitlBudgetAlertJob($agentId))->onQueue('hitl'); }catch(\Throwable){}
   return new Proposal(0,'budget exhausted',0,0,'BUDGET_EXHAUSTED');
  }
  // 1) Deterministic first if not forced to other
  $override=$runtime['driver_override'] ?? 'auto';
  if(in_array($override,['auto','deterministic'],true) && !CircuitBreaker::isOpen('deterministic',$agentId)){
   try{
    $p=$this->deterministic->propose($context);
    if($p->isPass($threshold)){
     CircuitBreaker::recordSuccess('deterministic',$agentId);
     BudgetGuard::add($agentId,$p->tokens,$p->costUsd);
     $this->dispatch($agentId,$p,$trace,$start);
     return $p;
    }
    throw new \App\Domain\Agents\Exceptions\DeterministicConfidenceBelowThresholdException($p->confidence,$threshold);
   }catch(\Throwable $e){
    CircuitBreaker::recordFailure('deterministic',$agentId);
    if(str_contains(get_class($e),'RegexMismatch')) Log::info('deterministic_regex_mismatch',['agent'=>$agentId]);
    // fall through to fallback
   }
  }
  if($override==='deterministic') return new Proposal(0,'deterministic forced no fallback',0,0,'CONFIDENCE_LOW');
  // 2) Fallback order prefers micro_switch preferred_driver
  $order=($runtime['preferred']??'cloud')==='local_gpu' ? ['local_gpu','cloud'] : ['cloud','local_gpu'];
  if($override!=='auto') $order=[$override];
  foreach($order as $drv){
   if(CircuitBreaker::isOpen($drv,$agentId)) continue;
   if(BudgetGuard::wouldExceed($agentId, $drv==='cloud'?0.02:0.005)) continue;
   try{
    $driver=$drv==='cloud' ? $this->cloud : $this->localGpu;
    $p=$driver->propose($context);
    CircuitBreaker::recordSuccess($drv,$agentId);
    BudgetGuard::add($agentId,$p->tokens,$p->costUsd);
    $this->dispatch($agentId,$p,$trace,$start);
    return $p;
   }catch(\Throwable $e){ CircuitBreaker::recordFailure($drv,$agentId); Log::warning("agent_fallback_failed",['agent'=>$agentId,'driver'=>$drv,'e'=>$e->getMessage()]); }
  }
  return new Proposal(0,'all drivers failed',0,0,'ALL_DRIVERS_FAILED');
 }
 private function dispatch(int $agentId, Proposal $p, string $trace, float $start): void {
  try{ event(new AgentConfidenceEvaluated($agentId,$p->confidence,$p->reasonCode,$trace,(int)((microtime(true)-$start)*1000),$p->costUsd)); }catch(\Throwable){}
  Log::info('agent_proposal',['agent'=>$agentId,'conf'=>$p->confidence,'driver'=>$p->reasonCode,'cost'=>$p->costUsd,'trace'=>$trace]);
 }
}
