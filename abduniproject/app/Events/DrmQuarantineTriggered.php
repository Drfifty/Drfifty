<?php
declare(strict_types=1);
namespace App\Events;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class DrmQuarantineTriggered implements ShouldBroadcast {
 use Dispatchable;
 public function __construct(public string $reason){}
 public function broadcastOn(): array { return [new PrivateChannel('admin.drm')]; }
 public function broadcastAs(): string { return 'drm.quarantine.triggered'; }
}
