<?php
// EnsureTenant — B1-F5 strict — validates X-App-Id enum before AULiteModuleGuard
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use App\Domain\Governance\Enums\ModuleKey; use Symfony\Component\HttpFoundation\Response;
final class EnsureTenant {
 public function handle(Request $request, Closure $next): Response {
  $appId=trim((string)($request->header('X-App-Id') ?? $request->input('app_id') ?? ''));
  if($appId==='') return $next($request); // public routes allow no tenant
  if(!ModuleKey::isValidAppId($appId)){
   return response()->json(['message'=>'Invalid X-App-Id','allowed'=>['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST']],422);
  }
  app()->instance('app_id',$appId);
  $request->attributes->set('app_id',$appId);
  return $next($request);
 }
}
