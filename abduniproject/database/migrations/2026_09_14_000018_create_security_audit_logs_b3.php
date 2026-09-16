<?php
// B.3 — Security Audit WORM — Arena — hash-chain + partition + PII redaction + REVOKE
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  if (!Schema::hasTable('security_audit_logs')) {
   Schema::create('security_audit_logs', function(Blueprint $t){
    $t->id();
    $t->char('uuid',36)->unique();
    $t->char('trace_id',32)->index()->comment('W3C traceparent');
    $t->unsignedBigInteger('user_id')->nullable();
    $t->tinyInteger('agent_id')->unsigned()->nullable()->comment('1..13 or null human');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->nullable();
    $t->tinyInteger('module_id')->unsigned()->nullable();
    $t->string('action',80)->comment('API_CALL|FIELD_EDIT|AI_PROMPT|MICRO_TOGGLE|DRM_DISARM');
    $t->string('route',150); $t->string('method',10);
    $t->json('query_params')->nullable()->comment('allowlist redacted');
    $t->char('payload_hash',64)->comment('SHA256 canonical SORT_KEYS');
    $t->json('payload_snapshot')->nullable()->comment('allowlist — no PII');
    $t->string('ip_address',45); $t->string('user_agent',255)->nullable();
    $t->char('prev_hash',64)->nullable(); $t->char('hash_current',64);
    $t->timestamp('created_at',3)->useCurrent();
    $t->index(['user_id','created_at'],'idx_sal_user_created');
    $t->index(['route','created_at'],'idx_sal_route');
    $t->index('agent_id');
    $t->foreign('user_id')->references('id')->on('users')->nullOnDelete();
   });
   DB::statement("ALTER TABLE security_audit_logs ADD CONSTRAINT chk_sal_qp_json CHECK (query_params IS NULL OR JSON_VALID(query_params))");
   DB::statement("ALTER TABLE security_audit_logs ADD CONSTRAINT chk_sal_hash64 CHECK (CHAR_LENGTH(payload_hash)=64)");
   DB::statement("ALTER TABLE security_audit_logs COMMENT='WORM — REVOKE UPDATE,DELETE — hash_chain — partition monthly'");
  }
  // REVOKE suggestion: REVOKE UPDATE,DELETE ON security_audit_logs FROM 'abd_app'@'%';
  // Partition monthly — DBA executes: ALTER TABLE ... PARTITION BY RANGE (YEAR(created_at)*100+MONTH(created_at))(...)
 }
 public function down(): void { /* worm — no drop */ }
};
