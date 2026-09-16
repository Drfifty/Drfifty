<?php
declare(strict_types=1);
namespace App\Jobs;
use App\Services\Security\SecurityAuditLogger; use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Queue\InteractsWithQueue;
final class LogSecurityAuditJob implements ShouldQueue {
 use Dispatchable, InteractsWithQueue, Queueable;
 public array $ctx;
 public function __construct(array $ctx){ $this->ctx=$ctx; }
 public function handle(): void { SecurityAuditLogger::insertBatch([$this->ctx]); }
}
