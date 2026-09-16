<?php
declare(strict_types=1);
namespace App\Services\Agents\Drivers;
use App\Domain\Agents\Contracts\DriverInterface; use App\Domain\Agents\ValueObjects\Proposal; use App\Infrastructure\Http\Clients\LocalGpuClient;
final class LocalGpuDriver implements DriverInterface {
 public function __construct(private LocalGpuClient $client){}
 public function driverName(): string { return 'local_gpu'; }
 public function propose(array $context): Proposal {
  $prompt=(string)($context['prompt'] ?? '');
  $j=$this->client->post(['prompt'=>$prompt,'max_tokens'=>256]);
  $tokens=(int)($j['usage']['total_tokens'] ?? strlen($prompt)/4);
  $cost=$tokens/1000 * (float)env('LOCAL_GPU_COST_PER_1K',0.001);
  return new Proposal(confidence:92.0, output:(string)($j['choices'][0]['text'] ?? $j['text'] ?? ''), tokens:$tokens, costUsd:$cost, reasonCode:'OK');
 }
}
