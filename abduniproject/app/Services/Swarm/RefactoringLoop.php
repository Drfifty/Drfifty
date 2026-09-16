<?php
// RefactoringLoop — B.13 F-05 — every30m low replica — propose index — Arena
declare(strict_types=1);
namespace App\Services\Swarm;
use Illuminate\Support\Facades\Cache;
final class RefactoringLoop {
 public int $intervalSec=1800; public string $queue='low';
 public function tick(): void {
  $lock=Cache::lock('swarm:refactor:tick', 1740);
  if(!$lock->get()) return;
  try{ dispatch(new \App\Jobs\OptimizeQueryJob(['query'=>'SELECT * FROM deals_listings WHERE is_stagnant=1']))->onQueue($this->queue); } finally { $lock->release(); }
 }
}
