<?php
// TraceIdMiddleware — B2 §4.3 + B.10 — W3C traceparent propagation — single-line JSON context
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use Illuminate\Support\Facades\Log; use Symfony\Component\HttpFoundation\Response;
final class TraceIdMiddleware {
 public function handle(Request $request, Closure $next): Response {
  $traceparent=$request->header('traceparent');
  $traceId=null;
  if($traceparent && preg_match('/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/',$traceparent,$m)) $traceId=$m[1];
  if(!$traceId) $traceId=bin2hex(random_bytes(16));
  app()->instance('trace_id',$traceId);
  Log::withContext(['trace_id'=>$traceId]);
  $response=$next($request);
  $response->headers->set('X-Trace-Id',$traceId);
  $response->headers->set('traceparent','00-'.$traceId.'-'.bin2hex(random_bytes(8)).'-01');
  return $response;
 }
}
