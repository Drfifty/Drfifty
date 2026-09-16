<?php
declare(strict_types=1);
namespace App\Domain\Agents\Exceptions;
final class DeterministicConfidenceBelowThresholdException extends \RuntimeException {
 public function __construct(public float $confidence, public float $threshold=90.0){
  parent::__construct("confidence {$confidence} < threshold {$threshold}");
 }
}
