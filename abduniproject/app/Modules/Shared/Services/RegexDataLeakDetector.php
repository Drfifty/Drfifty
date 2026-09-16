<?php
// كاشف تسريب البيانات — فلتر Regex صفري التكلفة (Pillar 5)
// Zero-cost deterministic first-pass filter before AI escalation

declare(strict_types=1);

namespace App\Modules\Shared\Services;

final class RegexDataLeakDetector
{
    // تعابير للكشف عن بيانات الاتصال الخارجية
    private const PATTERNS = [
        'phone_eg' => '/(?:\+20|0020|0)?1[0-2,5]{1}[0-9]{8}/u', // مصر: 010/011/012/015
        'phone_intl' => '/\+[0-9]{7,15}/u',
        'email' => '/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/u',
        'url' => '/https?:\/\/[^\s]+|www\.[^\s]+/iu',
        'whatsapp' => '/wa\.me\/[^\s]+|whatsapp[^\s]*/iu',
        'telegram' => '/t\.me\/[^\s]+|telegram[^\s]*/iu',
    ];

    /** @return array{clean: bool, sanitized: string, leaks: string[]} */
    public static function scan(string $input): array
    {
        $leaks = [];
        $sanitized = $input;

        foreach (self::PATTERNS as $type => $pattern) {
            if (preg_match($pattern, $sanitized)) {
                $leaks[] = $type;
                $sanitized = (string) preg_replace($pattern, '[REDACTED]', $sanitized);
            }
        }

        // كشف الأرقام المموهة (مثلاً: 0 1 0 1 2 3...)
        if (preg_match('/(?:\d[\s\-\.]){7,}\d/u', $sanitized)) {
            $leaks[] = 'obfuscated_phone';
            $sanitized = (string) preg_replace('/(?:\d[\s\-\.]){7,}\d/u', '[REDACTED]', $sanitized);
        }

        return [
            'clean' => $leaks === [],
            'sanitized' => $sanitized,
            'leaks' => $leaks,
        ];
    }

    public static function requiresEscalation(string $input, float $confidence): bool
    {
        // إذا لم يجد Regex شيئاً لكن الثقة < 90% → يحتاج تحليل دلالي بالذكاء
        return $confidence < 90.0 || str_contains($input, '[REDACTED]');
    }
}
