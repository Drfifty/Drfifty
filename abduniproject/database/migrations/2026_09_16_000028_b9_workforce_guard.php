<?php
// B.9 additive guard — Arena — workforce tenant isolated + idempotency + pricing JSON — hasTable/hasColumn only down empty
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // digital_agents — pricing_manifest JSON add if missing (server-derived minor, not client float)
  if(Schema::hasTable('digital_agents')){
   Schema::table('digital_agents', function(Blueprint $t){
    if(!Schema::hasColumn('digital_agents','pricing_manifest')) $t->json('pricing_manifest')->nullable()->after('is_active');
    if(!Schema::hasColumn('digital_agents','capability_manifest')) $t->json('capability_manifest')->nullable()->after('pricing_manifest');
    if(!Schema::hasColumn('digital_agents','prompt_template')) $t->text('prompt_template')->nullable()->after('capability_manifest');
   });
   // seed pricing if null
   try{
    $rows=DB::table('digital_agents')->whereNull('pricing_manifest')->get();
    foreach($rows as $r){
     DB::table('digital_agents')->where('id',$r->id)->update(['pricing_manifest'=>json_encode(['buyout_minor'=>500000,'subscription_minor'=>99000,'currency'=>'EGP']), 'capability_manifest'=>json_encode(['capabilities'=>['workforce.dispatch','workforce.logs.view']]), 'prompt_template'=>'You are Agent '.$r->id.' persona.']);
    }
   }catch(\Throwable){}
  }
  // tenant_agent_subscriptions already in B.5 — ensure app_id index exists
  if(Schema::hasTable('tenant_agent_subscriptions')){
   try{ DB::statement("ALTER TABLE tenant_agent_subscriptions ADD INDEX idx_tas_app (app_id)"); }catch(\Throwable){}
  }
  // agent_execution_logs — ensure stats_agent_daily pre-agg table exists for R37 isolation
  if(!Schema::hasTable('stats_agent_daily')){
   Schema::create('stats_agent_daily', function(Blueprint $t){
    $t->id(); $t->date('stat_date')->comment('Africa/Cairo'); $t->tinyInteger('agent_id')->unsigned();
    $t->integer('total_runs')->default(0); $t->integer('total_tokens')->default(0); $t->decimal('total_cost',10,4)->default(0);
    $t->timestamps(); $t->unique(['stat_date','agent_id']); $t->index('stat_date');
   });
   DB::statement("ALTER TABLE stats_agent_daily COMMENT='R37 pre-aggregated 00:30 Cairo'");
  }
  // idempotency_keys already via B.2a but ensure app_id column for workforce scoping
  if(Schema::hasTable('idempotency_keys') && !Schema::hasColumn('idempotency_keys','app_id')){
   Schema::table('idempotency_keys', function(Blueprint $t){ $t->string('app_id',32)->default('AU BUSINESS')->after('user_id'); });
  }
  // seed micro workforce caps for 13 agents if missing (driver auto)
  try{
   if(Schema::hasTable('micro_switch_matrix')){
    foreach(range(1,13) as $aid){
     foreach(['workforce.catalog.view','workforce.checkout','workforce.tenant.view','workforce.dispatch','workforce.logs.view'] as $cap){
      DB::table('micro_switch_matrix')->updateOrInsert(['agent_id'=>$aid,'app_id'=>'AU BUSINESS','module_id'=>8,'sub_capability_key'=>$cap],['is_enabled'=>true,'approval_required'=>in_array($cap,['workforce.dispatch'],true)?false:false,'reason'=>'B.9 seed','updated_at'=>now(),'created_at'=>now()]);
     }
    }
   }
  }catch(\Throwable){}
 }
 public function down(): void { /* additive only */ }
};
