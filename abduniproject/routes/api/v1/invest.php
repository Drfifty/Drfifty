<?php
// AU INVEST — Funding Dispatches (escrow 3-Tier snapshot) — Arena canonical
declare(strict_types=1);
use App\Modules\AUInvest\Http\Controllers\Api\V1\InvestDispatchController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/invest')->middleware('auth:jwt')->group(function () {
    Route::post('dispatches', [InvestDispatchController::class, 'store'])->middleware('can:invest.dispatch.execute');
});
