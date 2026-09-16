<?php
// B.3 — Micro Permissions Hardened — Arena — B1a reconciliation additive — STORED+indexes+audit
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // Base table may exist from B.1a (preferred_driver) — upgrade idempotent
  if (!Schema::hasTable('micro_switch_matrix')) {
   Schema::create('micro_switch_matrix', function(Blueprint $t){
    $t->id();
    $t->tinyInteger('agent_id')->unsigned()->comment('1..13');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS');
    $t->tinyInteger('module_id')->unsigned()->comment('1..9');
    $t->string('sub_capability_key',80);
    $t->boolean('is_enabled')->default(true);
    $t->boolean('approval_required')->default(false);
    $t->enum('preferred_driver',['deterministic','cloud','local_gpu'])->nullable()->comment('B.1a compat');
    $t->boolean('llm_fallback_enabled')->default(true)->comment('B.1a compat');
    $t->unsignedBigInteger('granted_by')->nullable();
    $t->string('reason',500)->nullable();
    $t->timestamps();
    $t->unique(['agent_id','app_id','module_id','sub_capability_key'],'uk_agent_app_module_cap');
    $t->index(['agent_id','app_id'],'idx_ms_agent_app');
    $t->index('is_enabled'); $t->index('module_id');
    $t->foreign('granted_by')->references('id')->on('users')->nullOnDelete();
   });
   DB::statement("ALTER TABLE micro_switch_matrix ADD CONSTRAINT chk_ms_agent_1_13 CHECK (agent_id BETWEEN 1 AND 13)");
   DB::statement("ALTER TABLE micro_switch_matrix ADD CONSTRAINT chk_ms_module_1_9 CHECK (module_id BETWEEN 1 AND 9)");
  } else {
   Schema::table('micro_switch_matrix', function(Blueprint $t){
    if(!Schema::hasColumn('micro_switch_matrix','sub_capability_key')) $t->string('sub_capability_key',80)->after('module_id');
    if(!Schema::hasColumn('micro_switch_matrix','is_enabled')) $t->boolean('is_enabled')->default(true)->after('sub_capability_key');
    if(!Schema::hasColumn('micro_switch_matrix','approval_required')) $t->boolean('approval_required')->default(false)->after('is_enabled');
    if(!Schema::hasColumn('micro_switch_matrix','reason')) $t->string('reason',500)->nullable()->after('granted_by');
   });
   // ensure unique composite exists
   try{ DB::statement("ALTER TABLE micro_switch_matrix ADD CONSTRAINT uk_agent_app_module_cap UNIQUE (agent_id,app_id,module_id,sub_capability_key)"); }catch(\Throwable $e){}
  }
  if (!Schema::hasTable('micro_switch_audits')) {
   Schema::create('micro_switch_audits', function(Blueprint $t){
    $t->id();
    $t->unsignedBigInteger('matrix_id');
    $t->tinyInteger('agent_id')->unsigned();
    $t->string('sub_capability_key',80);
    $t->boolean('old_is_enabled')->nullable(); $t->boolean('new_is_enabled');
    $t->boolean('old_approval_required')->nullable(); $t->boolean('new_approval_required');
    $t->unsignedBigInteger('actor_id')->nullable(); $t->string('ip_address',45)->nullable();
    $t->string('reason',500)->nullable();
    $t->timestamp('created_at',3)->useCurrent();
    $t->index('matrix_id'); $t->index('agent_id');
    $t->foreign('matrix_id')->references('id')->on('micro_switch_matrix')->cascadeOnDelete();
    $t->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
   });
   DB::statement("ALTER TABLE micro_switch_audits COMMENT='WORM — REVOKE UPDATE,DELETE'");
  }
  // REVOKE suggestion: REVOKE UPDATE,DELETE ON micro_switch_audits FROM 'abd_app'@'%';
 }
 public function down(): void { /* additive only */ }
};
