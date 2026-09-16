<?php
// Reverb — Arena B.10 F-04 — replay last 50 buffered events for at-least-once reconnect dedup
declare(strict_types=1);
use App\Http\Controllers\Api\V1\Reverb\ReplayController;
use Illuminate\Support\Facades\Route;
Route::prefix('v1')->group(function(){
 Route::get('reverb/replay', [ReplayController::class,'index'])->middleware(['auth.jwt','sanitize','throttle:60,1']);
 // alias snake keep compat
 Route::get('reverb/replay_events', [ReplayController::class,'index'])->middleware(['auth.jwt','sanitize','throttle:60,1']);
});
