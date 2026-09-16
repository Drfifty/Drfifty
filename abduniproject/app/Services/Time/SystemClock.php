<?php
// SystemClock — B.11 F-04/F-05 — authoritative chrony NTP + Cairo — skew +30s TTL
declare(strict_types=1);
namespace App\Services\Time;
use Carbon\CarbonImmutable;
final class SystemClock implements ClockInterface {
 public function now(): CarbonImmutable { return CarbonImmutable::now('Africa/Cairo'); }
 public function skewMargin(): int { return (int) config('ai.clock_skew_margin', env('CLOCK_SKEW_MARGIN', 30)); }
 public static function ttlWithSkew(int $baseTtl): int { return $baseTtl + (int) config('ai.clock_skew_margin', env('CLOCK_SKEW_MARGIN', 30)); }
 public function nowUtc(): CarbonImmutable { return CarbonImmutable::now('UTC'); }
}
