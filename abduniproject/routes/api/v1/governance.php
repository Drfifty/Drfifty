<?php
// Governance — AU Lite + Leak + Calibrator + Kill-Switch + HITL — Arena canonical v5.0-B.8 F-01 additive hierarchy
// Hierarchy Trace(global)→Tenant422→Quarantine503→AULite503→PreOpGate→micro403/202→Sanitize422→Idempotency422 — no duplicate prefix
declare(strict_types=1);
use App\Http\Controllers\Api\V1\Governance\SystemController;
use App\Http\Controllers\Api\V1\Governance\CalibratorController;
use App\Http\Controllers\Api\V1\Governance\GovernanceController;
use App\Modules\Shared\Http\Controllers\Api\V1\SecurityController;
use App\Http\Middleware\PreOpGateMiddleware;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // System — view status open to any auth tenant, toggle gated micro+sanitize+idempotency (bank-grade)
    Route::get('system/modules/status', [SystemController::class, 'status'])
        ->middleware(['auth.jwt','ensureTenant','drm.quarantine','sanitize','throttle:60,1']);
    Route::post('system/modules/toggle', [SystemController::class, 'toggle'])
        ->middleware(['auth.jwt','ensureTenant','drm.quarantine','micro:governance.micro.toggle','sanitize','idempotency','throttle:10,1']);

    // Calibrator — health-score is read-only no micro, pre-op zero-DB <15ms via PreOpGate Zero-Trust
    Route::get('calibrator/health-score', [CalibratorController::class, 'healthScore'])
        ->middleware(['auth.jwt','ensureTenant','drm.quarantine','sanitize','throttle:60,1']);
    Route::post('calibrator/audit/pre-op', [CalibratorController::class, 'preOp'])
        ->middleware(['auth.jwt','ensureTenant','drm.quarantine', PreOpGateMiddleware::class,'sanitize','throttle:100,1']);

    // Governance — kill-switch super_admin+MFA+5/min+HMAC+idempotency, HITL queue 20 + approve micro
    Route::post('ai/governance/kill-switch', [GovernanceController::class, 'killSwitch'])
        ->middleware(['auth.jwt','ensureTenant','drm.quarantine','micro:governance.drm.annihilate','sanitize','idempotency','throttle:5,1']);
    Route::get('ai/governance/hitl/queue', [GovernanceController::class, 'hitlQueue'])
        ->middleware(['auth.jwt','ensureTenant','drm.quarantine','sanitize','throttle:60,1']);
    Route::post('ai/governance/hitl/approve', [GovernanceController::class, 'hitlApprove'])
        ->middleware(['auth.jwt','ensureTenant','drm.quarantine','micro:hitl.approve','sanitize','idempotency','throttle:30,1']);

    // legacy leak-check kept isolated
    Route::post('security/leak-check', [SecurityController::class, 'leakCheck'])
        ->middleware(['auth.jwt','sanitize','throttle:60,1']);
});
