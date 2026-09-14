<?php
// هجرة أعلام الميزات — AU Lite (Pillar 4) — تجميد ديناميكي للوحدات الفرعية

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // MySQL 8.4: نستخدم JSON الأصلي وليس JSONB (JSONB غير موجود في MySQL)
        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            // app_id tenant — القيم المسموحة: AU BUSINESS, AU MED, AU DEALS, AU SERV, AU INVEST
            $table->string('app_id', 32)->index();
            $table->string('module_key', 64)->unique(); // e.g. au_deals, au_serv
            $table->boolean('is_enabled')->default(true);
            $table->json('meta')->nullable(); // MySQL JSON (binary + virtual generated columns)
            $table->timestamps();

            $table->unique(['app_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};
