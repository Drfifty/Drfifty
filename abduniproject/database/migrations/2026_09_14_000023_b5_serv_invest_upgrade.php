<?php
// B.5 — AU SERV Spatial + AU INVEST State-Machine — Arena — F-06 SRID4326 SPATIAL + F-07 trigger + F-12 minor + F-11 partition
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  if(!Schema::hasTable('service_providers')){
   Schema::create('service_providers', function(Blueprint $t){
    $t->id(); $t->char('uuid',36)->unique(); $t->unsignedBigInteger('user_id');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU SERV');
    $t->string('specialty',80); $t->boolean('is_active')->default(true);
    $t->point('provider_location',4326)->comment('F-06 NOT NULL SRID 4326'); $t->polygon('coverage_zone',4326)->nullable();
    $t->timestamps(); $t->index('user_id'); $t->index('app_id');
    $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
   });
   try{ DB::statement("ALTER TABLE service_providers ADD SPATIAL INDEX spx_provider_location (provider_location)"); }catch(\Throwable $e){}
   try{ DB::statement("ALTER TABLE service_providers ADD SPATIAL INDEX spx_coverage (coverage_zone)"); }catch(\Throwable $e){}
  }
  if(!Schema::hasTable('service_tickets')){
   Schema::create('service_tickets', function(Blueprint $t){
    $t->id(); $t->char('uuid',36)->unique(); $t->unsignedBigInteger('requester_id'); $t->unsignedBigInteger('provider_id')->nullable();
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU SERV');
    $t->string('title',255); $t->enum('status',['requested','assigned','en_route','arrived','inspection','in_progress','completed','disputed'])->default('requested');
    $t->point('pickup_point',4326)->nullable(); $t->timestamp('created_at',3)->useCurrent(); $t->timestamp('updated_at',3)->nullable();
    $t->index('requester_id'); $t->index('provider_id'); $t->index('status'); $t->index('app_id');
    $t->foreign('requester_id')->references('id')->on('users')->restrictOnDelete();
    $t->foreign('provider_id')->references('id')->on('service_providers')->nullOnDelete();
   });
   try{ DB::statement("ALTER TABLE service_tickets ADD SPATIAL INDEX spx_ticket_pickup (pickup_point)"); }catch(\Throwable $e){}
  }
  if(!Schema::hasTable('dispatch_logs')){
   Schema::create('dispatch_logs', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('ticket_id'); $t->unsignedBigInteger('provider_id');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU SERV');
    $t->timestamp('dispatched_at',3)->useCurrent(); $t->integer('distance_m')->unsigned()->nullable();
    $t->timestamp('created_at',3)->useCurrent();
    $t->index('ticket_id'); $t->index('provider_id');
    $t->foreign('ticket_id')->references('id')->on('service_tickets')->cascadeOnDelete();
    $t->foreign('provider_id')->references('id')->on('service_providers')->cascadeOnDelete();
   });
   DB::statement("ALTER TABLE dispatch_logs COMMENT='F-11 partitioned monthly — PARTITION BY RANGE (YEAR(created_at)*100+MONTH(created_at))'");
  }
  if(!Schema::hasTable('investment_deals')){
   Schema::create('investment_deals', function(Blueprint $t){
    $t->id(); $t->char('uuid',36)->unique(); $t->unsignedBigInteger('tenant_id');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU INVEST');
    $t->string('title',255); $t->bigInteger('amount_minor'); $t->char('currency',3)->default('EGP');
    $t->enum('status',['draft','funding','funded','escrow_locked','released','refunded','expired'])->default('draft');
    $t->bigInteger('funding_target_minor'); $t->bigInteger('funded_minor')->default(0);
    $t->timestamp('created_at',3)->useCurrent(); $t->timestamp('updated_at',3)->nullable();
    $t->index('tenant_id'); $t->index('status'); $t->index('app_id');
    $t->foreign('tenant_id')->references('id')->on('users')->restrictOnDelete();
   });
   DB::statement("ALTER TABLE investment_deals ADD CONSTRAINT chk_inv_amount CHECK (amount_minor > 0)");
   DB::unprepared("DROP TRIGGER IF EXISTS trg_inv_status; CREATE TRIGGER trg_inv_status BEFORE UPDATE ON investment_deals FOR EACH ROW BEGIN IF OLD.status='draft' AND NEW.status NOT IN ('funding','expired') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='invalid transition draft'; ELSEIF OLD.status='funding' AND NEW.status NOT IN ('funded','expired','funding') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='invalid funding'; ELSEIF OLD.status='funded' AND NEW.status NOT IN ('escrow_locked','expired') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='invalid funded'; ELSEIF OLD.status='escrow_locked' AND NEW.status NOT IN ('released','refunded','disputed') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='invalid escrow_locked'; END IF; END");
  }
  if(!Schema::hasTable('funding_rounds')){
   Schema::create('funding_rounds', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('deal_id'); $t->tinyInteger('round_no')->unsigned();
    $t->enum('status',['open','closed','cancelled'])->default('open');
    $t->bigInteger('target_minor'); $t->bigInteger('raised_minor')->default(0);
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU INVEST');
    $t->timestamps(); $t->index('deal_id'); $t->foreign('deal_id')->references('id')->on('investment_deals')->cascadeOnDelete();
   });
  }
  if(!Schema::hasTable('escrow_contracts')){
   Schema::create('escrow_contracts', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('deal_id'); $t->unsignedBigInteger('escrow_clearing_id')->nullable();
    $t->enum('status',['holding','released','refunded','disputed'])->default('holding');
    $t->bigInteger('amount_minor'); $t->timestamp('created_at',3)->useCurrent();
    $t->index('deal_id'); $t->foreign('deal_id')->references('id')->on('investment_deals')->cascadeOnDelete();
    try{ $t->foreign('escrow_clearing_id')->references('id')->on('escrow_clearings')->nullOnDelete(); }catch(\Throwable $e){}
   });
  }
  if(!Schema::hasTable('investor_ledgers')){
   Schema::create('investor_ledgers', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('deal_id'); $t->unsignedBigInteger('investor_id');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU INVEST');
    $t->bigInteger('amount_minor'); $t->char('currency',3)->default('EGP');
    $t->char('prev_hash',64)->nullable(); $t->char('hash_current',64);
    $t->timestamp('created_at',3)->useCurrent();
    $t->index('deal_id'); $t->index('investor_id');
    $t->foreign('deal_id')->references('id')->on('investment_deals')->restrictOnDelete();
    $t->foreign('investor_id')->references('id')->on('users')->restrictOnDelete();
   });
   DB::statement("ALTER TABLE investor_ledgers ADD CONSTRAINT chk_il_amount CHECK (amount_minor != 0)");
   DB::statement("ALTER TABLE investor_ledgers COMMENT='WORM — REVOKE UPDATE,DELETE'");
  }
 }
 public function down(): void { try{ DB::unprepared("DROP TRIGGER IF EXISTS trg_inv_status"); }catch(\Throwable $e){} }
};
