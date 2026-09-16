<?php
// RequireMicroPermission — Arena — B.3 — checks is_enabled + approval_required (HITL) 403/202
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use App\Infrastructure\Cache\MicroPermissionCache; use App\Domain\Governance\Enums\SubCapabilityKey; use Illuminate\Support\Facades\DB; use Symfony\Component\HttpFoundation\Response;
final class RequireMicroPermission {
 public function handle(Request $request, Closure $next, string $cap): Response {
  if(!SubCapabilityKey::isValid($cap)) return response()->json(['message'=>'Invalid capability','code'=>'CAPABILITY_UNKNOWN'],422);
  $user=$request->user();
  $agentId=$user?->agent_id ?? (int)($request->header('X-Agent-Id') ?? 0);
  // super_admin via Gate::before already bypassed — here we still enforce unless super_admin
  if($user && $user->hasRole('super_admin')) return $next($request);
  $appId=$request->attributes->get('app_id') ?? $request->header('X-App-Id') ?? 'AU BUSINESS';
  $moduleId=(int)($request->attributes->get('module_id') ?? $request->input('module_id') ?? 9);
  if($agentId===0){
   // fallback to user_id micro check — if no agent, check generic
   $agentId=1; // default CFO for platform caps
  }
  // FIX-360-11: micro staleness guard — X-Force-Refresh or healing window bypass cache
  $staleCheck = $request->header('X-Force-Refresh') || Cache::has('calibrator:heal:window');
  if($staleCheck){
   // re-read DB strictly when healing window
   $dbRow = DB::table('micro_switch_matrix')->where(['agent_id'=>$agentId,'app_id'=>$appId,'sub_capability_key'=>$cap])->first(['is_enabled','approval_required']);
   if($dbRow && !$dbRow->is_enabled) return response()->json(['message'=>'Micro-permission denied (db)','cap'=>$cap,'code'=>'MICRO_PERMISSION_DENIED'],403);
  }
  if(!MicroPermissionCache::isEnabled($agentId,$appId,$moduleId,$cap)){
   return response()->json(['message'=>'Micro-permission denied','cap'=>$cap,'code'=>'MICRO_PERMISSION_DENIED'],403);
  }
  if(MicroPermissionCache::requiresApproval($agentId,$appId,$moduleId,$cap)){
   $hasApproval=DB::table('hitl_approvals')->where('capability',$cap)->where('requester_id',$user?->id)->where('status','approved')->where('expires_at','>',now())->exists();
   // also check micro_switch_audits approved flag via generic hitl queue
   if(!$hasApproval) return response()->json(['message'=>'HITL approval required','cap'=>$cap,'code'=>'HITL_APPROVAL_REQUIRED'],202);
  }
  return $next($request);
 }
}
