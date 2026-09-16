<?php
declare(strict_types=1);
namespace App\Infrastructure\Persistence\Eloquent;
use App\Domain\Governance\Enums\SubCapabilityKey; use App\Domain\Governance\Repositories\MicroSwitchRepositoryInterface;
use App\Infrastructure\Cache\MicroPermissionCache; use Illuminate\Support\Facades\DB;
final class EloquentMicroSwitchRepository implements MicroSwitchRepositoryInterface {
 public function allForAgent(int $agentId,string $appId): array { return MicroPermissionCache::allForAgent($agentId,$appId); }
 public function isEnabled(int $agentId,string $appId,int $moduleId,SubCapabilityKey $cap): bool { return MicroPermissionCache::isEnabled($agentId,$appId,$moduleId,$cap->value); }
 public function requiresApproval(int $agentId,string $appId,int $moduleId,SubCapabilityKey $cap): bool { return MicroPermissionCache::requiresApproval($agentId,$appId,$moduleId,$cap->value); }
 public function set(int $agentId,string $appId,int $moduleId,SubCapabilityKey $cap,bool $enabled,bool $approvalRequired,int $actorId,string $reason,string $ip): void {
  $existing=DB::table('micro_switch_matrix')->where(['agent_id'=>$agentId,'app_id'=>$appId,'module_id'=>$moduleId,'sub_capability_key'=>$cap->value])->first();
  if($existing){
   DB::table('micro_switch_matrix')->where('id',$existing->id)->update(['is_enabled'=>$enabled,'approval_required'=>$approvalRequired,'granted_by'=>$actorId,'reason'=>$reason,'updated_at'=>now()]);
   DB::table('micro_switch_audits')->insert(['matrix_id'=>$existing->id,'agent_id'=>$agentId,'sub_capability_key'=>$cap->value,'old_is_enabled'=>(bool)$existing->is_enabled,'new_is_enabled'=>$enabled,'old_approval_required'=>(bool)$existing->approval_required,'new_approval_required'=>$approvalRequired,'actor_id'=>$actorId,'ip_address'=>$ip,'reason'=>$reason,'created_at'=>now(3)]);
  } else {
   $id=DB::table('micro_switch_matrix')->insertGetId(['agent_id'=>$agentId,'app_id'=>$appId,'module_id'=>$moduleId,'sub_capability_key'=>$cap->value,'is_enabled'=>$enabled,'approval_required'=>$approvalRequired,'granted_by'=>$actorId,'reason'=>$reason,'created_at'=>now(),'updated_at'=>now()]);
   DB::table('micro_switch_audits')->insert(['matrix_id'=>$id,'agent_id'=>$agentId,'sub_capability_key'=>$cap->value,'old_is_enabled'=>null,'new_is_enabled'=>$enabled,'old_approval_required'=>null,'new_approval_required'=>$approvalRequired,'actor_id'=>$actorId,'ip_address'=>$ip,'reason'=>$reason,'created_at'=>now(3)]);
  }
  MicroPermissionCache::invalidate($agentId,$appId);
  try{ event(new \App\Events\MicroPermissionToggled($agentId,$appId,$cap,$enabled)); }catch(\Throwable){}
 }
}
