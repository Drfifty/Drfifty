<?php
// WorkforceStepUpdated — B.10 F-05/F-11 — Arena — private-tenant.{app_id}.workforce step/token_spike/completed
declare(strict_types=1);
namespace App\Events;
use App\Services\Broadcast\HasEventId; use App\Services\Broadcast\ReverbBuffer;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class WorkforceStepUpdated implements ShouldBroadcast {
 use Dispatchable, HasEventId;
 public function __construct(
  public int $tenantId,
  public string $appId,
  public int $agentId,
  public int $logId,
  public string $step='progress',
  public int $tokens=0, public float $costUsd=0.0, public ?string $outputHash=null
 ){
  if(!in_array($appId,['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'],true)) throw new \InvalidArgumentException('app_id enum');
  if(!in_array($step,['queued','progress','token_spike','completed','failed'],true)) $step='progress';
  $this->step=$step;
  $this->initEventId();
 }
 public function broadcastOn(): array { return [new PrivateChannel('private-tenant.'.$this->appId.'.workforce')]; }
 public function broadcastAs(): string { return 'v1.workforce.step.updated'; }
 public function broadcastWith(): array {
  $payload=['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$this->appId,'tenant_id'=>$this->tenantId,'agent_id'=>$this->agentId,'log_id'=>$this->logId,'step'=>$this->step,'tokens'=>$this->tokens,'cost_usd'=>number_format($this->costUsd,4,'.',''),'output_hash'=>$this->outputHash];
  ReverbBuffer::push('private-tenant.'.$this->appId.'.workforce',$payload);
  return $payload;
 }
}
