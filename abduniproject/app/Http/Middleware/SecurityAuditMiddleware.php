<?php
// SecurityAuditMiddleware — Arena — B.3 — async 0ms via terminate() — PII redacted — trace_id
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use App\Services\Security\SecurityAuditLogger; use Illuminate\Support\Str; use Symfony\Component\HttpFoundation\Response;
final class SecurityAuditMiddleware {
 public function handle(Request $request, Closure $next): Response { return $next($request); }
 public function terminate(Request $request, Response $response): void {
  try{
   $user=$request->user();
   $qp=SecurityAuditLogger::redactedQuery($request->query());
   $payload=$request->isJson() ? ($request->json()->all() ?? []) : $request->all();
   $hash=SecurityAuditLogger::payloadHash($payload);
   $ctx=[
    'uuid'=>(string)Str::uuid(),
    'trace_id'=>app()->bound('trace_id')? app('trace_id') : bin2hex(random_bytes(16)),
    'user_id'=>$user?->id,
    'agent_id'=>$user?->agent_id ?? null,
    'app_id'=>$request->attributes->get('app_id') ?? $request->header('X-App-Id'),
    'module_id'=>null,
    'action'=>'API_CALL',
    'route'=>$request->path(),
    'method'=>$request->method(),
    'query_params'=>$qp,
    'payload_hash'=>$hash,
    'payload_snapshot'=>null, // allowlist only — not raw
    'ip_address'=>$request->ip() ?? '0.0.0.0',
    'user_agent'=>substr($request->userAgent() ?? '',0,255),
    'created_at'=>now(3),
   ];
   SecurityAuditLogger::log($ctx);
  }catch(\Throwable){}
 }
}
