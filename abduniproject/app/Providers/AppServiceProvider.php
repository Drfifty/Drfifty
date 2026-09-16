<?php
// AppServiceProvider — Arena — B.11 F-04/F-16 — Clock binding + skew TTL + Reverb guard
declare(strict_types=1);
namespace App\Providers;
use Illuminate\Support\ServiceProvider;
use App\Services\Time\ClockInterface;
use App\Services\Time\SystemClock;
final class AppServiceProvider extends ServiceProvider {
 public function register(): void {
  $this->app->singleton(ClockInterface::class, fn() => new SystemClock());
  $this->app->alias(ClockInterface::class, 'clock');
 }
 public function boot(): void {
  // TTL helper with skew — usage: app(ClockInterface::class)->skewMargin() or SystemClock::ttlWithSkew(30)
  if (app()->environment('production') && env('BROADCAST_CONNECTION', 'reverb') !== 'reverb') {
   // soft guard — log not hard fail to allow queue log driver fallback (B.10)
   \Illuminate\Support\Facades\Log::warning('BROADCAST_CONNECTION not reverb in prod', ['trace' => app()->bound('trace_id') ? app('trace_id') : null]);
  }
 }
}
