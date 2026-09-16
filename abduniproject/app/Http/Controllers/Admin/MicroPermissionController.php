<?php
// MicroPermissionController — Arena — B.3 — DOM visible array vs Server execution separation
declare(strict_types=1);
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller; use Illuminate\Http\Request; use App\Infrastructure\Cache\MicroPermissionCache; use App\Domain\Governance\Enums\SubCapabilityKey; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
final class MicroPermissionController extends Controller {
 public function index(Request $request){
  $user=$request->user();
  $appId=$request->attributes->get('app_id') ?? $request->header('X-App-Id','AU BUSINESS');
  $agentId=$user?->agent_id ?? 1;
  // quarantine + degraded
  $drm=Cache::get('drm:active') ?? DB::table('system_drm_states')->where('id',1)->first();
  $quarantine=(bool)($drm->is_quarantine_active ?? false);
  $degraded=(bool)($request->attributes->get('au_lite_degraded',false));
  if($quarantine) return response()->json(['visible'=>[],'requiresApproval'=>[],'degradedMode'=>$degraded,'quarantineActive'=>true,'reason'=>'DRM_QUARANTINE','trace_id'=>app('trace_id')]);
  $perms=MicroPermissionCache::allForAgent($agentId,$appId);
  $visible=[]; $requires=[];
  foreach($perms as $cap=>$meta){ if($meta['enabled']) { $visible[]=$cap; if($meta['approval']) $requires[]=$cap; } }
  // if no rows seeded → default visible all (safe default)
  if(empty($visible) && empty($perms)) $visible=array_map(fn($c)=>$c->value, SubCapabilityKey::cases());
  return response()->json(['visible'=>$visible,'requiresApproval'=>$requires,'degradedMode'=>$degraded,'quarantineActive'=>false,'app_id'=>$appId,'agent_id'=>$agentId,'trace_id'=>app('trace_id')]);
 }
 public function toggle(Request $request){
  $request->validate(['agent_id'=>'required|integer|between:1,13','app_id'=>'required|string','module_id'=>'required|integer|between:1,9','sub_capability_key'=>'required|string','is_enabled'=>'required|boolean','approval_required'=>'required|boolean','reason'=>'required|string|min:15']);
  if(!SubCapabilityKey::isValid($request->sub_capability_key)) return response()->json(['message'=>'Invalid capability'],422);
  $cap=SubCapabilityKey::from($request->sub_capability_key);
  app(\App\Domain\Governance\Repositories\MicroSwitchRepositoryInterface::class)->set((int)$request->agent_id,$request->app_id,(int)$request->module_id,$cap,(bool)$request->is_enabled,(bool)$request->approval_required, $request->user()->id, trim($request->reason), $request->ip());
  return response()->json(['message'=>'Micro-permission updated','cap'=>$cap->value]);
 }
}
