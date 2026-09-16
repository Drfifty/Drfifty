<?php
// AuDrmHeartbeatCheck — B.12 F-09 — every5m delegates to B.3 DrmHeartbeatService beat() single source — Arena
declare(strict_types=1);
namespace App\Console\Commands;
use Illuminate\Console\Command; use App\Services\Security\DrmHeartbeatService; use App\Support\Lock;
final class AuDrmHeartbeatCheck extends Command {
 protected $signature='au:drm-heartbeat-check';
 protected $description='Every5m DRM heartbeat HMAC 576=48h single source — B.3 delegate';
 public function handle(DrmHeartbeatService $svc): int {
  $lock=Lock::withSkew('drm:heartbeat:check', 240);
  if(!$lock->get()){ $this->info('drm heartbeat lock held'); return 0; }
  try{ $svc->beat(); $this->info('drm heartbeat beat done'); }catch(\Throwable $e){ $this->error($e->getMessage()); return 1; } finally { $lock->release(); }
  return 0;
 }
}
