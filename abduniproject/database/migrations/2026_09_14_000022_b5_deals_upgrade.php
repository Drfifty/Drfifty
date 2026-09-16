<?php
// B.5 — AU DEALS Additive Upgrade — Arena — F-01 hasTable — FULLTEXT ngram + SRID 4326 + stagnant F-09 R37
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // deal_categories — additive
  if(!Schema::hasTable('deal_categories')){
   Schema::create('deal_categories', function(Blueprint $t){
    $t->id(); $t->char('uuid',36)->unique(); $t->unsignedBigInteger('parent_id')->nullable();
    $t->string('slug',80)->unique(); $t->string('name',120); $t->string('name_ar',120);
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU DEALS');
    $t->json('schema_json')->nullable(); $t->boolean('is_hidden')->default(false);
    $t->timestamps(); $t->index('parent_id'); $t->index('app_id');
    $t->foreign('parent_id')->references('id')->on('deal_categories')->nullOnDelete();
   });
   DB::statement("ALTER TABLE deal_categories ADD CONSTRAINT chk_cat_json CHECK (schema_json IS NULL OR JSON_VALID(schema_json))");
  }
  if(!Schema::hasTable('deals_listings')){
   Schema::create('deals_listings', function(Blueprint $t){
    $t->id(); $t->char('uuid',36)->unique(); $t->unsignedBigInteger('tenant_id'); $t->unsignedBigInteger('category_id');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU DEALS');
    $t->string('title',255); $t->text('description'); $t->bigInteger('price_minor'); $t->char('currency',3)->default('EGP');
    $t->integer('stock')->unsigned()->default(0); $t->point('geo_point',4326)->nullable()->comment('F-06 SRID 4326');
    $t->boolean('is_hidden')->default(false); $t->boolean('is_stagnant')->default(false);
    $t->timestamp('created_at',3)->useCurrent(); $t->timestamp('updated_at',3)->nullable();
    $t->index('tenant_id'); $t->index('category_id'); $t->index('app_id');
    $t->foreign('tenant_id')->references('id')->on('users')->restrictOnDelete();
    $t->foreign('category_id')->references('id')->on('deal_categories')->restrictOnDelete();
   });
   DB::statement("ALTER TABLE deals_listings ADD CONSTRAINT chk_price_ge0 CHECK (price_minor >= 0)");
  }
  // FIX-360-06: idempotent index guard — hasIndex before ALTER prevents duplicate bloat on cold DB
  try {
   $hasFt = !empty(DB::select("SHOW INDEX FROM deals_listings WHERE Key_name='ft_deals_title_desc'"));
   if(!$hasFt) DB::statement("ALTER TABLE deals_listings ADD FULLTEXT INDEX ft_deals_title_desc (title, description) WITH PARSER ngram");
  } catch(\Throwable $e){}
  try {
   $hasSpx = !empty(DB::select("SHOW INDEX FROM deals_listings WHERE Key_name='spx_deals_geo'"));
   if(!$hasSpx) DB::statement("ALTER TABLE deals_listings ADD SPATIAL INDEX spx_deals_geo (geo_point)");
  } catch(\Throwable $e){}
  if(!Schema::hasTable('deal_items')){
   Schema::create('deal_items', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('listing_id'); $t->string('sku',60)->unique();
    $t->json('attributes')->nullable(); $t->bigInteger('price_minor'); $t->integer('stock')->unsigned()->default(0);
    $t->timestamps(); $t->index('listing_id');
    $t->foreign('listing_id')->references('id')->on('deals_listings')->cascadeOnDelete();
   });
   DB::statement("ALTER TABLE deal_items ADD CONSTRAINT chk_item_json CHECK (attributes IS NULL OR JSON_VALID(attributes))");
  }
  if(!Schema::hasTable('promotional_bundles')){
   Schema::create('promotional_bundles', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('tenant_id'); $t->string('name',120); $t->json('items_json');
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU DEALS');
    $t->dateTime('starts_at',3); $t->dateTime('ends_at',3); $t->timestamps();
    $t->index('tenant_id'); $t->foreign('tenant_id')->references('id')->on('users')->cascadeOnDelete();
   });
   DB::statement("ALTER TABLE promotional_bundles ADD CONSTRAINT chk_bundle_dates CHECK (ends_at > starts_at)");
  }
  if(!Schema::hasTable('stagnant_deals')){
   Schema::create('stagnant_deals', function(Blueprint $t){
    $t->id(); $t->unsignedBigInteger('listing_id'); $t->tinyInteger('agent_id')->unsigned()->comment('3 CMO');
    $t->timestamp('detected_at',3)->useCurrent(); $t->timestamp('last_interaction_at',3)->nullable();
    $t->boolean('is_promoted')->default(false); $t->timestamp('promoted_at',3)->nullable();
    $t->enum('app_id',['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'])->default('AU DEALS');
    $t->index('listing_id'); $t->index('detected_at');
    $t->foreign('listing_id')->references('id')->on('deals_listings')->cascadeOnDelete();
   });
   DB::statement("ALTER TABLE stagnant_deals ADD CONSTRAINT chk_agent_1_13 CHECK (agent_id BETWEEN 1 AND 13)");
   DB::statement("ALTER TABLE stagnant_deals COMMENT='F-09 via stats_deals_daily not live COUNT'");
  }
 }
 public function down(): void { /* additive */ }
};
