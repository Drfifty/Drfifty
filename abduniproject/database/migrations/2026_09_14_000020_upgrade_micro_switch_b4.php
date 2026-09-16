<?php
// B.4 — Tri-Hybrid Runtime Upgrade — Arena — F-02 additive — driver_override + threshold — NO new ai_agents_config drift
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  Schema::table('micro_switch_matrix', function(Blueprint $t){
   if(!Schema::hasColumn('micro_switch_matrix','driver_override')) $t->enum('driver_override',['auto','deterministic','cloud','local_gpu'])->default('auto')->after('deterministic_threshold')->comment('F-02: runtime driver without restart');
   if(!Schema::hasColumn('micro_switch_matrix','deterministic_threshold')) $t->tinyInteger('deterministic_threshold')->unsigned()->default(90)->after('llm_fallback_enabled')->comment('F-03: >=90 pass <90 fallback');
  });
  // Fix order if both added in swapped order — ensure both exist
  try{ DB::statement("ALTER TABLE micro_switch_matrix ADD CONSTRAINT chk_threshold_0_100 CHECK (deterministic_threshold BETWEEN 0 AND 100)"); }catch(\Throwable $e){}
  try{ DB::statement("CREATE INDEX idx_ms_driver ON micro_switch_matrix(driver_override)"); }catch(\Throwable $e){}
 }
 public function down(): void { /* additive only */ }
};
