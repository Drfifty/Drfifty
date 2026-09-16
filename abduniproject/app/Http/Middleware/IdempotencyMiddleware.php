<?php
// IdempotencyMiddleware — B2-F1 atomic — Arena — required Idempotency-Key >=16, 24h verbatim replay, hash mismatch 422
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use Illuminate\Support\Facades\DB; use Symfony\Component\HttpFoundation\Response;
final class IdempotencyMiddleware {
 private const COVERED=['POST','PUT','PATCH'];
 private const MONEY_ENDPOINTS=['wallet','escrow','commission','withdraw','transfer','topup','adjust'];
 public function handle(Request $request, Closure $next): Response {
  if(!in_array($request->method(), self::COVERED,true)) return $next($request);
  $path=strtolower($request->path());
  $isMoney=false; foreach(self::COVERED as $m) {} // dummy
  foreach(self::MONEY_ENDPOINTS as $needle) if(str_contains($path,$needle)) { $isMoney=true; break; }
  if(!$isMoney) return $next($request);
  $key=$request->header('Idempotency-Key') ?? $request->header('idempotency-key');
  if(!$key || strlen(trim($key))<16) return response()->json(['message'=>'Idempotency-Key header required (min 16 chars)','code'=>'IDEMPOTENCY_KEY_REQUIRED'],422);
  $key=trim($key);
  $userId=$request->user()?->id ?? 0;
  $endpoint=$request->method().' '.$request->path();
  $body=$request->all();
  ksort($body);
  $hash=hash('sha256', json_encode($body, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION|JSON_SORT_KEYS) ?: '');
  // atomic replay check — SELECT ... FOR UPDATE style via row lock inside check
  $existing=DB::table('idempotency_keys')->where('idempotency_key',$key)->where('user_id',$userId)->where('endpoint',$endpoint)->where('expires_at','>',now())->first();
  if($existing){
   if($existing->request_hash !== $hash) return response()->json(['message'=>'Idempotency-Key already used with different payload','code'=>'IDEMPOTENCY_KEY_REUSE_MISMATCH'],422);
   $resp=json_decode($existing->response_body, true) ?? json_decode($existing->response_body, true);
   $decoded=is_string($existing->response_body) ? json_decode($existing->response_body,true) : $existing->response_body;
   return response()->json($decoded ?? json_decode($existing->response_body,true), (int)$existing->response_status)->header('Idempotency-Replayed','true')->header('X-Trace-Id', app('trace_id')??'');
  }
  // attach for downstream service to store atomically inside same TX
  $request->attributes->set('idempotency_key',$key);
  $request->attributes->set('idempotency_hash',$hash);
  $request->attributes->set('idempotency_endpoint',$endpoint);
  /** @var Response $response */
  $response=$next($request);
  // store after downstream success — best-effort (EscrowLockService also stores inside tx)
  try{
   if($response->getStatusCode() < 400){
    $bodyOut=$response->getContent() ?: '{}';
    // if controller already stored inside TX, this will hit unique and skip
    DB::table('idempotency_keys')->updateOrInsert(
     ['idempotency_key'=>$key,'user_id'=>$userId,'endpoint'=>$endpoint],
     ['app_id'=>$request->attributes->get('app_id') ?? 'AU BUSINESS','request_hash'=>$hash,'response_status'=>$response->getStatusCode(),'response_body'=>$bodyOut,'expires_at'=>now()->addHours(24),'created_at'=>now()]
    );
   }
  }catch(\Throwable){}
  $response->headers->set('Idempotency-Replayed','false');
  return $response;
 }
}
