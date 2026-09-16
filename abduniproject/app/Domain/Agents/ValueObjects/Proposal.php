<?php
// Proposal VO — Arena — B.4 — confidence >=90 pass strict R38
declare(strict_types=1);
namespace App\Domain\Agents\ValueObjects;
final readonly class Proposal {
 public function __construct(
  public float $confidence, // 0-100
  public string $output,
  public int $tokens = 0,
  public float $costUsd = 0.0,
  public string $reasonCode = 'OK', // OK|CONFIDENCE_LOW|REGEX_MISMATCH|BUDGET_EXHAUSTED|CIRCUIT_OPEN|ALL_DRIVERS_FAILED
 ){}
 public function isPass(float $threshold=90.0): bool { return $this->confidence >= $threshold; }
}
