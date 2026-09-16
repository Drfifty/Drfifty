<?php
// AULiteModuleGuard — B1-F5 hardened — Arena — Redis-cached, stampede lock, strict X-App-Id, degraded_mode matrix
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB; use App\Domain\Governance\Enums\ModuleKey; use Symfony\Component\HttpFoundation\Response;
final class AULiteModuleGuard {
 private const MAP=['AU MED'=>'au_med','AU DEALS'=>'au_deals','AU SERV'=>'au_serv','AU INVEST'=>'au_invest'];
 // degraded_mode allowlist: read-only endpoints
 private const DEGRADED_ALLOWED=['GET','HEAD','OPTIONS'];
 public function handle(Request $request, Closure $next, string $appId=''): Response {
  $headerAppId=trim((string)($request->header('X-App-Id')?:$appId));
  // B1-F5 strict enum — unknown X-App-Id fails fast via EnsureTenant, here we pass unknown
  if($headerAppId==='') return $next($request);
  if($headerAppId==='AU BUSINESS') return $next($request);
  $moduleKey=self::MAP[$headerAppId] ?? null;
  if($moduleKey===null) return $next($request); // unknown → EnsureTenant will 422
  $env=app()->environment();
  $cacheKey="au:flags:{$env}:{$moduleKey}";
  $row=Cache::get($cacheKey);
  if($row===null){
   $lock=Cache::lock($cacheKey.':refresh',5);
   try{ $lock->block(3); $row=Cache::get($cacheKey); }catch(\Throwable){}
   if($row===null){
    $row=DB::table('feature_flags')->where('flag_key',$moduleKey)->first(['is_enabled','degraded_mode']);
    Cache::put($cacheKey,$row,30);
    try{ Cache::tags(['feature_flags'])->put($cacheKey,$row,30);}catch(\Throwable){}
    try{$lock->release();}catch(\Throwable){}
   } else { try{$lock->release();}catch(\Throwable){} }
  }
  $enabled=$row? (bool)$row->is_enabled : true;
  if(!$enabled){
   $payload=['message'=>'Module Temporarily Hibernated','app_id'=>$headerAppId,'module_key'=>$moduleKey];
   if($request->expectsJson()||$request->header('X-Inertia')) return response()->json($payload,503);
   abort(503,$payload['message']);
  }
  if($row && (bool)($row->degraded_mode ?? 0)){
   $request->attributes->set('au_lite_degraded',true);
   if(!in_array($request->method(),self::DEGRADED_ALLOWED,true)){
    $payload=['message'=>'Module in degraded read-only mode','app_id'=>$headerAppId,'module_key'=>$moduleKey,'code'=>'DEGRADED_READ_ONLY'];
    if($request->expectsJson()||$request->header('X-Inertia')) return response()->json($payload,503);
    abort(503,$payload['message']);
   }
  }
  return $next($request);
 }
}
// Backward compat: CheckModuleStatus alias
if(!class_exists(\App\Modules\Shared\Http\Middleware\CheckModuleStatus::class,false)){
 class_alias(self::class, \App\Modules\Shared\Http\Middleware\CheckModuleStatus::class);
}
