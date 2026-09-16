<?php
declare(strict_types=1);
namespace App\Services\Agents\Drivers;
use App\Domain\Agents\Contracts\DriverInterface; use App\Domain\Agents\ValueObjects\Proposal; use App\Infrastructure\Http\Clients\CloudLlmClient;
final class CloudLlmDriver implements DriverInterface {
 public function __construct(private CloudLlmClient $client){}
 public function driverName(): string { return 'cloud'; }
 public function propose(array $context): Proposal {
  $prompt=(string)($context['prompt'] ?? '');
  $j=$this->client->chat([['role'=>'user','content'=>$prompt]]);
  // Cloud confidence assumed 95 if tokens >0
  return new Proposal(confidence:95.0, output:(string)$j['content'], tokens:(int)$j['tokens'], costUsd:(float)$j['cost'], reasonCode:'OK');
 }
}
