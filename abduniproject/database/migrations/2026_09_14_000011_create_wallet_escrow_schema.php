<?php
// هجرة المحفظة والضمان — 2.1b — MySQL 8.4 — Pillar6 Race-Guard + Escrow Immutability + 3-Tier — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // app_wallets — ترقية غير هدامة (Rule11) من decimal → subunit BIGINT
  if (Schema::hasTable('app_wallets')) {
   Schema::table('app_wallets', function(Blueprint $t){
    if(!Schema::hasColumn('app_wallets','uuid')) $t->char('uuid',36)->unique()->after('id');
    if(!Schema::hasColumn('app_wallets','balance_subunit')) $t->bigInteger('balance_subunit')->default(0)->after('currency');
    if(!Schema::hasColumn('app_wallets','locked_subunit')) $t->bigInteger('locked_subunit')->default(0)->after('balance_subunit');
    if(!Schema::hasColumn('app_wallets','version')) $t->integer('version')->unsigned()->default(0)->after('status');
   });
   // CHECKs (إن لم توجد)
   try{ DB::statement('ALTER TABLE app_wallets ADD CONSTRAINT chk_w_bal_ge0 CHECK (balance_subunit>=0)'); }catch(Throwable $e){}
   try{ DB::statement('ALTER TABLE app_wallets ADD CONSTRAINT chk_w_avail_ge0 CHECK (balance_subunit>=locked_subunit)'); }catch(Throwable $e){}
  } else {
   Schema::create('app_wallets', fn(Blueprint $t)=>collect([
    $t->id(),$t->char('uuid',36)->unique(),$t->foreignId('user_id')->constrained()->cascadeOnDelete(),
    $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS'),
    $t->string('currency',8),$t->bigInteger('balance_subunit')->default(0),$t->bigInteger('locked_subunit')->default(0),$t->string('status',16)->default('active'),$t->integer('version')->unsigned()->default(0),$t->timestamps(),$t->unique(['user_id','app_id','currency'])
   ]));
  }
  if(!Schema::hasTable('exchange_rates')) Schema::create('exchange_rates', fn(Blueprint $t)=>collect([
   $t->id(),$t->string('base_currency',8),$t->string('quote_currency',8),$t->decimal('rate',20,8),$t->string('provider',64)->default('exchangerate_api'),$t->timestamp('fetched_at')->useCurrent(),$t->timestamps(),$t->unique(['base_currency','quote_currency'])
  ]));
  if(!Schema::hasTable('commission_rules')) Schema::create('commission_rules', fn(Blueprint $t)=>collect([
   $t->id(),$t->char('uuid',36)->unique(),$t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS'),$t->tinyInteger('module_id')->unsigned(),$t->enum('tier',['tier1','tier2','tier3']),$t->string('tier_label',80),$t->bigInteger('min_amount_subunit')->unsigned()->default(0),$t->bigInteger('max_amount_subunit')->unsigned()->nullable(),$t->decimal('rate',6,4)->default(0.0500),$t->boolean('is_active')->default(true),$t->dateTime('effective_from')->useCurrent(),$t->dateTime('effective_to')->nullable(),$t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(),$t->timestamps(),$t->unique(['app_id','module_id','tier','effective_from'])
  ]));
  if(!Schema::hasTable('escrow_clearings')) Schema::create('escrow_clearings', fn(Blueprint $t)=>collect([
   $t->id(),$t->char('uuid',36)->unique(),$t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS'),$t->tinyInteger('module_id')->unsigned(),
   $t->foreignId('buyer_id')->constrained('users')->restrictOnDelete(),$t->foreignId('seller_id')->constrained('users')->restrictOnDelete(),$t->bigInteger('deal_id')->unsigned()->nullable(),
   $t->bigInteger('amount_subunit')->unsigned(),$t->string('currency',8),$t->json('fx_snapshot')->nullable(),$t->dateTime('fx_locked_at')->nullable(),
   $t->foreignId('commission_rule_id')->nullable()->constrained('commission_rules')->nullOnDelete(),$t->decimal('commission_rate_snapshot',6,4)->default(0.0500),$t->bigInteger('commission_amount_subunit')->unsigned()->default(0),
   $t->decimal('vat_rate_snapshot',6,4)->default(0.0000),$t->bigInteger('vat_amount_subunit')->unsigned()->default(0),$t->json('barter_split')->nullable(),
   $t->string('paymob_transaction_id',80)->nullable()->index(),$t->string('sub_merchant_id',80)->nullable(),
   $t->enum('status',['holding','disputed','released','refunded','partial_milestone','chargeback_frozen','expired_grace','waiting_list'])->default('holding')->index(),
   $t->dateTime('hold_started_at')->useCurrent(),$t->dateTime('dispute_deadline_at'),$t->dateTime('grace_expires_at'),$t->tinyInteger('milestone_number')->unsigned()->nullable(),$t->tinyInteger('total_milestones')->unsigned()->nullable(),$t->dateTime('released_at')->nullable(),$t->dateTime('refunded_at')->nullable(),$t->char('hash_chain',64),$t->timestamps()
  ]));
  if(!Schema::hasTable('deal_exchange_snapshots')) Schema::create('deal_exchange_snapshots', fn(Blueprint $t)=>collect([
   $t->id(),$t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete(),$t->bigInteger('deal_id')->unsigned()->nullable(),$t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS'),$t->string('base_currency',8),$t->string('quote_currency',8),$t->decimal('locked_rate',20,8),$t->dateTime('locked_at'),$t->timestamps()
  ]));
  if(!Schema::hasTable('wallet_transactions')) Schema::create('wallet_transactions', fn(Blueprint $t)=>collect([
   $t->id(),$t->char('uuid',36)->unique(),$t->foreignId('wallet_id')->constrained('app_wallets')->cascadeOnDelete(),$t->foreignId('user_id')->constrained('users')->cascadeOnDelete(),
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS'),
   $t->enum('type',['deposit','withdraw','escrow_hold','escrow_release','escrow_refund','commission','vat','barter_debit','barter_credit','loyalty_points','adjustment','paymob_capture']),
   $t->bigInteger('amount_subunit'),$t->bigInteger('balance_after_subunit'),$t->string('currency',8),$t->string('reference_type',80)->nullable(),$t->char('reference_uuid',36)->nullable(),$t->string('paymob_transaction_id',80)->nullable()->index(),$t->char('hash_prev',64)->nullable(),$t->char('hash_current',64),$t->json('fx_snapshot')->nullable(),$t->json('meta')->nullable(),$t->dateTime('created_at')->useCurrent()
  ]));
  if(!Schema::hasTable('financial_audit_logs')) Schema::create('financial_audit_logs', fn(Blueprint $t)=>collect([
   $t->id(),$t->char('uuid',36)->unique(),$t->date('audit_date'),$t->foreignId('wallet_id')->nullable()->constrained('app_wallets')->nullOnDelete(),$t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(),$t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->nullable(),$t->bigInteger('opening_subunit')->default(0),$t->bigInteger('closing_subunit')->default(0),$t->bigInteger('total_debits_subunit')->default(0),$t->bigInteger('total_credits_subunit')->default(0),$t->char('transactions_hash',64),$t->char('prev_hash',64)->nullable(),$t->enum('status',['pending','reconciled','mismatch'])->default('pending')->index(),$t->foreignId('reconciled_by')->nullable()->constrained('users')->nullOnDelete(),$t->dateTime('reconciled_at')->nullable(),$t->dateTime('created_at')->useCurrent(),$t->unique(['audit_date','wallet_id'])
  ]));
  // Triggers — immutability (MySQL 8.4)
  DB::unprepared("DROP TRIGGER IF EXISTS trg_wt_no_update; CREATE TRIGGER trg_wt_no_update BEFORE UPDATE ON wallet_transactions FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='wallet_transactions immutable'; END");
  DB::unprepared("DROP TRIGGER IF EXISTS trg_wt_no_delete; CREATE TRIGGER trg_wt_no_delete BEFORE DELETE ON wallet_transactions FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='wallet_transactions immutable'; END");
  DB::unprepared("DROP TRIGGER IF EXISTS trg_esc_no_snapshot_update; CREATE TRIGGER trg_esc_no_snapshot_update BEFORE UPDATE ON escrow_clearings FOR EACH ROW BEGIN IF OLD.commission_rate_snapshot<>NEW.commission_rate_snapshot OR OLD.amount_subunit<>NEW.amount_subunit THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='escrow immutability violated'; END IF; END");
 }
 public function down(): void {
  DB::unprepared('DROP TRIGGER IF EXISTS trg_esc_no_snapshot_update'); DB::unprepared('DROP TRIGGER IF EXISTS trg_wt_no_delete'); DB::unprepared('DROP TRIGGER IF EXISTS trg_wt_no_update');
  Schema::dropIfExists('financial_audit_logs'); Schema::dropIfExists('wallet_transactions'); Schema::dropIfExists('deal_exchange_snapshots'); Schema::dropIfExists('escrow_clearings'); Schema::dropIfExists('commission_rules'); Schema::dropIfExists('exchange_rates');
  // app_wallets kept (core) — additive reverse only drops added cols
  if(Schema::hasTable('app_wallets') && Schema::hasColumn('app_wallets','balance_subunit')){
   Schema::table('app_wallets', fn(Blueprint $t)=>collect([$t->dropColumn(['uuid','balance_subunit','locked_subunit','version'])]));
  }
 }
};
