<?php
// FIX-360-04: Tenant ledger guard — add app_id + tenant_id to agent_actions — R12 isolation — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('agent_actions')) {
            if (!Schema::hasColumn('agent_actions','app_id')) {
                Schema::table('agent_actions', function(Blueprint $t){
                    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS')->after('agent_id')->index();
                });
            }
            if (!Schema::hasColumn('agent_actions','tenant_id')) {
                Schema::table('agent_actions', function(Blueprint $t){
                    $t->unsignedBigInteger('tenant_id')->nullable()->after('app_id')->index();
                    $t->foreign('tenant_id')->references('id')->on('users')->nullOnDelete();
                });
            }
            try{ DB::statement("ALTER TABLE agent_actions ADD INDEX idx_agent_app_created (agent_id, app_id, created_at)"); }catch(\Throwable){}
        }
        // guard agent_budget_caps Cairo comment
        if (Schema::hasTable('agent_budget_caps')) {
            try{ DB::statement("ALTER TABLE agent_budget_caps COMMENT='FIX-360-04 budget_date DATE Cairo Africa/Cairo'"); }catch(\Throwable){}
        }
    }
    public function down(): void {
        // additive only — keep app_id/tenant_id for WORM
    }
};
