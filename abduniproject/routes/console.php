<?php
// routes/console.php — B.12 F-06 + FIX-360-03 stagger — single source — withoutOverlapping+onOneServer — Africa/Cairo — Arena
declare(strict_types=1);
use Illuminate\Support\Facades\Schedule;
// FIX-360-03/R37: stagger Cairo hour burst :07/:12/:13/:22 + 5-min offset via cron — prevents 00:00 contention (R15/R23)
Schedule::command('stats:aggregate')->dailyAt('00:30')->withoutOverlapping(25)->onOneServer()->timezone('Africa/Cairo');
Schedule::command('idempotency:purge --batch=1000')->hourlyAt(12)->withoutOverlapping(60)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
Schedule::command('au:stagnant-deals-scan')->hourlyAt(7)->withoutOverlapping(55)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
Schedule::command('au:calibrator-health-check')->cron('2,7,12,17,22,27,32,37,42,47,52,57 * * * *')->withoutOverlapping(4)->onOneServer()->timezone('Africa/Cairo');
Schedule::command('au:drm-heartbeat-check')->cron('4,9,14,19,24,29,34,39,44,49,54,59 * * * *')->withoutOverlapping(4)->onOneServer()->timezone('Africa/Cairo');
Schedule::command('au:red-team-simulation')->hourlyAt(22)->withoutOverlapping(55)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
# B.13 F-12 + FIX-360-03 — Swarm proactive loops staggered — 15m Security :00/:15, Legal :13, Refactor :07/:37 — withoutOverlapping onOneServer
Schedule::call(fn()=> app(\App\Services\Swarm\SecurityLoop::class)->tick())->cron('0,15,30,45 * * * *')->withoutOverlapping(14)->onOneServer()->timezone('Africa/Cairo');
Schedule::call(fn()=> app(\App\Services\Swarm\LegalLoop::class)->tick())->hourlyAt(13)->withoutOverlapping(55)->onOneServer()->timezone('Africa/Cairo');
Schedule::call(fn()=> app(\App\Services\Swarm\RefactoringLoop::class)->tick())->cron('7,37 * * * *')->withoutOverlapping(28)->onOneServer()->timezone('Africa/Cairo');
