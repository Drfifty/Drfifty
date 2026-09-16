<?php
// WorkforceDispatched — B.9 F-13 + B.10 F-04/F-11 — Arena — Reverb private-tenant workforce queued→progress→completed 8080 wss + event_id at-least-once
declare(strict_types=1);
namespace App\Events;
use App\Services\Broadcast\HasEventId; use App\Services\Broadcast\ReverbBuffer;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class WorkforceDispatched implements ShouldBroadcast {
 use Dispatchable, HasEventId;
 public function __construct(public int $tenantId, public string $appId, public int $agentId, public int $logId, public string $status='queued'){ $this->initEventId(); }
 public function broadcastOn(): array { return [new PrivateChannel('tenant.'.$this->tenantId.'.workforce'), new PrivateChannel('app.'.$this->appId.'.workforce')]; }
 public function broadcastAs(): string { return 'v1.workforce.dispatched'; }
 public function broadcastWith(): array {
  $payload=['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'tenant_id'=>$this->tenantId,'app_id'=>$this->appId,'agent_id'=>$this->agentId,'log_id'=>$this->logId,'status'=>$this->status];
  ReverbBuffer::push('private-tenant.'.$this->appId.'.workforce',$payload);
  return $payload;
 }
}
