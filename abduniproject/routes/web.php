<?php
// ABD UNI PROJECT — Routes (Modular Monolith — app/Modules/*/Controllers/{Admin,User,Public})
// Strictly split by Admin / User / Public (Rule 5). Feature-flag guard per app_id.

declare(strict_types=1);

use App\Modules\Shared\Http\Middleware\CheckModuleStatus;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public — no auth, aggregated Ecosystem Master View allowed
Route::get('/', fn () => Inertia::render('Welcome', ['app_id' => 'AU BUSINESS']))->name('home');
Route::get('/health', fn () => response()->json(['status' => 'ok', 'reverb' => 8080]))->name('health');

// Dev Sandbox — Living showcase for Phase 4.0 atomic primitives & screens — local only
Route::get('/dev/sandbox', fn () => Inertia::render('Dev/Sandbox'))->name('dev.sandbox');

// User — authenticated tenant context
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    // Example module routes — each module registers its own sub-routes
    // AU DEALS (hibernatable)
    Route::middleware([CheckModuleStatus::class . ':AU DEALS'])->group(function () {
        Route::get('/deals', fn () => Inertia::render('Deals/Index'))->name('deals.index');
    });
});

// Admin — exhaustive Master Admin Dashboard (Module 9)
Route::middleware(['auth', 'can:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => Inertia::render('Admin/Dashboard'))->name('dashboard');
    Route::get('/agent-actions', fn () => Inertia::render('Admin/AgentActions'))->name('agent-actions');
});

require __DIR__ . '/auth.php';
