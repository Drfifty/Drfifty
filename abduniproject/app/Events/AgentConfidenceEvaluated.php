<?php
declare(strict_types=1);
namespace App\Events;
use Illuminate\Foundation\Events\Dispatchable;
final class AgentConfidenceEvaluated {
 use Dispatchable;
 public function __construct(public int $agentId, public float $confidence, public string $reasonCode, public string $traceId, public int $durationMs, public float $costUsd){}
}
