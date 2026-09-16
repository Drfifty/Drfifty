<?php
// Support/Lock — Arena — FIX-360-13 skew-aware lock helper — Clock skew margin 30s
declare(strict_types=1);
namespace App\Support;
use Illuminate\Support\Facades\Cache;
final class Lock {
    // B360-13: add CLOCK_SKEW_MARGIN 30s to all TTLs — chrony skew <30s
    public static function withSkew(string $name, int $ttlSeconds): \Illuminate\Contracts\Cache\Lock {
        $skew = (int) config('ai.clock_skew_margin', (int) env('CLOCK_SKEW_MARGIN', 30));
        return Cache::lock($name, $ttlSeconds + $skew);
    }
    public static function getWithSkew(string $name, int $ttlSeconds): ?\Illuminate\Contracts\Cache\Lock {
        $lock = self::withSkew($name, $ttlSeconds);
        return $lock->get() ? $lock : null;
    }
}
