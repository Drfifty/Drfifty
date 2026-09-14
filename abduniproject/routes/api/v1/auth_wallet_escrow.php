<?php
// AU Platform — Auth & Financial APIs v1 — Arena canonical — Pillar 6/9 — Rule5/36
declare(strict_types=1);
use App\Modules\AUBusiness\Http\Controllers\Api\V1\AuthController;
use App\Modules\AUBusiness\Http\Controllers\Api\V1\WalletController;
use App\Modules\AUBusiness\Http\Controllers\Api\V1\EscrowController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::post('refresh', [AuthController::class, 'refresh']); // HttpOnly __Host-rt only
        Route::get('me', [AuthController::class, 'me'])->middleware('auth:jwt');
    });
    Route::middleware(['auth:jwt', 'throttle:60,1'])->group(function () {
        Route::get('wallet/balance', [WalletController::class, 'balance'])->middleware('can:wallet.balance.view');
        Route::post('wallet/deposit', [WalletController::class, 'deposit'])->middleware('can:wallet.deposit.execute');
        Route::post('wallet/withdraw-request', [WalletController::class, 'withdrawRequest'])->middleware('can:wallet.withdraw.execute');
        Route::post('escrow/lock', [EscrowController::class, 'lock'])->middleware('can:escrow.lock.execute');
        Route::post('escrow/release', [EscrowController::class, 'release'])->middleware('can:escrow.release.execute');
        Route::post('escrow/dispute', [EscrowController::class, 'dispute'])->middleware('can:escrow.dispute.execute');
    });
});
