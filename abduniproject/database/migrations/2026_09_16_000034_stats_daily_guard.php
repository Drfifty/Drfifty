<?php
// FIX-360-07: stats_*_daily materializer — R37 pre-aggregation 00:30 Cairo — replica heartbeat — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void {
        foreach (['stats_wallet_daily','stats_calibrator_daily','stats_deals_daily','stats_provider_daily','stats_agent_daily'] as $tbl) {
            if (!Schema::hasTable($tbl)) {
                Schema::create($tbl, function(Blueprint $t) use ($tbl){
                    $t->date('stat_date')->primary()->comment('Cairo Africa/Cairo');
                    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS')->index();
                    $t->json('metrics')->nullable()->comment('MySQL JSON not JSONB R7');
                    $t->unsignedInteger('count_total')->default(0);
                    $t->decimal('health_score',5,2)->nullable();
                    $t->timestamp('updated_at',3)->useCurrent()->useCurrentOnUpdate();
                    $t->index('stat_date');
                });
                // seed today row empty for immediate R37 hit
                try{ DB::table($tbl)->updateOrInsert(['stat_date'=>\Carbon\Carbon::today('Africa/Cairo')->toDateString()],['app_id'=>'AU BUSINESS','metrics'=>json_encode(['seed'=>true]),'updated_at'=>now()]); }catch(\Throwable){}
            }
        }
    }
    public function down(): void {
        // additive only — keep stats for WORM audit
    }
};
