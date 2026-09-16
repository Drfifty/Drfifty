<?php
// AU SERV — B.7 hardened F-03/F-04 — Arena — SPATIAL SRID4326 + Mutex + alias /serve
declare(strict_types=1);
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Serv\TicketController;
use App\Http\Controllers\Api\V1\Serv\ProviderNearbyController;

Route::prefix('v1/serv')->middleware(['ensureTenant','drm.quarantine','au.lite:AU SERV'])->group(function () {
 Route::get('providers/nearby', [ProviderNearbyController::class, 'index'])->middleware(['sanitize','throttle:serv-nearby']);
 Route::middleware(['auth.jwt'])->group(function () {
  Route::post('tickets', [TicketController::class, 'store'])->middleware(['micro:serv.ticket.create','sanitize','idempotency','throttle:serv-tickets']);
  Route::patch('tickets/{uuid}/radius', [TicketController::class, 'store'])->middleware(['micro:serv.dispatch','sanitize','idempotency']); // alias to store for radius adjust
 });
});
// alias /v1/serve → /v1/serv for spec compatibility F-01
Route::prefix('v1/serve')->middleware(['ensureTenant','drm.quarantine','au.lite:AU SERV'])->group(function () {
 Route::get('providers/nearby', [ProviderNearbyController::class, 'index'])->middleware(['sanitize','throttle:serv-nearby']);
 Route::post('tickets', [TicketController::class, 'store'])->middleware(['auth.jwt','micro:serv.ticket.create','sanitize','idempotency']);
});
