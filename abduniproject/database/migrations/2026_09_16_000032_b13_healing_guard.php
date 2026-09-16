<?php
// B.13 F-14 — healing_events audit + checkpoint guard — additive only — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  if(!Schema::hasTable('healing_events')){
   Schema::create('healing_events', function(Blueprint $t){
    $t->id(); $t->tinyInteger('health_score')->unsigned()->comment('0-100');
    $t->json('actions')->comment('tags_flush+recycle+step_down');
    $t->timestamp('created_at')->useCurrent(); $t->index('health_score');
   });
   try{ \Illuminate\Support\Facades\DB::statement("ALTER TABLE healing_events COMMENT='WORM healing audit — REVOKE UPDATE,DELETE'"); }catch(\Throwable){}
  }
 }
 public function down(): void { /* additive */ }
};
