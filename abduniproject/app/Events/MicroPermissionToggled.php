<?php
declare(strict_types=1);
namespace App\Events;
use App\Domain\Governance\Enums\SubCapabilityKey; use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class MicroPermissionToggled implements ShouldBroadcast {
 use Dispatchable;
 public function __construct(public int $agentId, public string $appId, public SubCapabilityKey $cap, public bool $enabled){}
 public function broadcastOn(): array { return [new PrivateChannel('admin.governance')]; }
 public function broadcastAs(): string { return 'micro.permission.toggled'; }
}
