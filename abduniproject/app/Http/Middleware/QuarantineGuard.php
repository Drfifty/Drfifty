<?php
// QuarantineGuard — Arena — B.3 — DRM hierarchy > AU Lite — 503 writes allowlist GET+drm/status/disarm/annihilate
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB; use Symfony\Component\HttpFoundation\Response;
final class QuarantineGuard {
 private const ALLOW_READ=true;
 private const ALLOW_PATHS=['api/v1/system/drm/status','api/v1/system/drm/disarm','api/v1/system/drm/annihilate','api/v1/system/drm/heartbeat'];
 public function handle(Request $request, Closure $next): Response {
  $drm=Cache::remember('drm:active',60,function(){
   return DB::table('system_drm_states')->where('id',1)->first(['is_quarantine_active','grace_period_expires_at','quarantine_triggered_at']);
  });
  if($drm && (bool)$drm->is_quarantine_active){
   $isWrite=in_array($request->method(),['POST','PUT','PATCH','DELETE'],true);
   $path=trim($request->path(),'/');
   $isAllow=false;
   foreach(self::ALLOW_PATHS as $p) if(str_starts_with($path, trim($p,'/'))) { $isAllow=true; break; }
   if($isWrite && !$isAllow){
    return response()->json(['message'=>'System in quarantine — writes suspended','code'=>'DRM_QUARANTINE_ACTIVE','grace_expires_at'=>$drm->grace_period_expires_at,'quarantined_at'=>$drm->quarantine_triggered_at],503)->header('Retry-After',3600)->header('X-DRM-Quarantine','1');
   }
   if(str_contains(strtolower($path),'migrate') || $request->has('__ddl')) abort(503,'DDL blocked in quarantine');
  }
  /** @var Response $response */
  $response=$next($request);
  if($drm && (bool)$drm->is_quarantine_active){
   $response->headers->set('X-DRM-Quarantine','1');
   $response->headers->set('X-DRM-Grace-Expires',(string)($drm->grace_period_expires_at ?? ''));
  }
  return $response;
 }
}
