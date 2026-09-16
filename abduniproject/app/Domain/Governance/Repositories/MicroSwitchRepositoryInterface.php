<?php
declare(strict_types=1);
namespace App\Domain\Governance\Repositories;
use App\Domain\Governance\Enums\SubCapabilityKey;
interface MicroSwitchRepositoryInterface {
 /** @return array<string,bool> sub_capability_key => is_enabled */
 public function allForAgent(int $agentId, string $appId): array;
 public function isEnabled(int $agentId, string $appId, int $moduleId, SubCapabilityKey $cap): bool;
 public function requiresApproval(int $agentId, string $appId, int $moduleId, SubCapabilityKey $cap): bool;
 public function set(int $agentId, string $appId, int $moduleId, SubCapabilityKey $cap, bool $enabled, bool $approvalRequired, int $actorId, string $reason, string $ip): void;
}
