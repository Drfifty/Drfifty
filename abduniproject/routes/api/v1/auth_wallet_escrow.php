<?php
// AU Platform — Auth & Financial APIs v1 — Arena canonical — B.6 hardened F-01→F-14 — Pillar 6/9 — R5/36
// Hierarchy: TraceId(global)→EnsureTenant(422)→QuarantineGuard(503 DRM)→AULite(503)→micro(403/202)→Sanitize(422)→Idempotency(422)
declare(strict_types=1);
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\WalletController;
use App\Http\Controllers\Api\V1\EscrowController;
use App\Http\Controllers\Api\V1\Admin\WalletAdjustmentController;

Route::prefix('v1')->group(function () {
 // Auth — public but still behind TraceId+Quarantine global + Redis distributed throttle F-12
 Route::prefix('auth')->group(function () {
  Route::post('register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
  Route::post('login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
  Route::post('refresh', [AuthController::class, 'refresh'])->middleware('throttle:auth-refresh');
  Route::get('me', [AuthController::class, 'me'])->middleware('auth.jwt');
  Route::post('logout', [AuthController::class, 'logout'])->middleware('auth.jwt');
 });
 // Financial — authenticated + tenant + DRM + Au Lite enforced globally, micro per-route F-03
 Route::middleware(['auth.jwt','throttle:60,1'])->group(function () {
  Route::get('wallet/balance', [WalletController::class, 'balance']);
  Route::post('wallet/deposit', [WalletController::class, 'deposit'])->middleware(['micro:escrow.lock','sanitize','idempotency']);
  Route::post('wallet/withdraw-request', [WalletController::class, 'withdrawRequest'])->middleware(['micro:escrow.lock','sanitize','idempotency']);
  Route::post('escrow/lock', [EscrowController::class, 'lock'])->middleware(['micro:escrow.lock','sanitize','idempotency']);
  Route::post('escrow/release', [EscrowController::class, 'release'])->middleware(['micro:escrow.release','sanitize','idempotency']);
  Route::post('escrow/dispute', [EscrowController::class, 'dispute'])->middleware(['micro:escrow.refund','sanitize','idempotency']);
  Route::post('admin/wallet/adjust', [WalletAdjustmentController::class, 'adjust'])->middleware(['micro:wallet.adjust','sanitize','idempotency']);
 });
});
