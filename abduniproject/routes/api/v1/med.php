<?php
// AU MED — Providers + Appointments + Anonymized Telemetry — Arena canonical — Rule6/36 — PG exclusive
declare(strict_types=1);
use App\Modules\AUMed\Http\Controllers\Api\V1\AppointmentController;
use App\Modules\AUMed\Http\Controllers\Api\V1\ProviderController;
use App\Modules\AUMed\Http\Controllers\Api\V1\TelemetryController;
use App\Modules\AUMed\Http\Middleware\AnonymizedTelemetryMiddleware;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/au-med')->group(function () {
    Route::get('providers', [ProviderController::class, 'index']);
    Route::get('providers/{uuid}', [ProviderController::class, 'show']);
    Route::middleware('auth:jwt')->group(function () {
        Route::post('appointments', [AppointmentController::class, 'store'])->middleware('can:med.appointment.execute');
        Route::post('telemetry/audit', [TelemetryController::class, 'audit'])
            ->middleware(['can:med.telemetry.audit.execute', AnonymizedTelemetryMiddleware::class, 'throttle:100,1']);
    });
});
