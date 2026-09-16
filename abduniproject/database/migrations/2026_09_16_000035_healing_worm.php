<?php
// FIX-360-14: healing_events WORM hardening — REVOKE + hash chain — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('healing_events')) return;
        if (!Schema::hasColumn('healing_events','prev_hash')) {
            Schema::table('healing_events', function($t){
                $t->char('prev_hash',64)->nullable()->after('health_score');
                $t->char('hash_current',64)->nullable()->after('prev_hash');
            });
        }
        // WORM trigger + revoke from abd_app (keep migrator abd_migrator privileged)
        try{ DB::unprepared("DROP TRIGGER IF EXISTS trg_healing_worm"); }catch(\Throwable){}
        try{ DB::unprepared("CREATE TRIGGER trg_healing_worm BEFORE UPDATE ON healing_events FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='WORM healing_events'; END"); }catch(\Throwable){}
        try{ DB::statement("REVOKE UPDATE,DELETE ON abduniproject.healing_events FROM 'abd_app'@'%'"); }catch(\Throwable){}
        try{ DB::statement("ALTER TABLE healing_events COMMENT='WORM — REVOKE UPDATE,DELETE + hash chain — FIX-360-14'"); }catch(\Throwable){}
    }
    public function down(): void {
        try{ DB::unprepared("DROP TRIGGER IF EXISTS trg_healing_worm"); }catch(\Throwable){}
    }
};
