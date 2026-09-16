<?php
// FIX-360-16: idempotency app partition — UNIQUE (idempotency_key,user_id,endpoint,app_id) — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('idempotency_keys')) return;
        if (!Schema::hasColumn('idempotency_keys','app_id')) {
            Schema::table('idempotency_keys', function($t){
                $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS')->after('user_id')->index();
            });
            try{ DB::table('idempotency_keys')->whereNull('app_id')->update(['app_id'=>'AU BUSINESS']); }catch(\Throwable){}
        }
        // replace old unique with app-scoped unique (if index exists drop old)
        try{ DB::statement("ALTER TABLE idempotency_keys DROP INDEX idempotency_keys_idempotency_key_unique"); }catch(\Throwable){}
        try{ DB::statement("ALTER TABLE idempotency_keys DROP INDEX idempotency_key"); }catch(\Throwable){}
        try{ DB::statement("ALTER TABLE idempotency_keys ADD UNIQUE INDEX uk_idem_user_endpoint_app (idempotency_key, user_id, endpoint, app_id)"); }catch(\Throwable){}
    }
    public function down(): void {
        try{ DB::statement("ALTER TABLE idempotency_keys DROP INDEX uk_idem_user_endpoint_app"); }catch(\Throwable){}
    }
};
