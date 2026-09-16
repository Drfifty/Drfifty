<?php
// FrozenClock — B.11 F-04 — deterministic tests — R27
declare(strict_types=1);
namespace App\Services\Time;
use Carbon\CarbonImmutable;
final class FrozenClock implements ClockInterface {
 public function __construct(private CarbonImmutable $frozen) {}
 public function now(): CarbonImmutable { return $this->frozen; }
 public function skewMargin(): int { return (int) config('ai.clock_skew_margin', 30); }
 public function advanceSeconds(int $s): void { $this->frozen = $this->frozen->addSeconds($s); }
}
