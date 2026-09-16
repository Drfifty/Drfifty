<?php
// GovernanceAlerted — B.10 F-05/F-09/F-11 — Arena — private-governance-alerts coalesced calibrator+DRM+kill
declare(strict_types=1);
namespace App\Events;
use App\Services\Broadcast\HasEventId; use App\Services\Broadcast\ReverbBuffer;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class GovernanceAlerted implements ShouldBroadcast {
 use Dispatchable, HasEventId;
 public function __construct(
  public string $alertType,
  public ?int $healthPct=null,
  public ?string $reason=null,
  public ?int $retryAfter=null
 ){
  if(!in_array($alertType,['calibrator_drop','drm_quarantine','kill_switch'],true)) throw new \InvalidArgumentException('alert_type enum');
  $this->initEventId();
 }
 public function broadcastOn(): array { return [new PrivateChannel('private-governance-alerts')]; }
 public function broadcastAs(): string { return 'v1.governance.alerted'; }
 public function broadcastWith(): array {
  $payload=['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'alert_type'=>$this->alertType,'health_pct'=>$this->healthPct,'reason'=>mb_substr($this->reason??'',0,500),'retry_after'=>$this->retryAfter ?? 3600];
  ReverbBuffer::push('private-governance-alerts',$payload);
  return $payload;
 }
}
