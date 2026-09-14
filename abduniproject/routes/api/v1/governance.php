<?php
// Governance — AU Lite + Leak + Calibrator + Kill-Switch + HITL — Arena canonical — Rule5/36
declare(strict_types=1);
use App\Modules\Shared\Http\Controllers\Api\V1\CalibratorController;
use App\Modules\Shared\Http\Controllers\Api\V1\GovernanceController;
use App\Modules\Shared\Http\Controllers\Api\V1\SecurityController;
use App\Modules\Shared\Http\Controllers\Api\V1\SystemController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('system/modules/status', [SystemController::class, 'status'])->middleware('auth:jwt');
    Route::post('system/modules/toggle', [SystemController::class, 'toggle'])->middleware(['auth:jwt','can:system.modules.toggle.execute','throttle:10,1']);
    Route::post('security/leak-check', [SecurityController::class, 'leakCheck'])->middleware(['auth:jwt','throttle:60,1']);
    Route::get('calibrator/health-score', [CalibratorController::class, 'healthScore'])->middleware('auth:jwt');
    Route::post('calibrator/audit/pre-op', [CalibratorController::class, 'preOp'])->middleware(['auth:jwt','throttle:100,1']);
    Route::post('ai/governance/kill-switch', [GovernanceController::class, 'killSwitch'])->middleware(['auth:jwt','can:ai.kill_switch.execute']);
    Route::get('ai/governance/hitl/queue', [GovernanceController::class, 'hitlQueue'])->middleware('auth:jwt');
    Route::post('ai/governance/hitl/approve', [GovernanceController::class, 'hitlApprove'])->middleware(['auth:jwt','can:hitl.approve.execute']);
});
