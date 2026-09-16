<?php
// DrmQuarantineTriggered — B.3 + B.10 F-04 — Arena — Reverb 8080 at-least-once
declare(strict_types=1);
namespace App\Events;
use App\Services\Broadcast\HasEventId; use App\Services\Broadcast\ReverbBuffer;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class DrmQuarantineTriggered implements ShouldBroadcast {
 use Dispatchable, HasEventId;
 public function __construct(public string $reason){ $this->initEventId(); }
 public function broadcastOn(): array { return [new PrivateChannel('admin.drm'), new PrivateChannel('private-governance-alerts')]; }
 public function broadcastAs(): string { return 'v1.drm.quarantine.triggered'; }
 public function broadcastWith(): array {
  $payload=['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'reason'=>$this->reason];
  ReverbBuffer::push('private-governance-alerts',$payload);
  return $payload;
 }
}
