<?php
// CheckpointTrait — B.11 F-07 — graceful SIGTERM drain 30s + DB checkpoint idempotent resume — R18/R35
declare(strict_types=1);
namespace App\Services\Queue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
trait CheckpointTrait {
 protected function checkpoint(string $jobId, array $progress, ?string $table = 'agent_execution_logs'): void {
  try {
   DB::table($table)->where('id', $jobId)->update(['checkpoint_json' => json_encode($progress, JSON_UNESCAPED_UNICODE), 'checkpoint_at' => now('Africa/Cairo'), 'updated_at' => now('Africa/Cairo')]);
  } catch (\Throwable $e) { Log::warning('checkpoint_failed', ['job' => $jobId, 'err' => $e->getMessage()]); }
 }
 protected function shouldDrain(): bool { return function_exists('pcntl_signal_dispatch') ? (bool) (app()->bound('queue.shouldQuit') ? app('queue.shouldQuit') : false) : false; }
 protected function resumeFromCheckpoint(?string $json): array { return $json ? (json_decode($json, true) ?: []) : []; }
}
