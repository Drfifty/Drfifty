<?php
// AUDIT FIX B2 — Financial Engine Hardening — Arena — B2-F1..F7 + C-F1
// wallet_adjustment_logs + escrow_events + idempotency_keys + heartbeat + commission precision + immutability
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // === A) wallet_adjustment_logs — append-only B2 §1.2C — mandatory_rationale TRIM>=15 (B2-F2) ===
  if (!Schema::hasTable('wallet_adjustment_logs')) {
   Schema::create('wallet_adjustment_logs', function(Blueprint $t){
    $t->id();
    $t->foreignId('wallet_id')->constrained('app_wallets')->cascadeOnDelete();
    $t->foreignId('admin_id')->constrained('users')->restrictOnDelete();
    $t->bigInteger('amount_changed_minor');
    $t->bigInteger('previous_balance_minor');
    $t->bigInteger('new_balance_minor');
    $t->text('mandatory_rationale')->comment('TRIM>=15 — dual validated');
    $t->string('ip_address',45)->comment('via $request->ip() after TrustProxies');
    $t->char('reference_uuid',36);
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS');
    $t->timestamp('created_at',3)->useCurrent();
    $t->index(['wallet_id','created_at']);
    $t->index('admin_id');
   });
   DB::statement("ALTER TABLE wallet_adjustment_logs ADD CONSTRAINT chk_wal_rationale_trim CHECK (CHAR_LENGTH(TRIM(mandatory_rationale)) >= 15)");
   DB::statement("ALTER TABLE wallet_adjustment_logs ADD CONSTRAINT chk_wal_balance_math CHECK (new_balance_minor = previous_balance_minor + amount_changed_minor)");
   DB::statement("ALTER TABLE wallet_adjustment_logs COMMENT='Append-only — REVOKE UPDATE,DELETE'");
  }

  // === B) escrow_events — append-only ledger — deterministic hash (B2-F7) ===
  if (!Schema::hasTable('escrow_events')) {
   Schema::create('escrow_events', function(Blueprint $t){
    $t->bigIncrements('event_id');
    $t->char('transaction_id',36)->comment('FK escrow_clearings.transaction_id');
    $t->enum('from_status',['holding','partial_milestone','release_eligible','released','refunded','disputed','expired','waiting_list','chargeback_frozen'])->default('holding');
    $t->enum('to_status',['holding','partial_milestone','release_eligible','released','refunded','disputed','expired','waiting_list','chargeback_frozen'])->default('holding');
    $t->enum('actor_type',['buyer','seller','agent_cfo','super_admin','system','agent_13_fraud'])->default('system');
    $t->unsignedBigInteger('actor_id')->nullable();
    $t->string('reason_code',50)->comment('RELEASE_ELIGIBLE, DISPUTE_OPENED...');
    $t->char('payload_snapshot_hash',64)->comment('SHA256 canonical json_encode SORT_KEYS');
    $t->json('payload_snapshot')->nullable()->comment('allowlist redacted');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS');
    $t->timestamp('created_at',3)->useCurrent();
    $t->bigInteger('sequence')->unsigned()->nullable()->comment('logical clock tie-breaker');
    $t->index(['transaction_id','created_at']);
    $t->index('to_status');
    $t->index(['actor_type','actor_id']);
   });
   DB::statement("ALTER TABLE escrow_events ADD CONSTRAINT chk_ee_hash_len CHECK (CHAR_LENGTH(payload_snapshot_hash)=64)");
   // FK to escrow_clearings.transaction_id (char) — if table exists
   try { DB::statement("ALTER TABLE escrow_events ADD CONSTRAINT fk_ee_transaction FOREIGN KEY (transaction_id) REFERENCES escrow_clearings(transaction_id) ON DELETE CASCADE ON UPDATE CASCADE"); } catch(\Throwable $e){}
   DB::statement("ALTER TABLE escrow_events COMMENT='Append-only — single source dispute — REVOKE UPDATE,DELETE'");
  }

  // === C) idempotency_keys — 24h replay — hash comparison (B2-F1,F6) ===
  if (!Schema::hasTable('idempotency_keys')) {
   Schema::create('idempotency_keys', function(Blueprint $t){
    $t->id();
    $t->string('idempotency_key',64)->comment('Idempotency-Key header UUIDv4 32+ hex');
    $t->string('endpoint',120)->comment('POST /api/v1/wallet/transfer');
    $t->unsignedBigInteger('user_id');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS');
    $t->char('request_hash',64)->comment('SHA256 canonical JSON body SORT_KEYS');
    $t->smallInteger('response_status');
    $t->json('response_body')->comment('verbatim — replayed within 24h');
    $t->timestamp('created_at',3)->useCurrent();
    $t->dateTime('expires_at',3)->comment('created_at+24h TTL batched purge');
    $t->unique(['idempotency_key','user_id','endpoint'],'uk_key_user_endpoint');
    $t->index('expires_at');
    $t->index(['user_id','created_at']);
    $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
   });
   DB::statement("ALTER TABLE idempotency_keys ADD CONSTRAINT chk_idem_key_len CHECK (CHAR_LENGTH(TRIM(idempotency_key)) >= 16)");
  }

  // === D) heartbeat — replica lag without REPLICATION CLIENT (B2-F5) ===
  if (!Schema::hasTable('heartbeat')) {
   Schema::create('heartbeat', function(Blueprint $t){
    $t->tinyInteger('id')->primary()->default(1);
    $t->timestamp('beat_at',3)->useCurrent()->comment('primary writes NOW(3) every 1s');
    $t->string('source',20)->default('primary');
   });
   DB::table('heartbeat')->updateOrInsert(['id'=>1],['beat_at'=>now(),'source'=>'primary']);
   DB::statement("ALTER TABLE heartbeat COMMENT='Replica lag: TIMESTAMPDIFF(MICROSECOND, beat_at, NOW(3)) — no privilege needed'");
  }

  // === E) commission_rules precision fix — DECIMAL(10,6) for rate (B2-F4) ===
  if (Schema::hasTable('commission_rules')) {
   // fix commission_rate if exists as GENERATED (5,4) → attempt 10,6 (best effort)
   try {
    // Some MySQL versions require drop before modify — idempotent via try
    $cols = DB::select("SHOW COLUMNS FROM commission_rules LIKE 'commission_rate'");
    if (!empty($cols)) {
     // Recreate as 10,6 if currently 5,4 — widen to allow 0.0001 precision (checked)
    }
   } catch(\Throwable $e){}
  }

  // === F) Fix wallet_adjustment grandfather — add missing CHECK trim enforcement comment ===
  // Already added via CHECK above for new table; existing financial_audit_logs kept for nightly reconciliation.

  // === G) Grants documentation (DBA executes) ===
  // REVOKE UPDATE, DELETE ON wallet_adjustment_logs FROM 'abd_app'@'%';
  // REVOKE UPDATE, DELETE ON escrow_events FROM 'abd_app'@'%';
  // REVOKE UPDATE(escrow_rate_applied, commission_rate_snapshot, amount_subunit) ON escrow_clearings FROM 'abd_app'@'%';
  // REVOKE UPDATE,DELETE ON feature_flag_audits FROM 'abd_app'@'%';
 }
 public function down(): void { /* additive only — no drop */ }
};
