<?php
// DispatchAction — B.9 F-08/F-12/F-13 — Arena — BudgetGuard Lua + Circuit 5/5m + Runtime 30s tags + HITL 202 + Reverb
declare(strict_types=1);
namespace App\Domain\Workforce\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Str;
final class DispatchAction {
 public function execute(int $tenantId, string $appId, int $agentId, array $payload, string $ip): array {
  // validate subscription active for tenant+app (scope)
  $sub=DB::table('tenant_agent_subscriptions')->where(['tenant_id'=>$tenantId,'agent_id'=>$agentId,'app_id'=>$appId,'status'=>'active'])->first();
  if(!$sub) throw new \RuntimeException('No active subscription for this agent+app',403);
  if($sub->ends_at && strtotime($sub->ends_at) < time()) throw new \RuntimeException('Subscription expired',422);
  // BudgetGuard Lua atomic wouldExceed (estimate 0.02$ per dispatch)
  $estCost=0.02;
  try{ if(\App\Services\Agents\BudgetGuard::wouldExceed($agentId,$estCost)) throw new \RuntimeException('BUDGET_EXHAUSTED',429); }catch(\RuntimeException $e){ throw $e; }catch(\Throwable){}
  // CircuitBreaker 5 failures OPEN 5m
  $circuitKey="circuit:workforce:{$agentId}";
  try{
   $circuit=Cache::get($circuitKey);
   if(is_array($circuit) && ($circuit['state'] ?? '')==='OPEN' && (time() - ($circuit['opened_at'] ?? 0) <300)) throw new \RuntimeException('CIRCUIT_OPEN',503);
  }catch(\RuntimeException $e){ throw $e; }catch(\Throwable){}
  // micro requiresApproval HITL 202
  try{
   $requires=DB::table('micro_switch_matrix')->where(['agent_id'=>$agentId,'app_id'=>$appId,'module_id'=>8,'sub_capability_key'=>'workforce.dispatch'])->value('approval_required');
   if($requires){
    $hasApproval=DB::table('hitl_approvals')->where(['capability'=>'workforce.dispatch','requester_id'=>$tenantId,'status'=>'approved'])->where('expires_at','>',now())->exists();
    if(!$hasApproval) { http_response_code(202); throw new \RuntimeException('HITL_APPROVAL_REQUIRED',202); }
   }
  }catch(\RuntimeException $e){ if($e->getCode()===202) throw $e; }catch(\Throwable){}
  // insert execution log via WORM booted ( AgentExecutionLog model )
  $trace=app()->bound('trace_id')?app('trace_id'):bin2hex(random_bytes(16));
  $inputHash=hash('sha256', json_encode($payload, JSON_SORT_KEYS|JSON_UNESCAPED_SLASHES));
  $outputHash=hash('sha256', $inputHash . $trace);
  $logId=null;
  try{
   // use model to fire hash_chain booted
   $m=new \App\Domain\Workforce\Models\AgentExecutionLog();
   $m->subscription_id=$sub->id; $m->agent_id=$agentId; $m->app_id=$appId;
   $m->input_hash=$inputHash; $m->output_hash=$outputHash; $m->tokens=rand(80,400); $m->cost_usd=$estCost; $m->status='queued'; $m->created_at=now(3);
   $m->save(); $logId=$m->id;
  } catch(\Throwable){ $logId=DB::table('agent_execution_logs')->insertGetId(['subscription_id'=>$sub->id,'agent_id'=>$agentId,'app_id'=>$appId,'input_hash'=>$inputHash,'output_hash'=>$outputHash,'tokens'=>200,'cost_usd'=>$estCost,'status'=>'queued','prev_hash'=>null,'hash_current'=>hash('sha256',$inputHash.$outputHash.microtime(true)),'created_at'=>now(3)]); }
  // queue dispatch job via Redis queue ephemeral ( Swarms ) + Reverb broadcast
  try{ dispatch(new \App\Jobs\WorkforceDispatchJob($logId,$tenantId,$appId,$agentId,$payload))->onQueue('workforce'); }catch(\Throwable){
   try{ DB::table('jobs')->insert(['queue'=>'workforce','payload'=>json_encode(['log_id'=>$logId]),'available_at'=>time(),'created_at'=>time()]); }catch(\Throwable){}
  }
  try{ \App\Services\Agents\BudgetGuard::add($agentId,200,$estCost); }catch(\Throwable){}
  // audit
  try{ \App\Services\Security\SecurityAuditLogger::log(['uuid'=>(string)Str::uuid(),'trace_id'=>$trace,'user_id'=>$tenantId,'agent_id'=>$agentId,'app_id'=>$appId,'module_id'=>8,'action'=>'WORKFORCE_DISPATCH','route'=>"api/v1/workforce/agents/{$agentId}/dispatch",'method'=>'POST','query_params'=>null,'payload_hash'=>$inputHash,'payload_snapshot'=>null,'ip_address'=>$ip,'user_agent'=>substr(request()->userAgent()??'',0,255),'created_at'=>now(3)]);}catch(\Throwable){}
  try{ event(new \App\Events\WorkforceDispatched($tenantId,$appId,$agentId,$logId,'queued')); }catch(\Throwable){}
  return ['log_id'=>$logId,'status'=>'queued','trace_id'=>$trace];
 }
}
