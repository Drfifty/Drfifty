<?php
// وسيط فحص حالة الوحدة — AU Lite Feature Flags (Pillar 4)
// يرجع 503 نظيف عند hibernation دون كسر باقي المنظومة

declare(strict_types=1);

namespace App\Modules\Shared\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class CheckModuleStatus
{
    private const MODULE_MAP = [
        'AU DEALS' => 'feature_flags.adl_enabled',
        'AU SERV' => 'feature_flags.asv_enabled',
        'AU INVEST' => 'feature_flags.ainv_enabled',
        'AU MED' => 'feature_flags.amed_enabled',
        // AU BUSINESS هو النواة — لا يُجمد أبداً
    ];

    public function handle(Request $request, Closure $next, string $appId): Response
    {
        // السماح دائماً لـ AU BUSINESS
        if ($appId === 'AU BUSINESS') {
            return $next($request);
        }

        $enabled = $this->isEnabled($appId);

        if (! $enabled) {
            // إرجاع 503 نظيف مع Inertia/JSON حسب الطلب
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json(['message' => 'Module hibernated', 'app_id' => $appId], 503);
            }
            abort(503, "Module {$appId} is hibernated (AU Lite)");
        }

        return $next($request);
    }

    private function isEnabled(string $appId): bool
    {
        // قراءة من .env كـ fallback + جدول feature_flags كـ مصدر ديناميكي
        $envKey = match ($appId) {
            'AU DEALS' => 'FEATURE_AU_DEALS',
            'AU SERV' => 'FEATURE_AU_SERV',
            'AU INVEST' => 'FEATURE_AU_INVEST',
            'AU MED' => 'FEATURE_AU_MED',
            default => null,
        };

        if ($envKey && env($envKey) === 'hibernated') {
            return false;
        }

        try {
            $row = DB::table('feature_flags')->where('app_id', $appId)->first();
            if ($row) {
                return (bool) ($row->is_enabled ?? true);
            }
        } catch (\Throwable) {
            // لا نكسر الطلب إذا لم تكن الهجرة موجودة بعد
        }

        return true;
    }
}
