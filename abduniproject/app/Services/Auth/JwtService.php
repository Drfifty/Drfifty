<?php
// JwtService — B.6 F-04 — Arena — HS256 manual, no external package, uses JWT_SECRET or hash(APP_KEY)
declare(strict_types=1);
namespace App\Services\Auth;
use Illuminate\Support\Facades\Log;
final class JwtService {
 private static function secret(): string {
  $s = env('JWT_SECRET') ?: env('APP_KEY') ?: 'arena-jwt-fallback';
  // APP_KEY may be base64:xxx — hash to 32 bytes
  return hash('sha256', (string)$s, true);
 }
 private static function b64u(string $d): string { return rtrim(strtr(base64_encode($d), '+/', '-_'), '='); }
 private static function b64d(string $d): string { return base64_decode(strtr($d, '-_', '+/')); }
 public static function sign(array $claims, int $ttlSeconds = 900): string {
  $header = ['alg'=>'HS256','typ'=>'JWT'];
  $now = time();
  $payload = array_merge(['iat'=>$now,'exp'=>$now+$ttlSeconds,'jti'=>bin2hex(random_bytes(16))], $claims);
  $h = self::b64u(json_encode($header, JSON_UNESCAPED_SLASHES));
  $p = self::b64u(json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
  $sig = hash_hmac('sha256', $h.'.'.$p, self::secret(), true);
  return $h.'.'.$p.'.'.self::b64u($sig);
 }
 public static function verify(string $token): array {
  $parts = explode('.', $token);
  if(count($parts)!==3) throw new \RuntimeException('Invalid token format',401);
  [$h,$p,$s] = $parts;
  $expected = self::b64u(hash_hmac('sha256', $h.'.'.$p, self::secret(), true));
  if(!hash_equals($expected, $s)) throw new \RuntimeException('Invalid signature',401);
  $payload = json_decode(self::b64d($p), true);
  if(!$payload || ($payload['exp'] ?? 0) < time()) throw new \RuntimeException('Token expired',401);
  return $payload;
 }
 public static function issueAccess(int $userId, string $appId='AU BUSINESS', ?string $traceId=null): array {
  $ttl = (int) env('JWT_TTL', 15) * 60;
  $token = self::sign(['sub'=>$userId,'app_id'=>$appId,'trace_id'=>$traceId], $ttl);
  return ['access_token'=>$token,'expires_in'=>$ttl,'token_type'=>'Bearer'];
 }
}
