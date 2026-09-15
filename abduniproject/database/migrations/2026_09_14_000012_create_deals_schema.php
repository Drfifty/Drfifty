<?php
// هجرة AU DEALS — 2.1c — MySQL 8.4 — AUDIT FIX 2026-09-14 — CORE AU BUSINESS vault + AU DEALS spoke (adl_) — 9 Modules sequential — FULLTEXT ngram + Spatial — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  if(!Schema::hasTable('deal_categories')) Schema::create('deal_categories', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique(); $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS');
   $t->foreignId('parent_id')->nullable()->constrained('deal_categories')->nullOnDelete(); $t->string('slug',120); $t->string('name',150); $t->string('name_ar',150);
   $t->tinyInteger('level')->unsigned()->default(1); $t->integer('sort_order')->default(0); $t->string('icon',120)->nullable();
   $t->json('attributes_schema')->nullable(); $t->boolean('is_active')->default(true); $t->boolean('is_hidden')->default(false); $t->timestamps();
   $t->unique(['slug','app_id']);
  });
  if(!Schema::hasTable('promotional_bundles')) Schema::create('promotional_bundles', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS');
   $t->string('name',150); $t->string('name_ar',150); $t->string('slug',150); $t->enum('discount_type',['fixed_subunit','percentage'])->default('percentage'); $t->decimal('discount_value',10,2)->default(0);
   $t->dateTime('valid_from')->nullable(); $t->dateTime('valid_to')->nullable(); $t->enum('status',['draft','active','expired','hidden'])->default('draft')->index();
   $t->json('bundle_items')->nullable(); $t->json('meta')->nullable(); $t->timestamps(); $t->unique(['slug','seller_id']);
  });
  if(!Schema::hasTable('deals_listings')) {
   Schema::create('deals_listings', function(Blueprint $t){
    $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('seller_id')->constrained('users')->cascadeOnDelete(); $t->foreignId('category_id')->constrained('deal_categories')->restrictOnDelete(); $t->foreignId('bundle_id')->nullable()->constrained('promotional_bundles')->nullOnDelete();
    $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS');
    $t->string('title',255); $t->string('title_ar',255); $t->text('description'); $t->text('description_ar');
    $t->enum('status',['draft','active','sold','expired','frozen','hidden'])->default('draft')->index(); $t->enum('type',['single','bulk','bundle','barter'])->default('single');
    $t->string('currency',8)->default('EGP'); $t->bigInteger('price_subunit')->unsigned(); $t->bigInteger('original_price_subunit')->unsigned()->nullable(); $t->decimal('discount_percentage',5,2)->default(0);
    $t->integer('stock_quantity')->unsigned()->default(1); $t->integer('min_order_quantity')->unsigned()->default(1); $t->string('unit',40)->default('piece');
    $t->string('governorate',80)->nullable(); $t->string('city',80)->nullable(); $t->decimal('lat',10,7)->nullable(); $t->decimal('lng',10,7)->nullable();
    $t->json('attributes')->nullable(); $t->json('meta')->nullable();
    $t->integer('views_count')->unsigned()->default(0); $t->integer('clicks_count')->unsigned()->default(0); $t->integer('interactions_count')->unsigned()->default(0);
    $t->boolean('is_stagnant')->default(false)->index(); $t->boolean('is_hidden')->default(false); $t->boolean('is_featured')->default(false);
    $t->date('expiry_date')->nullable()->index(); $t->timestamps(); $t->softDeletes();
   });
   // FULLTEXT ngram + Spatial (MySQL 8.4 native)
   DB::statement('ALTER TABLE deals_listings ADD FULLTEXT ft_listing_title_desc (title, description) WITH PARSER ngram');
   DB::statement("ALTER TABLE deals_listings ADD FULLTEXT ft_listing_title_desc_ar (title_ar, description_ar) WITH PARSER ngram");
   DB::statement('ALTER TABLE deals_listings ADD COLUMN location_point POINT SRID 4326 GENERATED ALWAYS AS (ST_SRID(POINT(lng, lat),4326)) STORED, ADD SPATIAL INDEX idx_listing_point (location_point)');
   DB::statement('ALTER TABLE deals_listings ADD CONSTRAINT chk_listing_price CHECK (price_subunit>0)');
  }
  if(!Schema::hasTable('deal_items')) Schema::create('deal_items', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('listing_id')->constrained('deals_listings')->cascadeOnDelete();
   $t->string('sku',80); $t->string('name',150); $t->string('name_ar',150); $t->integer('quantity')->unsigned()->default(1); $t->bigInteger('price_subunit')->unsigned();
   $t->string('batch_number',80)->nullable(); $t->date('expiry_date')->nullable()->index(); $t->json('attributes')->nullable(); $t->boolean('is_active')->default(true); $t->timestamps();
   $t->unique(['sku','listing_id']);
  });
  if(!Schema::hasTable('stagnant_deals')) Schema::create('stagnant_deals', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('listing_id')->constrained('deals_listings')->cascadeOnDelete(); $t->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS');
   $t->dateTime('stagnant_since'); $t->dateTime('last_interaction_at')->nullable(); $t->integer('interaction_count')->unsigned()->default(0);
   $t->integer('views_at_detection')->unsigned()->default(0); $t->integer('clicks_at_detection')->unsigned()->default(0);
   $t->boolean('is_notified')->default(false); $t->dateTime('notified_at')->nullable(); $t->enum('status',['pending','nudged','resolved','archived'])->default('pending')->index(); $t->timestamps();
   $t->unique(['listing_id']);
  });
 }
 public function down(): void {
  Schema::dropIfExists('stagnant_deals'); Schema::dropIfExists('deal_items'); Schema::dropIfExists('deals_listings'); Schema::dropIfExists('promotional_bundles'); Schema::dropIfExists('deal_categories');
 }
};
