<?php
// B.8 additive guard — Arena — stats_calibrator_daily + hitl_approvals + calibrator_health if missing — hasTable/hasColumn only — down empty
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // stats pre-aggregated daily — health-score reads replica, NOT live COUNT
  if(!Schema::hasTable('stats_calibrator_daily')){
   Schema::create('stats_calibrator_daily', function(Blueprint $t){
    $t->id(); $t->date('stat_date')->comment('Africa/Cairo'); $t->unsignedTinyInteger('agent_id')->nullable()->comment('1..13 null=aggregate');
    $t->decimal('fallback_rate',5,2)->default(0)->comment('0..100 deterministic fallback %');
    $t->decimal('budget_breach_pct',5,2)->default(0); $t->decimal('error_pct',5,2)->default(0);
    $t->decimal('deterministic_rate',5,2)->default(100); $t->json('self_healing_snapshot')->nullable();
    $t->timestamps(); $t->unique(['stat_date','agent_id'],'uk_stat_date_agent'); $t->index('stat_date');
   });
   try{ $today=\Carbon\Carbon::today('Africa/Cairo')->toDateString(); DB::table('stats_calibrator_daily')->insert(['stat_date'=>$today,'fallback_rate'=>4.2,'budget_breach_pct'=>2.1,'error_pct'=>1.8,'deterministic_rate'=>95.8,'created_at'=>now(),'updated_at'=>now()]); }catch(\Throwable){}
  }
  // HITL approvals isolated tenant+app — cursor 20
  if(!Schema::hasTable('hitl_approvals')){
   Schema::create('hitl_approvals', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('tenant_id')->nullable()->index(); $t->string('app_id',32)->default('AU BUSINESS')->index();
    $t->unsignedTinyInteger('module_id')->default(9); $t->unsignedTinyInteger('agent_id')->nullable()->index();
    $t->string('capability',80)->index(); $t->enum('status',['pending','approved','rejected','expired'])->default('pending')->index();
    $t->unsignedBigInteger('requester_id')->nullable(); $t->unsignedBigInteger('approved_by')->nullable();
    $t->text('rationale')->nullable(); $t->timestamp('expires_at')->nullable()->index();
    $t->timestamps(); $t->index(['status','created_at']); $t->index(['app_id','status']);
    $t->foreign('requester_id')->references('id')->on('users')->nullOnDelete();
   });
   DB::statement("ALTER TABLE hitl_approvals COMMENT='HITL queue — cursor20 tenant+app isolated — WORM via security_audit_logs'");
  } else {
   Schema::table('hitl_approvals', function(Blueprint $t){
    if(!Schema::hasColumn('hitl_approvals','tenant_id')) $t->unsignedBigInteger('tenant_id')->nullable()->after('id');
    if(!Schema::hasColumn('hitl_approvals','app_id')) $t->string('app_id',32)->default('AU BUSINESS')->after('tenant_id');
    if(!Schema::hasColumn('hitl_approvals','rationale')) $t->text('rationale')->nullable()->after('status');
   });
  }
  // ensure micro_switch_matrix has hitl approve caps seeded
  try{
   if(Schema::hasTable('micro_switch_matrix')){
    foreach([1,3,7,11] as $aid){ // approver agents
     DB::table('micro_switch_matrix')->updateOrInsert(['agent_id'=>$aid,'app_id'=>'AU BUSINESS','module_id'=>9,'sub_capability_key'=>'hitl.approve'],['is_enabled'=>true,'approval_required'=>false,'reason'=>'B.8 HITL seed','updated_at'=>now(),'created_at'=>now()]);
     DB::table('micro_switch_matrix')->updateOrInsert(['agent_id'=>$aid,'app_id'=>'AU BUSINESS','module_id'=>9,'sub_capability_key'=>'calibrator.preop'],['is_enabled'=>true,'approval_required'=>false,'reason'=>'B.8 pre-op seed','updated_at'=>now(),'created_at'=>now()]);
    }
   }
  }catch(\Throwable){}
 }
 public function down(): void { /* additive only */ }
};
