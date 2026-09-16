<?php
// SystemController — B.8 F-04/F-07 — Arena — thin status+toggle via ToggleModuleAction
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Governance;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
use App\Http\Requests\Governance\SystemToggleRequest;
use App\Http\Resources\Governance\ModuleStatusResource;
use App\Domain\Governance\Actions\ToggleModuleAction; use App\Domain\Governance\Enums\ModuleKey;
final class SystemController {
 public function status(Request $req): JsonResponse {
  $env=app()->environment();
  $cacheKey="gov:status:{$env}";
  $cached=Cache::tags(['feature_flags'])->get($cacheKey) ?? Cache::get($cacheKey);
  if($cached) return response()->json(new ModuleStatusResource(array_merge($cached,['cached'=>true])),200);
  $modules=[];
  foreach(ModuleKey::cases() as $m){
   $row=DB::table('feature_flags')->where('flag_key',$m->value)->first(['is_enabled','rollout_percentage','maintenance_message','maintenance_message_ar']);
   $modules[$m->appId()] = ['flag_key'=>$m->value,'is_enabled'=> $row? (bool)$row->is_enabled : true,'is_core'=>$m->isCore(),'status'=> ($row && !$row->is_enabled)?'hibernated':'active','rollout'=> $row? (int)($row->rollout_percentage??100):100];
  }
  $agents=DB::table('micro_switch_matrix')->limit(13)->get(['agent_id','sub_capability_key','is_enabled']);
  $drm=Cache::get('drm:active') ?? DB::table('system_drm_states')->where('id',1)->first();
  $payload=['modules'=>$modules,'agents'=>$agents,'quarantine'=>(bool)($drm->is_quarantine_active ?? false),'degraded'=>(bool)($req->attributes->get('au_lite_degraded',false)),'cached'=>false];
  try{ Cache::tags(['feature_flags'])->put($cacheKey,$payload,30); }catch(\Throwable){ Cache::put($cacheKey,$payload,30); }
  return response()->json(new ModuleStatusResource(array_merge($payload,['cached'=>false])),200);
 }
 public function toggle(SystemToggleRequest $req, ToggleModuleAction $action): JsonResponse {
  $v=$req->validated(); $actor=$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? 0;
  try{
   $res=$action->execute($v,(int)$actor,$req->ip()??'0.0.0.0');
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->header('Idempotency-Replayed','false');
  }catch(\Illuminate\Validation\ValidationException $e){
   return response()->json(['message'=>$e->getMessage(),'errors'=>$e->errors()],422);
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=422;
   return response()->json(['message'=>$e->getMessage()], $c);
  }
 }
}
