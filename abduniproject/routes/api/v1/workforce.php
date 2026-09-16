<?php
// Workforce Marketplace — Arena B.9 F-03 additive hierarchy — Trace→Tenant422→Quarantine503→AULite503→micro403/202→Sanitize422→Idempotency422
declare(strict_types=1);
use App\Http\Controllers\Api\V1\Workforce\CatalogueController;
use App\Http\Controllers\Api\V1\Workforce\CheckoutController;
use App\Http\Controllers\Api\V1\Workforce\TenantController;
use App\Http\Controllers\Api\V1\Workforce\DispatchController;
use App\Http\Controllers\Api\V1\Workforce\LogsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/workforce')->group(function () {
    // Catalogue — browse personas (auth optional but tenant+cached+replica)
    Route::get('agents', [CatalogueController::class, 'index'])
        ->middleware(['ensureTenant','drm.quarantine','sanitize','throttle:60,1']);
    // Auth required tenant-scoped
    Route::middleware(['auth.jwt','ensureTenant','drm.quarantine'])->group(function () {
        Route::post('agents/checkout', [CheckoutController::class, 'store'])
            ->middleware(['micro:workforce.checkout','sanitize','idempotency','throttle:5,1']);
        Route::get('tenant-agents', [TenantController::class, 'index'])
            ->middleware(['micro:workforce.tenant.view','sanitize','throttle:60,1']);
        // alias snake keep compat
        Route::get('tenant_agents', [TenantController::class, 'index'])
            ->middleware(['micro:workforce.tenant.view','sanitize','throttle:60,1']);
        Route::post('agents/{id}/dispatch', [DispatchController::class, 'store'])
            ->whereNumber('id')
            ->middleware(['micro:workforce.dispatch','sanitize','idempotency','throttle:30,1']);
        Route::get('agents/{id}/logs', [LogsController::class, 'index'])
            ->whereNumber('id')
            ->middleware(['micro:workforce.logs.view','sanitize','throttle:60,1']);
    });
});
