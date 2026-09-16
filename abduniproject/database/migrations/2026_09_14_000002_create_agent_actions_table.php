<?php
// سجل إجراءات الوكلاء — Append-only ledger (Governance — 13 Agents) — Arena Canonical — IN-PLACE AUDIT FIX 2026-09-14
// CORE ANCHOR: AU BUSINESS (ab_) Master Core B2B dispatches 13 agents via micro_switch_matrix — Tri-Hybrid confidence<90 fallback, HITL, Calibrator 100→90%
// Phase1→2 alignment: 5 Apps | 9 Modules 1-9 | 13 Agents (Table 1.3) — Modules 8/9 workforce+calibrator — Pillars 1-3,7
// كل إجراء للوكلاء يجب أن يسجل هنا للتدقيق

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agent_actions', function (Blueprint $table) {
            $table->uuid('action_id')->primary(); // معرف فريد لكل إجراء
            $table->unsignedTinyInteger('agent_id'); // 1..13 per canonical registry
            $table->string('capability_key', 128); // e.g. yield_optimization, spam_detection
            $table->decimal('confidence_score', 5, 2); // 0..100, <90 → FALLBACK
            $table->string('inputs_hash', 64); // SHA256
            $table->string('outputs_hash', 64)->nullable();
            $table->boolean('hitl_required')->default(false);
            $table->unsignedBigInteger('hitl_granted_by')->nullable();
            $table->string('outcome', 32)->default('pending'); // pending|executed|fallback|rejected
            $table->boolean('is_fallback')->default(false);
            $table->json('payload')->nullable(); // MySQL JSON — never JSONB
            $table->timestamp('created_at')->useCurrent();
            $table->index(['agent_id', 'created_at']);
            $table->index('hitl_required'); // HITL queue instant
            $table->index('confidence_score');

            $table->foreign('hitl_granted_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_actions');
    }
};
