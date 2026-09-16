<?php
// AU DEALS — B.7 hardened F-01→F-14 — Arena — TenantScoped ngram SPATIAL + hierarchy — Additive (legacy kept via 302)
declare(strict_types=1);
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Deals\ListingController;
use App\Http\Controllers\Api\V1\Deals\StagnantController;

Route::prefix('v1/deals')->group(function () {
 // Public browse — still tenant-aware + AULite + leak scan + throttled
 Route::get('listings', [ListingController::class, 'index'])->middleware(['ensureTenant','drm.quarantine','au.lite:AU DEALS','sanitize','throttle:deals-search']);
 Route::get('search', [ListingController::class, 'index'])->middleware(['ensureTenant','drm.quarantine','au.lite:AU DEALS','sanitize','throttle:deals-search']); // F-01 alias 302-equivalent
 Route::get('listings/{uuid}', [ListingController::class, 'show'])->middleware(['ensureTenant','drm.quarantine','au.lite:AU DEALS']);
 Route::middleware(['auth.jwt','ensureTenant','drm.quarantine','au.lite:AU DEALS'])->group(function () {
  Route::post('listings', [ListingController::class, 'store'])->middleware(['micro:deals.create','sanitize','idempotency','throttle:deals-write']);
  Route::post('stagnant/promote', [StagnantController::class, 'promote'])->middleware(['micro:deals.promote','sanitize','idempotency','throttle:deals-promote']);
  // legacy alias {uuid} form
  Route::post('stagnant/{uuid}/promote', [StagnantController::class, 'promote'])->middleware(['micro:deals.promote','sanitize','idempotency']);
 });
});
