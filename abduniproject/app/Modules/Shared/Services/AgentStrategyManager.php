<?php
// مدير استراتيجيات الوكلاء — التبديل الثلاثي (Pillar 3)
// Tri-Hybrid Switcher: DeterministicRuleDriver → CloudLlmDriver → LocalGpuDriver

declare(strict_types=1);

namespace App\Modules\Shared\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

enum AgentDriver: string
{
    case Deterministic = 'DeterministicRuleDriver'; // 0-cost PHP/Regex/StateMachine
    case CloudLlm = 'CloudLlmDriver';
    case LocalGpu = 'LocalGpuDriver';
}

final class AgentStrategyManager
{
    private const FALLBACK_THRESHOLD = 90.0; // أقل من 90% → fallback

    /** @param array<string,mixed> $payload */
    public static function resolve(string $input, float $confidenceScore, array $payload = []): array
    {
        // الخطوة 1: فلتر Regex الصفري
        $scan = RegexDataLeakDetector::scan($input);

        if ($scan['clean'] && $confidenceScore >= self::FALLBACK_THRESHOLD) {
            return self::driverResponse(AgentDriver::Deterministic, $scan['sanitized'], $confidenceScore);
        }

        // الخطوة 2: محاولة Cloud LLM إذا تطلب تحليل دلالي
        if (RegexDataLeakDetector::requiresEscalation($input, $confidenceScore)) {
            $llm = self::tryCloudLlm($scan['sanitized'], $payload);
            if ($llm !== null) {
                return $llm;
            }
            // الخطوة 3: fallback إلى Local GPU
            $gpu = self::tryLocalGpu($scan['sanitized'], $payload);
            if ($gpu !== null) {
                return $gpu;
            }
        }

        // Fallback نهائي: وسم كـ FALLBACK وتوجيه للطابور البشري
        return [
            'driver' => AgentDriver::Deterministic->value,
            'output' => $scan['sanitized'],
            'confidence' => $confidenceScore,
            'fallback' => true,
            'hitl_required' => true,
        ];
    }

    private static function driverResponse(AgentDriver $driver, string $output, float $confidence): array
    {
        return ['driver' => $driver->value, 'output' => $output, 'confidence' => $confidence, 'fallback' => false, 'hitl_required' => $confidence < self::FALLBACK_THRESHOLD];
    }

    private static function tryCloudLlm(string $input, array $payload): ?array
    {
        $endpoint = env('CLOUD_LLM_API_KEY') ? 'https://api.openai.com/v1/chat/completions' : null;
        if ($endpoint === null) {
            return null;
        }
        try {
            $res = Http::timeout(8)->post($endpoint, $payload);
            if ($res->successful()) return self::driverResponse(AgentDriver::CloudLlm, (string) $res->json('choices.0.message.content', $input), 85.0);
        } catch (\Throwable $e) { Log::warning('CloudLlmDriver failed', ['e' => $e->getMessage()]); }
        return null;
    }

    private static function tryLocalGpu(string $input, array $payload): ?array
    {
        $endpoint = env('LOCAL_GPU_ENDPOINT');
        if (! $endpoint) return null;
        try {
            $res = Http::timeout(10)->post($endpoint . '/infer', ['input' => $input] + $payload);
            if ($res->successful()) return self::driverResponse(AgentDriver::LocalGpu, (string) $res->json('output', $input), 82.0);
        } catch (\Throwable $e) { Log::warning('LocalGpuDriver failed', ['e' => $e->getMessage()]); }
        return null;
    }
}
