<?php
// FeatureFlagRepositoryInterface — B1-F2 hardened: setEnabled requires reason+ip, returns audit id
declare(strict_types=1);
namespace App\Domain\Governance\Repositories;
use App\Domain\Governance\Enums\ModuleKey;
interface FeatureFlagRepositoryInterface {
 /** @return array{is_enabled:bool,degraded_mode:bool,rollout:int}|null */
 public function findByKey(ModuleKey $key): ?array;
 public function isEnabled(ModuleKey $key): bool;
 /** @throws \LogicException if isCore */
 public function setEnabled(ModuleKey $key, bool $enabled, ?int $actorId, ?string $reason = null, ?string $ip = null): void;
 public function setDegradedMode(ModuleKey $key, bool $degraded, ?int $actorId, ?string $reason = null): void;
}
