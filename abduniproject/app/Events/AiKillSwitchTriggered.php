<?php
// AiKillSwitchTriggered — B.8 F-05/F-15 — Arena — broadcast deterministic fallback Reverb 8080 wss
declare(strict_types=1);
namespace App\Events;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class AiKillSwitchTriggered implements ShouldBroadcast {
 use Dispatchable;
 public function __construct(public string $fallback='deterministic', public int $actorId=0, public string $reason=''){}
 public function broadcastOn(): array { return [new PrivateChannel('admin.governance')]; }
 public function broadcastAs(): string { return 'ai.kill_switch.triggered'; }
 public function broadcastWith(): array { return ['fallback'=>$this->fallback,'actor_id'=>$this->actorId,'reason'=>mb_substr($this->reason,0,200)]; }
}
