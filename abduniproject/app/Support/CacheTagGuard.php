<?php
// Support/CacheTagGuard — Arena — FIX-360-01/02 targeted tags — no Cache::flush fallback
declare(strict_types=1);
namespace App\Support;
use Illuminate\Support\Facades\Cache;
final class CacheTagGuard {
    // FIX-360-01: targeted flush only — never Cache::flush() — preserves DB0 session
    // FIX-360-02: pinned to redis cache store DB1 where tags supported
    public static function flushTags(array $tags): void {
        try {
            Cache::store('redis')->tags($tags)->flush();
        } catch (\Throwable $e) {
            // fallback: forget each tag key pattern individually — never full flush
            foreach ($tags as $tag) {
                try { Cache::store('redis')->tags([$tag])->flush(); } catch (\Throwable) {}
            }
        }
    }
    public static function forget(string $key): void {
        try { Cache::forget($key); } catch (\Throwable) {}
        try { Cache::store('redis')->forget($key); } catch (\Throwable) {}
    }
    public static function putWithTags(string $key, mixed $value, int $ttl, array $tags = []): void {
        try { Cache::put($key, $value, $ttl); } catch (\Throwable) {}
        if ($tags !== []) {
            try { Cache::store('redis')->tags($tags)->put($key, $value, $ttl); } catch (\Throwable) {}
        }
    }
}
