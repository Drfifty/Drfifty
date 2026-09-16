<?php
// FeatureFlagToggled — Arena B.1a/B.8 — Reverb broadcast for AU Lite 503 toggle — tags flush
declare(strict_types=1);
namespace App\Events;
use App\Domain\Governance\Enums\ModuleKey; use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class FeatureFlagToggled implements ShouldBroadcast {
 use Dispatchable;
 public function __construct(public ModuleKey $key, public bool $enabled){}
 public function broadcastOn(): array { return [new PrivateChannel('admin.governance')]; }
 public function broadcastAs(): string { return 'feature_flag.toggled'; }
 public function broadcastWith(): array { return ['flag_key'=>$this->key->value,'is_enabled'=>$this->enabled,'is_core'=>$this->key->isCore()]; }
}
