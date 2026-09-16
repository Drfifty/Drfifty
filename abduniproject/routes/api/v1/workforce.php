<?php
// Workforce Marketplace — Catalogue + Checkout (escrow) + Tenant + Dispatch — Arena canonical — app_id isolation
declare(strict_types=1);
use App\Modules\Shared\Http\Controllers\Api\V1\WorkforceController;
use App\Modules\Shared\Http\Middleware\EnsureTenantWorkforce;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/workforce')->group(function () {
    Route::get('agents', [WorkforceController::class, 'catalogue']);
    Route::middleware(['auth:jwt', EnsureTenantWorkforce::class])->group(function () {
        Route::post('agents/checkout', [WorkforceController::class, 'checkout'])->middleware('can:workforce.checkout.execute');
        Route::get('tenant-agents', [WorkforceController::class, 'tenantAgents'])->middleware('can:workforce.tenant.view');
        Route::post('agents/{id}/dispatch', [WorkforceController::class, 'dispatch'])->middleware('can:workforce.dispatch.execute');
    });
});
