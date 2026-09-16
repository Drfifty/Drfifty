<?php
// AnonymizedTelemetryMiddleware — B.5/B.7 F-07 — Arena — hard-block raw chat text, allow only HMAC hashes — 422
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use Symfony\Component\HttpFoundation\Response;
final class AnonymizedTelemetryMiddleware {
 private const BLOCK_KEYS=['raw','text','chat','complaint_raw','transcript','message_raw','content_raw'];
 public function handle(Request $request, Closure $next): Response {
  $payload=$request->all();
  $flat=strtolower(json_encode($payload, JSON_UNESCAPED_UNICODE) ?: '');
  foreach(self::BLOCK_KEYS as $k){
   if(array_key_exists($k,$payload) || str_contains($flat,'"'.$k.'"')){
    // also check nested via recursive keys
    if($this->containsKey($payload,$k)) return response()->json(['message'=>'Raw telemetry blocked — only anonymized hashes allowed','code'=>'RAW_TELEMETRY_BLOCKED','leaks'=>[$k]],422);
   }
  }
  // TTL 90d not enforced here
  return $next($request);
 }
 private function containsKey(array $a, string $k): bool {
  foreach($a as $key=>$v){ if(strtolower((string)$key)===strtolower($k)) return true; if(is_array($v) && $this->containsKey($v,$k)) return true; }
  return false;
 }
}
