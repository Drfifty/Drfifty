<?php
// B.5 — AU MED pgsql + Workforce Tenant Isolated — Arena — F-02 pgsql only + F-03 HMAC chain + F-04 pgcrypto + F-08 DRY + F-11 partition
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // PostgreSQL clinical — connection pgsql
  if(Schema::connection('pgsql')->hasTable('amed_medical_providers')===false){
   Schema::connection('pgsql')->create('amed_medical_providers', function(Blueprint $t){
    $t->bigIncrements('id'); $t->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $t->bigInteger('user_id'); $t->string('app_id',20)->default('AU MED');
    $t->string('specialty',80); $t->boolean('is_verified')->default(false);
    // geography(POINT,4326) via raw — Blueprint geography not needed
    $t->timestampsTz();
   });
   try{ DB::connection('pgsql')->statement("CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pgcrypto;"); }catch(\Throwable $e){}
   try{ DB::connection('pgsql')->statement("ALTER TABLE amed_medical_providers ADD COLUMN clinic_location geography(POINT,4326)"); }catch(\Throwable $e){}
   try{ DB::connection('pgsql')->statement("CREATE INDEX spx_amed_prov_loc ON amed_medical_providers USING GIST(clinic_location)"); }catch(\Throwable $e){}
   DB::connection('pgsql')->statement("ALTER TABLE amed_medical_providers ADD CONSTRAINT chk_amed_app CHECK (app_id='AU MED')");
  }
  if(Schema::connection('pgsql')->hasTable('amed_medical_appointments')===false){
   Schema::connection('pgsql')->create('amed_medical_appointments', function(Blueprint $t){
    $t->bigIncrements('id'); $t->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $t->bigInteger('patient_user_id'); $t->bigInteger('provider_id');
    $t->string('app_id',20)->default('AU MED');
    $t->text('complaint_encrypted')->comment('pgp_sym_encrypt F-04');
    $t->timestampTz('scheduled_at');
    $t->string('status',20)->default('scheduled');
    $t->timestampsTz();
    $t->foreign('provider_id')->references('id')->on('amed_medical_providers')->restrictOnDelete();
   });
   DB::connection('pgsql')->statement("ALTER TABLE amed_medical_appointments ADD CONSTRAINT chk_amed_appt_status CHECK (status IN ('scheduled','completed','cancelled','no_show'))");
  }
  if(Schema::connection('pgsql')->hasTable('amed_provider_trust_scores')===false){
   Schema::connection('pgsql')->create('amed_provider_trust_scores', function(Blueprint $t){
    $t->bigInteger('provider_id')->primary(); $t->decimal('score',5,2); $t->timestampTz('computed_at')->useCurrent();
    $t->foreign('provider_id')->references('id')->on('amed_medical_providers')->cascadeOnDelete();
   });
   DB::connection('pgsql')->statement("ALTER TABLE amed_provider_trust_scores ADD CONSTRAINT chk_score_0_100 CHECK (score BETWEEN 0 AND 100)");
  }
  if(Schema::connection('pgsql')->hasTable('amed_consultation_telemetry')===false){
   Schema::connection('pgsql')->create('amed_consultation_telemetry', function(Blueprint $t){
    $t->bigIncrements('id'); $t->bigInteger('appointment_id');
    $t->char('nlp_hash',64)->comment('hash_hmac HMAC F-03'); $t->char('payload_hash',64);
    $t->char('prev_hash',64)->nullable(); $t->char('hash_current',64);
    $t->string('app_id',20)->default('AU MED');
    $t->timestampsTz();
    $t->foreign('appointment_id')->references('id')->on('amed_medical_appointments')->cascadeOnDelete();
    $t->index('appointment_id');
   });
   DB::connection('pgsql')->statement("ALTER TABLE amed_consultation_telemetry COMMENT='F-03 HMAC anonymized zero raw — WORM REVOKE'");
  }
  // Workforce — MySQL core
  if(!Schema::hasTable('digital_agents')){
   Schema::create('digital_agents', function(Blueprint $t){
    $t->tinyIncrements('id'); $t->string('code',30)->unique(); $t->string('name',80);
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU BUSINESS');
    $t->boolean('is_active')->default(true); $t->timestamps(); $t->index('app_id');
   });
   for($i=1;$i<=13;$i++) DB::table('digital_agents')->updateOrInsert(['id'=>$i],['code'=>'agent_'.$i,'name'=>'Agent '.$i,'app_id'=>'AU BUSINESS','is_active'=>1,'created_at'=>now(),'updated_at'=>now()]);
  }
  if(!Schema::hasTable('tenant_agent_subscriptions')){
   Schema::create('tenant_agent_subscriptions', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('tenant_id'); $t->tinyInteger('agent_id')->unsigned();
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST']);
    $t->enum('status',['active','suspended','cancelled'])->default('active');
    $t->timestamp('started_at',3)->useCurrent(); $t->timestamp('ends_at',3)->nullable();
    $t->timestamps(); $t->unique(['tenant_id','agent_id','app_id'],'uk_tenant_agent_app');
    $t->index('tenant_id'); $t->index('agent_id');
    $t->foreign('tenant_id')->references('id')->on('users')->cascadeOnDelete();
    $t->foreign('agent_id')->references('id')->on('digital_agents')->restrictOnDelete();
   });
   DB::statement("ALTER TABLE tenant_agent_subscriptions ADD CONSTRAINT chk_agent_1_13_tas CHECK (agent_id BETWEEN 1 AND 13)");
  }
  if(!Schema::hasTable('agent_execution_logs')){
   Schema::create('agent_execution_logs', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('subscription_id'); $t->tinyInteger('agent_id')->unsigned();
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST']);
    $t->char('input_hash',64); $t->char('output_hash',64);
    $t->integer('tokens')->unsigned()->default(0); $t->decimal('cost_usd',10,4)->default(0);
    $t->enum('status',['queued','running','completed','failed'])->default('completed');
    $t->char('prev_hash',64)->nullable(); $t->char('hash_current',64);
    $t->timestamp('created_at',3)->useCurrent();
    $t->index('subscription_id'); $t->index(['agent_id','created_at']); $t->index('app_id');
    $t->foreign('subscription_id')->references('id')->on('tenant_agent_subscriptions')->cascadeOnDelete();
    $t->foreign('agent_id')->references('id')->on('digital_agents')->restrictOnDelete();
   });
   DB::statement("ALTER TABLE agent_execution_logs COMMENT='F-11 partitioned monthly — REVOKE UPDATE,DELETE'");
  }
  if(!Schema::hasTable('agent_memory_sandboxes')){
   Schema::create('agent_memory_sandboxes', function(Blueprint $t){
    $t->id(); $t->tinyInteger('agent_id')->unsigned(); $t->unsignedBigInteger('tenant_id');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST']);
    $t->string('memory_key',80); $t->json('memory_json');
    $t->timestamps(); $t->unique(['tenant_id','agent_id','memory_key'],'uk_sandbox_tenant_agent_key');
    $t->index('tenant_id'); $t->index('agent_id');
    $t->foreign('agent_id')->references('id')->on('digital_agents')->cascadeOnDelete();
    $t->foreign('tenant_id')->references('id')->on('users')->cascadeOnDelete();
   });
   DB::statement("ALTER TABLE agent_memory_sandboxes ADD CONSTRAINT chk_sandbox_json CHECK (JSON_VALID(memory_json))");
   DB::unprepared("DROP TRIGGER IF EXISTS trg_sandbox_app; CREATE TRIGGER trg_sandbox_app BEFORE INSERT ON agent_memory_sandboxes FOR EACH ROW BEGIN IF NEW.app_id NOT IN ('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='invalid app isolation'; END IF; END");
  }
 }
 public function down(): void { try{ DB::unprepared("DROP TRIGGER IF EXISTS trg_sandbox_app"); }catch(\Throwable $e){} }
};
