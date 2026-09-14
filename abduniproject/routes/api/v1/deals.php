<?php
// AU DEALS — Listing, Search, Stagnant, Provider Catalog — Arena canonical — Rule5/36
declare(strict_types=1);
use App\Modules\AUDeals\Http\Controllers\Api\V1\ListingController;
use App\Modules\AUDeals\Http\Controllers\Api\V1\ProviderController;
use App\Modules\AUDeals\Http\Controllers\Api\V1\StagnantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/deals')->group(function () {
    Route::get('listings', [ListingController::class, 'index']);
    Route::get('listings/{uuid}', [ListingController::class, 'show']);
    Route::get('providers', [ProviderController::class, 'index']);
    Route::get('providers/{id}', [ProviderController::class, 'show']);
    Route::middleware('auth:jwt')->group(function () {
        Route::post('listings', [ListingController::class, 'store'])->middleware(['can:deals.create.execute','throttle:20,1']);
        Route::put('listings/{uuid}', [ListingController::class, 'update'])->middleware('can:deals.update.execute');
        Route::get('stagnant', [StagnantController::class, 'index'])->middleware('can:deals.stagnant.view');
        Route::post('stagnant/{uuid}/promote', [StagnantController::class, 'promote'])->middleware('can:deals.promote.execute');
    });
});
