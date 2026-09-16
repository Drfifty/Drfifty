<?php
// DriverInterface — Arena — B.4 — Pure Domain contract R27 — strict PHP 8.4
declare(strict_types=1);
namespace App\Domain\Agents\Contracts;
use App\Domain\Agents\ValueObjects\Proposal;
interface DriverInterface {
 public function driverName(): string; // deterministic|cloud|local_gpu
 /** @throws \App\Domain\Agents\Exceptions\RegexMismatchException|\App\Domain\Agents\Exceptions\DeterministicConfidenceBelowThresholdException */
 public function propose(array $context): Proposal;
}
