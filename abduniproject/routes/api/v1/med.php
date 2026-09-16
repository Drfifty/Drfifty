<?php
// AU MED — B.7 hardened F-07 — Arena — pgsql PostGIS+pgcrypto HMAC + AnonymizedTelemetryMiddleware + alias /au-med
declare(strict_types=1);
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Med\ProviderController;
use App\Http\Controllers\Api\V1\Med\AppointmentController;
use App\Http\Controllers\Api\V1\Med\TelemetryController;
use App\Http\Middleware\AnonymizedTelemetryMiddleware;

Route::prefix('v1/med')->middleware(['ensureTenant','drm.quarantine','au.lite:AU MED'])->group(function () {
 Route::get('providers', [ProviderController::class, 'index'])->middleware(['sanitize','throttle:med-browse']);
 Route::middleware(['auth.jwt'])->group(function () {
  Route::post('appointments', [AppointmentController::class, 'store'])->middleware(['micro:med.appointment','sanitize','idempotency','throttle:med-appointments']);
  Route::post('telemetry/audit', [TelemetryController::class, 'audit'])->middleware(['micro:med.telemetry.audit', AnonymizedTelemetryMiddleware::class,'sanitize','throttle:med-telemetry','idempotency']);
 });
});
// legacy /au-med alias (existing) keeps pgsql but redirects are handled by spec 302 — we duplicate handlers for additive
Route::prefix('v1/au-med')->middleware(['ensureTenant','drm.quarantine','au.lite:AU MED'])->group(function () {
 Route::get('providers', [ProviderController::class, 'index'])->middleware(['sanitize','throttle:med-browse']);
 Route::middleware(['auth.jwt'])->group(function () {
  Route::post('appointments', [AppointmentController::class, 'store'])->middleware(['micro:med.appointment','sanitize','idempotency']);
  Route::post('telemetry/audit', [TelemetryController::class, 'audit'])->middleware(['micro:med.telemetry.audit', AnonymizedTelemetryMiddleware::class,'sanitize','throttle:med-telemetry','idempotency']);
 });
});
