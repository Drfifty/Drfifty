<?php
// AU SERV — Tickets + Dynamic Radius — Arena canonical — Rule5/36 — Spatial
declare(strict_types=1);
use App\Modules\AUServ\Http\Controllers\Api\V1\TicketController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/serv')->middleware('auth:jwt')->group(function () {
    Route::post('tickets', [TicketController::class, 'store'])->middleware('can:serv.ticket.create.execute');
    Route::patch('tickets/{uuid}/radius', [TicketController::class, 'adjustRadius'])->middleware('can:serv.dispatch.adjust.execute');
});
