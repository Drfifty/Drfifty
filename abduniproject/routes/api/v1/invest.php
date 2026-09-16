<?php
// AU INVEST — B.7 hardened F-06 — Arena — WORM + state-machine + Idempotency
declare(strict_types=1);
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Invest\OpportunityController;
use App\Http\Controllers\Api\V1\Invest\PledgeController;

Route::prefix('v1/invest')->middleware(['ensureTenant','drm.quarantine','au.lite:AU INVEST'])->group(function () {
 Route::get('opportunities', [OpportunityController::class, 'index'])->middleware(['sanitize','throttle:invest-browse']);
 Route::middleware(['auth.jwt'])->group(function () {
  Route::post('escrow/pledge', [PledgeController::class, 'pledge'])->middleware(['micro:invest.fractional.issue','sanitize','idempotency','throttle:invest-pledge']);
  Route::post('dispatches', [PledgeController::class, 'pledge'])->middleware(['micro:invest.fractional.issue','sanitize','idempotency']); // alias canonical
 });
});
