<?php
// SecurityLoop — B.13 F-04 + FIX-360-13 skew — every15m low queue R37 replica — pushes HITL — Arena
declare(strict_types=1);
namespace App\Services\Swarm;
use Illuminate\Support\Facades\DB; use App\Support\Lock; use Illuminate\Support\Facades\Log;
final class SecurityLoop {
 public int $intervalSec=900; public string $queue='low';
 public function tick(): void {
  $lock=Lock::withSkew('swarm:security:tick', 840);
  if(!$lock->get()) return;
  try{ dispatch(new \App\Jobs\SecurityProbeJob())->onQueue($this->queue); } finally { $lock->release(); }
 }
}
