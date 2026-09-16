<?php
// AnnihilationJob — B.3 — queued 7-day grace final check — NOT instant — requires manual super_admin re-confirm
declare(strict_types=1);
namespace App\Jobs;
use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Log;
final class AnnihilationJob implements ShouldQueue {
 use Dispatchable, Queueable;
 public function __construct(public int $actorId){}
 public function handle(): void {
  $drm=DB::table('system_drm_states')->where('id',1)->first();
  if(!$drm?->is_quarantine_active) return;
  if($drm->grace_period_expires_at && now()->lt($drm->grace_period_expires_at)){
   Log::warning('annihilation_blocked_grace_active',['expires'=>$drm->grace_period_expires_at]); return;
  }
  Log::critical('annihilation_requested_pending_second_confirm',['actor'=>$this->actorId]);
  // NO auto DROP — only log + require second manual step via artisan drm:annihilate --confirm
 }
}
