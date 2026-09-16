<?php
// routes/console.php — B.12 F-06 — scheduler single source — withoutOverlapping+onOneServer — Africa/Cairo — Arena
declare(strict_types=1);
use Illuminate\Support\Facades\Schedule;
Schedule::command('idempotency:purge --batch=1000')->hourly()->withoutOverlapping(60)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
Schedule::command('au:stagnant-deals-scan')->hourly()->withoutOverlapping(55)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
Schedule::command('au:calibrator-health-check')->everyFiveMinutes()->withoutOverlapping(4)->onOneServer()->timezone('Africa/Cairo');
Schedule::command('au:drm-heartbeat-check')->everyFiveMinutes()->withoutOverlapping(4)->onOneServer()->timezone('Africa/Cairo');
Schedule::command('au:red-team-simulation')->hourly()->withoutOverlapping(55)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
# B.13 F-12 — Proactive loops 24/7 — every15m Security, hourly Legal, every30m Refactor — withoutOverlapping onOneServer
Schedule::call(fn()=> app(\App\Services\Swarm\SecurityLoop::class)->tick())->everyFifteenMinutes()->withoutOverlapping(14)->onOneServer()->timezone('Africa/Cairo');
Schedule::call(fn()=> app(\App\Services\Swarm\LegalLoop::class)->tick())->hourly()->withoutOverlapping(55)->onOneServer()->timezone('Africa/Cairo');
Schedule::call(fn()=> app(\App\Services\Swarm\RefactoringLoop::class)->tick())->everyThirtyMinutes()->withoutOverlapping(28)->onOneServer()->timezone('Africa/Cairo');
