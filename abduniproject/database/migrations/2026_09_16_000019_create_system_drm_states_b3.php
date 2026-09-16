<?php
// B.3 — DRM Poison Pill — Arena — singleton 1 + 7d grace NOT auto-annihilate + Argon2id + heartbeat + events
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  if (!Schema::hasTable('system_drm_states')) {
   Schema::create('system_drm_states', function(Blueprint $t){
    $t->tinyInteger('id')->unsigned()->primary()->comment('singleton 1');
    $t->boolean('is_quarantine_active')->default(false);
    $t->dateTime('quarantine_triggered_at',3)->nullable();
    $t->dateTime('grace_period_expires_at',3)->nullable()->comment('triggered+7d');
    $t->string('master_passphrase_hash',255)->comment('Argon2id');
    $t->char('hardware_fingerprint_hash',64)->nullable()->comment('SHA256 stable');
    $t->text('hardware_fingerprint_encrypted')->nullable()->comment('AES-GCM');
    $t->text('license_payload_encrypted')->nullable()->comment('AES-GCM+RSA');
    $t->string('license_signature',512)->nullable()->comment('RSA sig');
    $t->dateTime('last_heartbeat_at',3)->nullable();
    $t->enum('last_heartbeat_status',['ok','fail','unknown'])->default('unknown');
    $t->integer('heartbeat_fail_count')->unsigned()->default(0);
    $t->integer('disarm_attempts')->unsigned()->default(0);
    $t->dateTime('disarm_last_attempt_at',3)->nullable();
    $t->timestamps();
   });
   DB::statement("ALTER TABLE system_drm_states ADD CONSTRAINT chk_drm_single CHECK (id=1)");
   DB::statement("ALTER TABLE system_drm_states ADD CONSTRAINT chk_drm_grace_gte CHECK (grace_period_expires_at IS NULL OR grace_period_expires_at >= quarantine_triggered_at)");
   $hash=password_hash('ChangeMe-Arena-DRM-7d-Master!2026', PASSWORD_ARGON2ID);
   DB::table('system_drm_states')->updateOrInsert(['id'=>1],['master_passphrase_hash'=>$hash,'created_at'=>now(),'updated_at'=>now()]);
  }
  if (!Schema::hasTable('system_drm_events')) {
   Schema::create('system_drm_events', function(Blueprint $t){
    $t->id();
    $t->boolean('from_state'); $t->boolean('to_state');
    $t->enum('actor_type',['system','super_admin','heartbeat'])->default('system');
    $t->unsignedBigInteger('actor_id')->nullable();
    $t->string('reason_code',50); $t->string('ip_address',45)->nullable();
    $t->char('payload_hash',64);
    $t->timestamp('created_at',3)->useCurrent();
    $t->index('created_at');
    $t->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
   });
   DB::statement("ALTER TABLE system_drm_events COMMENT='WORM — REVOKE UPDATE,DELETE'");
  }
  // REVOKE suggestion: REVOKE UPDATE,DELETE ON system_drm_events FROM 'abd_app'@'%';
  // REVOKE DROP,ALTER ON abduniproject.* FROM 'abd_app'@'%'; — migrator uses 'abd_migrator'
 }
 public function down(): void { /* singleton — no drop */ }
};
