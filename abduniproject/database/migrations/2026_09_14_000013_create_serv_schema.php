<?php
// هجرة AU SERV الجغرافية — 2.1d — MySQL 8.4 Spatial — AUDIT FIX 2026-09-14 — CORE AU BUSINESS dispatch under Master B2B POINT/POLYGON — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  if(!Schema::hasTable('service_providers')) Schema::create('service_providers', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_SERV');
   $t->string('name',150); $t->string('name_ar',150); $t->text('phone_encrypted')->nullable();
   $t->string('category',80); $t->json('skills')->nullable(); $t->enum('status',['offline','available','busy','suspended'])->default('offline')->index();
   $t->decimal('rating',3,2)->default(0); $t->integer('completed_tickets')->unsigned()->default(0);
   $t->point('current_location',4326)->nullable(); $t->polygon('coverage_zone',4326)->nullable();
   $t->dateTime('last_location_at')->nullable(); $t->boolean('is_verified')->default(false); $t->boolean('is_hidden')->default(false); $t->json('meta')->nullable(); $t->timestamps();
  });
  // Spatial indexes — MySQL 8.4 InnoDB requires SPATIAL INDEX via raw (Blueprint can't)
  try{ DB::statement('ALTER TABLE service_providers ADD SPATIAL INDEX spx_provider_location (current_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE service_providers ADD SPATIAL INDEX spx_provider_zone (coverage_zone)'); }catch(Throwable $e){}
  if(!Schema::hasTable('service_tickets')) Schema::create('service_tickets', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('requester_id')->constrained('users')->cascadeOnDelete(); $t->foreignId('provider_id')->nullable()->constrained('service_providers')->nullOnDelete();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_SERV'); $t->tinyInteger('module_id')->unsigned()->default(5);
   $t->string('category',80); $t->string('title',255); $t->string('title_ar',255); $t->text('description');
   $t->enum('status',['open','assigned','dispatched','in_progress','completed','cancelled','disputed','expired_grace'])->default('open')->index();
   $t->enum('priority',['low','normal','high','urgent'])->default('normal'); $t->bigInteger('price_subunit')->unsigned()->nullable(); $t->string('currency',8)->default('EGP');
   $t->point('ticket_location',4326); $t->string('address_text',500)->nullable(); $t->string('governorate',80)->nullable(); $t->string('city',80)->nullable();
   $t->dateTime('scheduled_at')->nullable()->index(); $t->dateTime('dispatched_at')->nullable(); $t->dateTime('started_at')->nullable(); $t->dateTime('completed_at')->nullable(); $t->dateTime('dispute_deadline_at')->nullable(); $t->dateTime('grace_expires_at')->nullable();
   $t->boolean('is_hidden')->default(false); $t->json('meta')->nullable(); $t->timestamps(); $t->softDeletes();
  });
  try{ DB::statement('ALTER TABLE service_tickets ADD SPATIAL INDEX spx_ticket_location (ticket_location)'); }catch(Throwable $e){}
  if(!Schema::hasTable('dispatch_logs')) Schema::create('dispatch_logs', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('ticket_id')->constrained('service_tickets')->cascadeOnDelete(); $t->foreignId('provider_id')->constrained('service_providers')->cascadeOnDelete();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_SERV');
   $t->enum('status',['proposed','accepted','rejected','timeout','cancelled'])->default('proposed')->index();
   $t->integer('distance_meters')->unsigned()->nullable(); $t->smallInteger('eta_minutes')->unsigned()->nullable(); $t->tinyInteger('rank')->unsigned()->default(1);
   $t->point('provider_location_at_dispatch',4326)->nullable(); $t->dateTime('dispatched_at')->useCurrent(); $t->dateTime('responded_at')->nullable(); $t->json('meta')->nullable(); $t->timestamps();
  });
  try{ DB::statement('ALTER TABLE dispatch_logs ADD SPATIAL INDEX spx_dispatch_provider_loc (provider_location_at_dispatch)'); }catch(Throwable $e){}
 }
 public function down(): void {
  Schema::dropIfExists('dispatch_logs'); Schema::dropIfExists('service_tickets'); Schema::dropIfExists('service_providers');
 }
};
