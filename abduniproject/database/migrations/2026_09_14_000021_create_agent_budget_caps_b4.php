<?php
// B.4 — Agent Budget Caps — Arena — F-01 audit mirror (HOT path is Redis Lua) — Cairo date
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  if(!Schema::hasTable('agent_budget_caps')){
   Schema::create('agent_budget_caps', function(Blueprint $t){
    $t->tinyInteger('agent_id')->unsigned()->comment('1..13');
    $t->date('budget_date')->comment('Africa/Cairo date');
    $t->integer('daily_token_limit')->unsigned()->default(100000);
    $t->decimal('daily_cost_cap_usd',10,4)->default(5.0000);
    $t->decimal('current_daily_spend_usd',10,4)->default(0.0000)->comment('nightly flush from Redis');
    $t->integer('current_daily_tokens')->unsigned()->default(0);
    $t->timestamps();
    $t->primary(['agent_id','budget_date']);
    $t->index('budget_date','idx_budget_date');
   });
   DB::statement("ALTER TABLE agent_budget_caps ADD CONSTRAINT chk_agent_1_13 CHECK (agent_id BETWEEN 1 AND 13)");
   DB::statement("ALTER TABLE agent_budget_caps ADD CONSTRAINT chk_cost_ge0 CHECK (daily_cost_cap_usd >= 0)");
   DB::statement("ALTER TABLE agent_budget_caps COMMENT='Budget audit mirror — HOT checks via Redis Lua atomic'");
  }
  // Seed default caps for 13 agents today Cairo
  $today=\Carbon\Carbon::today('Africa/Cairo')->toDateString();
  for($a=1;$a<=13;$a++) DB::table('agent_budget_caps')->updateOrInsert(['agent_id'=>$a,'budget_date'=>$today],['daily_token_limit'=>100000,'daily_cost_cap_usd'=>5.0000,'created_at'=>now(),'updated_at'=>now()]);
 }
 public function down(): void { /* additive */ }
};
