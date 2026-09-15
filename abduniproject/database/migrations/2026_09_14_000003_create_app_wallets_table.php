<?php
// المحفظة المالية متعددة العملات — Multi-Currency Ledger (Core Domain Mandate 1) — Arena Canonical — IN-PLACE AUDIT FIX 2026-09-14
// CORE ANCHOR: AU BUSINESS (ab_) owns single app_wallet ledger — 4 B2C spokes settle via AU BUSINESS vault — universal, 5% adjustable, single-payer Oil3 — Phase1 Q8-14 + Oil2
// Phase1→2 alignment: 5 Apps | 9 Modules 1-9 | no base currency | subunit BIGINT | CHECK>=0 | 90d→S3 Parquet — Rule7 JSON not JSONB
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void {
        // Canonical app_wallets — BIGINT subunit, GENERATED available, version lock — idempotent
        if (Schema::hasTable('app_wallets') && Schema::hasColumn('app_wallets','balance_subunit')) { return; }
        if (Schema::hasTable('app_wallets')) { Schema::dropIfExists('deal_exchange_snapshots'); Schema::dropIfExists('exchange_rates'); Schema::dropIfExists('app_wallets'); }
        Schema::create('app_wallets', function (Blueprint $table) {
            $table->id();
            $table->char('uuid',36)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS')->index();
            $table->string('currency', 8)->comment('ISO4217 EGP,USD,SAR...');
            $table->bigInteger('balance_subunit')->default(0)->comment('cents/piasters — BIGINT subunit');
            $table->bigInteger('locked_subunit')->default(0);
            // available generated stored — instant calc
            $table->string('status',16)->default('active');
            $table->integer('version')->unsigned()->default(0)->comment('optimistic+pessimistic guard');
            $table->timestamps();
            $table->unique(['user_id','app_id','currency']);
            $table->index(['app_id','currency']);
        });
        // MySQL 8.4: add generated column via raw (Blueprint can't)
        try { DB::statement("ALTER TABLE app_wallets ADD COLUMN available_subunit BIGINT GENERATED ALWAYS AS (balance_subunit - locked_subunit) STORED"); } catch (\Throwable $e) {}
        DB::statement("ALTER TABLE app_wallets ADD CONSTRAINT chk_wallet_balance_nonnegative CHECK (balance_subunit >= 0)");
        DB::statement("ALTER TABLE app_wallets ADD CONSTRAINT chk_wallet_locked_nonnegative CHECK (locked_subunit >= 0)");
        DB::statement("ALTER TABLE app_wallets ADD CONSTRAINT chk_wallet_available_nonnegative CHECK (balance_subunit >= locked_subunit)");
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('base_currency', 8);
            $table->string('quote_currency', 8);
            $table->decimal('rate',20,8);
            $table->string('provider',64)->default('exchangerate_api')->index();
            $table->timestamp('fetched_at')->useCurrent();
            $table->timestamps();
            $table->unique(['base_currency','quote_currency']);
        });
        Schema::create('deal_exchange_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
            $table->foreignId('deal_id')->nullable();
            $table->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS');
            $table->string('base_currency',8);
            $table->string('quote_currency',8);
            $table->decimal('locked_rate',20,8);
            $table->dateTime('locked_at');
            $table->timestamps();
            $table->index(['app_id','base_currency','quote_currency']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('deal_exchange_snapshots');
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('app_wallets');
    }
};
