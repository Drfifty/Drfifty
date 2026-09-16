<?php
// هجرة مصادقة وصلاحيات — 2.1a — MySQL 8.4 InnoDB utf8mb4 — Pillar 4,5,9 — Arena — AUDIT FIX 2026-09-14 — CORE AU BUSINESS Master B2B anchor
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // users — global, Tier1 soft-hide, phone AES-256-GCM بالطبقة التطبيقية
  Schema::create('users', fn(Blueprint $t)=>collect([
   $t->id(), $t->char('uuid',36)->unique(), $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS')->index(),
   $t->string('name',120), $t->string('email',255)->unique(), $t->dateTime('email_verified_at')->nullable(),
   $t->text('phone_encrypted')->nullable(), $t->string('phone_iv',64)->nullable(), $t->string('phone_tag',64)->nullable(), $t->dateTime('phone_verified_at')->nullable(),
   $t->string('password',255), $t->string('avatar_url',500)->nullable(), $t->enum('locale',['ar','en'])->default('ar'), $t->enum('status',['active','suspended','frozen_soft','banned'])->default('active')->index(),
   $t->boolean('mfa_enabled')->default(false), $t->tinyInteger('failed_mfa_attempts')->unsigned()->default(0),
   $t->dateTime('last_login_at')->nullable(), $t->softDeletes(), $t->timestamps()
  ]));
  Schema::create('roles', fn(Blueprint $t)=>collect([
   $t->id(), $t->char('uuid',36)->unique(), $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->nullable()->index(),
   $t->string('slug',80), $t->string('name',120), $t->string('name_ar',120), $t->text('description')->nullable(),
   $t->tinyInteger('level')->unsigned()->default(10), $t->boolean('is_system')->default(false)->index(), $t->string('guard_name',50)->default('web'), $t->timestamps(), $t->unique(['slug','app_id'])
  ]));
  Schema::create('permissions', fn(Blueprint $t)=>collect([
   $t->id(), $t->string('slug',120)->unique(), $t->string('name',150), $t->string('name_ar',150),
   $t->tinyInteger('module_id')->unsigned()->nullable()->index(), $t->tinyInteger('agent_id')->unsigned()->nullable()->index(),
   $t->string('micro_switch_key',120)->nullable(), $t->enum('type',['view','execute','both'])->default('view'), $t->text('description')->nullable(), $t->timestamps()
  ]));
  DB::statement("ALTER TABLE permissions ADD CONSTRAINT chk_perm_module CHECK (module_id IS NULL OR module_id BETWEEN 1 AND 9)");
  DB::statement("ALTER TABLE permissions ADD CONSTRAINT chk_perm_agent CHECK (agent_id IS NULL OR agent_id BETWEEN 1 AND 13)");
  Schema::create('role_permissions', fn(Blueprint $t)=>collect([
   $t->foreignId('role_id')->constrained('roles')->cascadeOnDelete()->cascadeOnUpdate(),
   $t->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete()->cascadeOnUpdate(), $t->primary(['role_id','permission_id'])
  ]));
  Schema::create('user_roles', fn(Blueprint $t)=>collect([
   $t->id(), $t->foreignId('user_id')->constrained('users')->cascadeOnDelete(), $t->foreignId('role_id')->constrained('roles')->cascadeOnDelete(),
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS'),
   $t->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete(), $t->dateTime('assigned_at')->useCurrent(), $t->dateTime('expires_at')->nullable(), $t->timestamps(), $t->unique(['user_id','role_id','app_id'])
  ]));
  Schema::create('micro_switch_matrix', fn(Blueprint $t)=>collect([
   $t->id(), $t->tinyInteger('agent_id')->unsigned()->index(), $t->string('capability_key',80), $t->string('sub_capability',80)->nullable(),
   $t->string('label',150), $t->string('label_ar',150), $t->text('description')->nullable(),
   $t->boolean('is_enabled')->default(true), $t->boolean('requires_hitl')->default(false), $t->foreignId('hitl_role_id')->nullable()->constrained('roles')->nullOnDelete(),
   $t->boolean('default_enabled')->default(true), $t->enum('preferred_driver',['deterministic','cloud','local_gpu'])->default('deterministic')->comment('Tri-Hybrid 2.3d no-restart'), $t->boolean('llm_fallback_enabled')->default(true)->comment('0=deterministic-only'),
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->nullable()->index(),
   $t->tinyInteger('module_id')->unsigned()->nullable(), $t->timestamps(), $t->unique(['agent_id','capability_key','sub_capability','app_id'],'uq_micro')
  ]));
  DB::statement("ALTER TABLE micro_switch_matrix ADD CONSTRAINT chk_micro_agent CHECK (agent_id BETWEEN 1 AND 13)");
  DB::statement("ALTER TABLE micro_switch_matrix ADD CONSTRAINT chk_micro_module CHECK (module_id IS NULL OR module_id BETWEEN 1 AND 9)");
  try{ DB::statement("ALTER TABLE micro_switch_matrix ADD CONSTRAINT chk_flag_json_valid CHECK (JSON_VALID(allowed_user_ids) OR allowed_user_ids IS NULL)"); }catch(\Throwable $e){}
  // feature_flags — إن وجدت سابقاً نرقّيها إضافياً (Rule11 لا هدم)
  if (Schema::hasTable('feature_flags')) { Schema::table('feature_flags', function(Blueprint $t){
   if(!Schema::hasColumn('feature_flags','flag_key')) $t->string('flag_key',50)->unique()->after('id');
   if(!Schema::hasColumn('feature_flags','flag_name_ar')) $t->string('flag_name_ar',120)->after('flag_name');
   if(!Schema::hasColumn('feature_flags','is_core')) $t->boolean('is_core')->default(false)->after('is_enabled');
   if(!Schema::hasColumn('feature_flags','rollout_percentage')) $t->tinyInteger('rollout_percentage')->unsigned()->default(100)->after('is_core');
   if(!Schema::hasColumn('feature_flags','allowed_user_ids')) $t->json('allowed_user_ids')->nullable()->after('rollout_percentage');
   if(!Schema::hasColumn('feature_flags','maintenance_message_ar')) $t->text('maintenance_message_ar')->nullable()->after('maintenance_message');
   if(!Schema::hasColumn('feature_flags','enabled_for_roles')) $t->json('enabled_for_roles')->nullable()->after('maintenance_message_ar');
   if(!Schema::hasColumn('feature_flags','last_toggled_by')) $t->foreignId('last_toggled_by')->nullable()->constrained('users')->nullOnDelete()->after('enabled_for_roles');
   if(!Schema::hasColumn('feature_flags','last_toggled_at')) $t->dateTime('last_toggled_at')->nullable()->after('last_toggled_by');
  }); } else {
   Schema::create('feature_flags', fn(Blueprint $t)=>collect([
    $t->id(), $t->string('flag_key',50)->unique(), $t->string('flag_name',120), $t->string('flag_name_ar',120), $t->text('description')->nullable(),
    $t->boolean('is_enabled')->default(true)->index(), $t->boolean('is_core')->default(false), $t->tinyInteger('rollout_percentage')->unsigned()->default(100),
    $t->json('allowed_user_ids')->nullable(), $t->text('maintenance_message')->nullable(), $t->text('maintenance_message_ar')->nullable(), $t->json('enabled_for_roles')->nullable(),
    $t->foreignId('last_toggled_by')->nullable()->constrained('users')->nullOnDelete(), $t->dateTime('last_toggled_at')->nullable(), $t->timestamps()
   ]));
  }
  Schema::create('data_leak_patterns', fn(Blueprint $t)=>collect([
   $t->id(), $t->string('pattern_name',100), $t->string('pattern_name_ar',100), $t->string('regex',500),
   $t->enum('category',['phone','mobile','email','whatsapp','telegram','url','social','custom']), $t->enum('severity',['low','medium','high','critical'])->default('high'),
   $t->boolean('is_active')->default(true)->index(), $t->boolean('is_strict_post_escrow_only')->default(true), $t->string('replacement_text',100)->default('[محمي]'),
   $t->text('description')->nullable(), $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(), $t->timestamps(), $t->index(['category','is_active'])
  ]));
  Schema::create('refresh_tokens', fn(Blueprint $t)=>collect([
   $t->id(), $t->char('uuid',36)->unique(), $t->foreignId('user_id')->constrained('users')->cascadeOnDelete(), $t->char('token_hash',64)->unique(),
   $t->string('device_fingerprint',128)->nullable(), $t->string('ip_address',45)->nullable(), $t->string('user_agent',500)->nullable(),
   $t->dateTime('expires_at')->index(), $t->dateTime('revoked_at')->nullable(), $t->foreignId('rotated_from_id')->nullable()->constrained('refresh_tokens')->nullOnDelete(),
   $t->dateTime('last_used_at')->nullable(), $t->timestamps()
  ]));
 }
 public function down(): void {
  Schema::dropIfExists('refresh_tokens'); Schema::dropIfExists('data_leak_patterns');
  if(!Schema::hasTable('feature_flags')) Schema::dropIfExists('feature_flags');
  Schema::dropIfExists('micro_switch_matrix'); Schema::dropIfExists('user_roles'); Schema::dropIfExists('role_permissions');
  Schema::dropIfExists('permissions'); Schema::dropIfExists('roles'); Schema::dropIfExists('users');
 }
};
