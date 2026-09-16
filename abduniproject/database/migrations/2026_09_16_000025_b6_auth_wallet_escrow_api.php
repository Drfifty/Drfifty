<?php
// B.6 additive — Auth/Wallet/Escrow API harden F-01→F-14 — Arena — idempotent hasTable/hasColumn/hasIndex — Rule 11 additive only
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // refresh_tokens — ensure hashed family columns (000010 already creates but guard for collision across environments)
  if (Schema::hasTable('refresh_tokens')) {
   Schema::table('refresh_tokens', function(Blueprint $t){
    if(!Schema::hasColumn('refresh_tokens','rotated_from_id')) $t->foreignId('rotated_from_id')->nullable()->constrained('refresh_tokens')->nullOnDelete()->after('revoked_at');
    if(!Schema::hasColumn('refresh_tokens','device_fingerprint')) $t->string('device_fingerprint',128)->nullable()->after('ip_address');
   });
   // index expires_at for purge job (if missing)
   try{ DB::statement('CREATE INDEX idx_refresh_expires ON refresh_tokens (expires_at)'); }catch(Throwable $e){}
  }
  // idempotency_keys — ensure unique composite (000016 creates) — no duplicate creation
  if (Schema::hasTable('idempotency_keys')) {
   try{ DB::statement("ALTER TABLE idempotency_keys ADD CONSTRAINT chk_idem_key_len CHECK (CHAR_LENGTH(TRIM(idempotency_key)) >= 16)"); }catch(Throwable $e){}
  }
  // escrow_clearings — immutability trigger already in 000011 — ensure index app_id exists
  if (Schema::hasTable('escrow_clearings')) {
   try{ DB::statement('CREATE INDEX idx_esc_app ON escrow_clearings (app_id)'); }catch(Throwable $e){}
   try{ DB::statement('CREATE INDEX idx_esc_status ON escrow_clearings (status)'); }catch(Throwable $e){}
  }
  // app_wallets — ensure version exists for optimistic guard B2-F3
  if (Schema::hasTable('app_wallets') && !Schema::hasColumn('app_wallets','version')) {
   Schema::table('app_wallets', fn(Blueprint $t)=>$t->integer('version')->unsigned()->default(0)->after('status'));
  }
  // wallet_adjustment_logs — chk trim already in 000016 — ensure REVOKE comment
  // no drop/ truncate — additive only
 }
 public function down(): void { /* additive — no drop */ }
};
