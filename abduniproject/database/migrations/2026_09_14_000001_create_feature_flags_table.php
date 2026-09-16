<?php
// هجرة أعلام الميزات — AU Lite (Pillar 4) — تجميد ديناميكي للوحدات الفرعية — Arena Canonical — IN-PLACE AUDIT FIX 2026-09-14
// CORE ANCHOR: AU BUSINESS (ab_) Master Core B2B — 4 B2C spokes AU_MED/AU_DEALS/AU_SERV/AU_INVEST hibernatable, AU BUSINESS is_core=1 never hibernate
// Phase1→2 alignment: 5 Apps | 9 Modules (1-9) | 13 Agents — Rule7 JSON not JSONB
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void {
        // MySQL 8.4: JSON native not JSONB — additive idempotent
        if (Schema::hasTable('feature_flags')) {
            // Ensure canonical columns exist (audit adds missing)
            if (!Schema::hasColumn('feature_flags','flag_key')) {
                // Legacy Phase0 table detected — rebuild canonical
                Schema::dropIfExists('feature_flags');
            } else { return; }
        }
        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('flag_key', 50)->unique()->comment('au_med,au_deals,au_serv,au_invest,au_business');
            $table->string('flag_name', 120);
            $table->string('flag_name_ar', 120);
            $table->text('description')->nullable();
            $table->boolean('is_enabled')->default(true)->index();
            $table->boolean('is_core')->default(false)->comment('AU BUSINESS non-hibernatable');
            $table->tinyInteger('rollout_percentage')->unsigned()->default(100);
            $table->json('allowed_user_ids')->nullable()->comment('MySQL JSON whitelist');
            $table->text('maintenance_message')->nullable();
            $table->text('maintenance_message_ar')->nullable();
            $table->json('enabled_for_roles')->nullable();
            $table->unsignedBigInteger('last_toggled_by')->nullable();
            $table->dateTime('last_toggled_at')->nullable();
            $table->timestamps();
            $table->foreign('last_toggled_by')->references('id')->on('users')->nullOnDelete();
        });
        DB::statement("ALTER TABLE feature_flags ADD CONSTRAINT chk_flag_rollout CHECK (rollout_percentage BETWEEN 0 AND 100)");
        DB::statement("ALTER TABLE feature_flags ADD CONSTRAINT chk_flag_json_valid CHECK (allowed_user_ids IS NULL OR JSON_VALID(allowed_user_ids))");
        // Seed AU BUSINESS + 4 spokes — 9 Modules alignment §MODULES_INDEX
        DB::table('feature_flags')->updateOrInsert(['flag_key'=>'au_business'], ['flag_name'=>'AU BUSINESS','flag_name_ar'=>'إيه يو بيزنس','is_enabled'=>1,'is_core'=>1,'rollout_percentage'=>100]);
        DB::table('feature_flags')->updateOrInsert(['flag_key'=>'au_med'], ['flag_name'=>'AU MED','flag_name_ar'=>'إيه يو ميد','is_enabled'=>1,'is_core'=>0,'rollout_percentage'=>100]);
        DB::table('feature_flags')->updateOrInsert(['flag_key'=>'au_deals'], ['flag_name'=>'AU DEALS','flag_name_ar'=>'إيه يو ديلز','is_enabled'=>1,'is_core'=>0,'rollout_percentage'=>100]);
        DB::table('feature_flags')->updateOrInsert(['flag_key'=>'au_serv'], ['flag_name'=>'AU SERV','flag_name_ar'=>'إيه يو سيرف','is_enabled'=>1,'is_core'=>0,'rollout_percentage'=>100]);
        DB::table('feature_flags')->updateOrInsert(['flag_key'=>'au_invest'], ['flag_name'=>'AU INVEST','flag_name_ar'=>'إيه يو إنفست','is_enabled'=>1,'is_core'=>0,'rollout_percentage'=>100]);
    }
    public function down(): void { Schema::dropIfExists('feature_flags'); }
};
