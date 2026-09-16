<?php
// B.11 F-07/F-16 — Graceful checkpoint + TTL skew guard — additive only — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  // MySQL core agent_execution_logs checkpoint for SIGTERM drain idempotent resume
  if (Schema::hasTable('agent_execution_logs')) {
   if (!Schema::hasColumn('agent_execution_logs', 'checkpoint_json')) {
    Schema::table('agent_execution_logs', function (Blueprint $t) { $t->json('checkpoint_json')->nullable()->after('hash_current')->comment('F-07 graceful checkpoint progress'); });
   }
   if (!Schema::hasColumn('agent_execution_logs', 'checkpoint_at')) {
    Schema::table('agent_execution_logs', function (Blueprint $t) { $t->timestamp('checkpoint_at', 3)->nullable()->after('checkpoint_json'); });
   }
  }
  // ensure config tables exist comment no DDL on down
 }
 public function down(): void { /* additive — no drop */ }
};
