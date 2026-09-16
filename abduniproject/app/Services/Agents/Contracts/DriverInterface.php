<?php declare(strict_types=1);
namespace App\Services\Agents\Contracts;
enum DriverType: string { case DETERMINISTIC='deterministic'; case CLOUD='cloud'; case LOCAL_GPU='local_gpu'; }
enum FallbackReason: string { case LOW_CONFIDENCE='low_confidence'; case REGEX_MISMATCH='regex_mismatch'; case EXCEPTION='exception'; case CIRCUIT_OPEN='circuit_open'; }
final readonly class DriverResult {
  public function __construct(public DriverType $driver, public float $confidence, public array $data, public bool $requiresHitl=false, public ?FallbackReason $fallbackReason=null, public int $tookMs=0){}
  public function isConfident(): bool { return $this->confidence >= 0.90; }
}
interface DriverInterface { public function run(string $capability, array $payload): DriverResult; public function name(): DriverType; public function supports(string $capability): bool; }
