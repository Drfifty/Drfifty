<?php
// ClockInterface — B.11 F-04 — single injected clock Africa/Cairo — NTP discipline — R27/R28
declare(strict_types=1);
namespace App\Services\Time;
use Carbon\CarbonImmutable;
interface ClockInterface { public function now(): CarbonImmutable; public function skewMargin(): int; }
