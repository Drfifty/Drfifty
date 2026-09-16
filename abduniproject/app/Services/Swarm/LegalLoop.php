<?php
// LegalLoop — B.13 F-06 — hourly low — preserve LegalLoop not dropped — Arena
declare(strict_types=1);
namespace App\Services\Swarm;
use Illuminate\Support\Facades\Cache;
final class LegalLoop {
 public int $intervalSec=3600; public string $queue='low';
 public function tick(): void {
  $lock=Cache::lock('swarm:legal:tick', 3540);
  if(!$lock->get()) return;
  try{ dispatch(new \App\Jobs\LegalComplianceJob())->onQueue($this->queue); } finally { $lock->release(); }
 }
}
