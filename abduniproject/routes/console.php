<?php
// routes/console.php — B.12 F-06 — scheduler single source — withoutOverlapping+onOneServer — Africa/Cairo — Arena
declare(strict_types=1);
use Illuminate\Support\Facades\Schedule;
Schedule::command('idempotency:purge --batch=1000')->hourly()->withoutOverlapping(60)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
Schedule::command('au:stagnant-deals-scan')->hourly()->withoutOverlapping(55)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
Schedule::command('au:calibrator-health-check')->everyFiveMinutes()->withoutOverlapping(4)->onOneServer()->timezone('Africa/Cairo');
Schedule::command('au:drm-heartbeat-check')->everyFiveMinutes()->withoutOverlapping(4)->onOneServer()->timezone('Africa/Cairo');
Schedule::command('au:red-team-simulation')->hourly()->withoutOverlapping(55)->onOneServer()->runInBackground()->timezone('Africa/Cairo');
