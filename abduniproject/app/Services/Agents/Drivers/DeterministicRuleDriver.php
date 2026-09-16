<?php
// DeterministicRuleDriver — Arena — B.4 — 0 token — Pure PHP 8.4 + Regex + FSM — timeout 2s
declare(strict_types=1);
namespace App\Services\Agents\Drivers;
use App\Domain\Agents\Contracts\DriverInterface; use App\Domain\Agents\ValueObjects\Proposal; use App\Domain\Agents\Exceptions\RegexMismatchException; use App\Domain\Agents\Exceptions\DeterministicConfidenceBelowThresholdException;
final class DeterministicRuleDriver implements DriverInterface {
 public function driverName(): string { return 'deterministic'; }
 public function propose(array $context): Proposal {
  $t=microtime(true);
  $input=(string)($context['prompt'] ?? $context['input'] ?? '');
  // Example FSM: pricing/taxonomy/dispatch — placeholder deterministic logic
  if(str_contains($input,'__force_regex_mismatch__')) throw new RegexMismatchException('regex mismatch');
  // Confidence heuristic: keyword match ratio (real impl uses Rule engines)
  $score = $input==='' ? 0.0 : min(100, 70 + (strlen($input) % 30));
  if(microtime(true)-$t > 2) throw new \RuntimeException('Deterministic timeout');
  if($score < 90) throw new DeterministicConfidenceBelowThresholdException($score, 90.0);
  return new Proposal(confidence:$score, output:"deterministic:".substr($input,0,200), tokens:0, costUsd:0.0, reasonCode:'OK');
 }
}
