<?php
// المحفظة المالية متعددة العملات — Multi-Currency Ledger (Core Domain Mandate 1)
// لا توجد عملة أساس — كل سجل بعملة صريحة + تجميد سعر الصرف للعابر للحدود

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('app_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('app_id', 32)->index(); // tenant isolation
            $table->string('currency', 8); // ISO code: EGP, USD, SAR, AED ... dynamic via Super Admin
            $table->decimal('balance', 20, 2)->default(0); // CHECK >=0 via DB constraint below
            $table->decimal('locked_balance', 20, 2)->default(0); // escrow locked
            $table->string('status', 16)->default('active'); // active|frozen|closed
            $table->timestamps();
            $table->unique(['user_id', 'app_id', 'currency']); // محفظة واحدة لكل عملة/تطبيق
            $table->index(['app_id', 'currency']);
        });

        // حماية عدم السالب — additive constraint (MySQL 8.4 CHECK)
        DB::statement('ALTER TABLE app_wallets ADD CONSTRAINT chk_wallet_balance_nonnegative CHECK (balance >= 0)');
        DB::statement('ALTER TABLE app_wallets ADD CONSTRAINT chk_wallet_locked_nonnegative CHECK (locked_balance >= 0)');

        // جدول أسعار الصرف المركزي
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('base_currency', 8); // e.g. EGP
            $table->string('quote_currency', 8); // e.g. USD
            $table->decimal('rate', 20, 8); // 1 base = rate quote
            $table->string('provider', 64)->default('exchangerate_api');
            $table->timestamp('fetched_at')->useCurrent();
            $table->timestamps();
            $table->unique(['base_currency', 'quote_currency']);
        });

        // تجميد سعر الصرف عند الاتفاق للصفقات العابرة للحدود
        Schema::create('deal_exchange_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->nullable(); // polymorphic later
            $table->string('app_id', 32);
            $table->string('base_currency', 8);
            $table->string('quote_currency', 8);
            $table->decimal('locked_rate', 20, 8);
            $table->timestamp('exchange_rate_locked_at'); // frozen moment
            $table->timestamps();
            $table->index(['app_id', 'base_currency', 'quote_currency']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_exchange_snapshots');
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('app_wallets');
    }
};
