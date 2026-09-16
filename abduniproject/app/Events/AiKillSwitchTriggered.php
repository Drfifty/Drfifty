<?php
// AiKillSwitchTriggered — B.8 F-05/F-15 + B.10 F-04 — Arena — broadcast deterministic fallback Reverb 8080 wss at-least-once
declare(strict_types=1);
namespace App\Events;
use App\Services\Broadcast\HasEventId; use App\Services\Broadcast\ReverbBuffer;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class AiKillSwitchTriggered implements ShouldBroadcast {
 use Dispatchable, HasEventId;
 public function __construct(public string $fallback='deterministic', public int $actorId=0, public string $reason=''){ $this->initEventId(); }
 public function broadcastOn(): array { return [new PrivateChannel('admin.governance')]; }
 public function broadcastAs(): string { return 'v1.ai.kill_switch.triggered'; }
 public function broadcastWith(): array {
  $payload=['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'fallback'=>$this->fallback,'actor_id'=>$this->actorId,'reason'=>mb_substr($this->reason,0,200)];
  ReverbBuffer::push('private-governance-alerts',$payload);
  ReverbBuffer::push('admin.governance',$payload);
  return $payload;
 }
}
