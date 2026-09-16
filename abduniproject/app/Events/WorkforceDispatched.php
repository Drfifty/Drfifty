<?php
// WorkforceDispatched — B.9 F-13 — Arena — Reverb private-tenant workforce queued→progress→completed 8080 wss
declare(strict_types=1);
namespace App\Events;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class WorkforceDispatched implements ShouldBroadcast {
 use Dispatchable;
 public function __construct(public int $tenantId, public string $appId, public int $agentId, public int $logId, public string $status='queued'){}
 public function broadcastOn(): array { return [new PrivateChannel('tenant.'.$this->tenantId.'.workforce'), new PrivateChannel('app.'.$this->appId.'.workforce')]; }
 public function broadcastAs(): string { return 'workforce.dispatched'; }
 public function broadcastWith(): array { return ['tenant_id'=>$this->tenantId,'app_id'=>$this->appId,'agent_id'=>$this->agentId,'log_id'=>$this->logId,'status'=>$this->status,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null]; }
}
