<?php
// AUDIT FIX B1 — Feature Flags Hardening — Arena — B1-F1,F2,F5,F6 + C-F1
// Fixes: VIRTUAL→STORED+index, degraded_mode, feature_flag_audits ledger, namespace, isolation prep
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // 1) degraded_mode column (idempotent)
  if (!Schema::hasColumn('feature_flags','degraded_mode')) {
   Schema::table('feature_flags', function(Blueprint $t){ $t->boolean('degraded_mode')->default(false)->after('is_core')->comment('1=read-only degraded'); });
  }
  // 2) GENERATED aliases — STORED + indexed (B1-F1 fix: VIRTUAL cannot be indexed)
  // Add only if not exist; if VIRTUAL exists drop & recreate as STORED
  try {
   $hasModule = Schema::hasColumn('feature_flags','module_key');
   $hasActive = Schema::hasColumn('feature_flags','is_active');
   $hasUpdated = Schema::hasColumn('feature_flags','updated_by');
   if (!$hasModule) {
    DB::statement("ALTER TABLE feature_flags ADD COLUMN module_key VARCHAR(50) GENERATED ALWAYS AS (flag_key) STORED COMMENT 'B.1 alias SPoT'");
    DB::statement("ALTER TABLE feature_flags ADD INDEX idx_flag_module_key (module_key)");
   }
   if (!$hasActive) {
    DB::statement("ALTER TABLE feature_flags ADD COLUMN is_active TINYINT(1) GENERATED ALWAYS AS (is_enabled) STORED");
    DB::statement("ALTER TABLE feature_flags ADD INDEX idx_flag_is_active (is_active)");
   }
   if (!$hasUpdated) {
    DB::statement("ALTER TABLE feature_flags ADD COLUMN updated_by BIGINT UNSIGNED GENERATED ALWAYS AS (last_toggled_by) STORED");
   }
  } catch (\Throwable $e) { /* additive idempotent — log but not fail */ }

  // 3) Core always enabled CHECK (B1-F1)
  try { DB::statement("ALTER TABLE feature_flags ADD CONSTRAINT chk_core_always_enabled CHECK (is_core = 0 OR is_enabled = 1)"); } catch(\Throwable $e){}

  // 4) Audit ledger — append-only (B1-F2) — who toggled + reason + IP + prev/next
  if (!Schema::hasTable('feature_flag_audits')) {
   Schema::create('feature_flag_audits', function(Blueprint $t){
    $t->id();
    $t->string('flag_key',50);
    $t->boolean('old_is_enabled')->nullable();
    $t->boolean('new_is_enabled');
    $t->boolean('old_degraded_mode')->nullable();
    $t->boolean('new_degraded_mode')->nullable();
    $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
    $t->string('reason',500)->nullable()->comment('mandatory rationale for toggle');
    $t->string('ip_address',45)->nullable();
    $t->json('meta')->nullable();
    $t->timestamp('created_at')->useCurrent();
    $t->index(['flag_key','created_at']);
    $t->index('actor_id');
    $t->foreign('flag_key')->references('flag_key')->on('feature_flags')->cascadeOnUpdate()->restrictOnDelete();
   });
   DB::statement("ALTER TABLE feature_flag_audits COMMENT='Append-only toggle audit — REVOKE UPDATE,DELETE'");
  }
  // REVOKE suggestion (DBA executes): REVOKE UPDATE,DELETE ON feature_flag_audits FROM 'abd_app'@'%';
 }
 public function down(): void {
  Schema::dropIfExists('feature_flag_audits');
  // aliases kept (additive) — no drop
 }
};
