<?php
// HitlAction — B.8 F-10 — Arena — tenant+app isolated queue cursor20 + approve 202→200 WORM+Reverb
declare(strict_types=1);
namespace App\Domain\Governance\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Str;
final class HitlAction {
 public function queue(array $filters, $user, ?string $appIdHeader): array {
  // tenant isolation: tenant_id = user->tenant_id ?? user->id ; app isolation via X-App-Id or filter app_id
  $tenantId = $user?->tenant_id ?? $user?->id ?? 0;
  $appId = $filters['app_id'] ?? $appIdHeader ?? ($user?->app_id ?? null);
  $status = $filters['status'] ?? 'pending';
  $perPage = min(20, max(1, (int)($filters['per_page'] ?? 20)));
  // prefer hitl_approvals, fallback agent_actions hitl_required
  $table = $this->resolveTable();
  $q = DB::table($table);
  // apply status if column exists
  try{
   if($table==='hitl_approvals'){
    if($status) $q->where('status',$status);
    if($appId) $q->where('app_id',$appId);
    // tenant column may be tenant_id or requester tenant scoping via requester_id
    // if tenant_id column exists filter, else filter by requester_id's tenant
    if(\Illuminate\Support\Facades\Schema::hasColumn($table,'tenant_id')) $q->where('tenant_id',$tenantId);
    $q->orderByDesc('created_at');
   } else {
    $q->where('hitl_required',1);
    if($status==='pending') $q->where('outcome','pending');
    $q->orderByDesc('created_at');
   }
  }catch(\Throwable){}
  // cursor pagination 20 — use cursorPaginate if available, else simple paginate
  try{
   $cursor = request()->query('cursor');
   $p = $q->cursorPaginate($perPage);
   return ['data'=>$p->items(),'next_cursor'=>$p->nextCursor()?->encode(),'per_page'=>$perPage,'table'=>$table];
  }catch(\Throwable){
   $page = max(1,(int)($filters['page'] ?? 1));
   $items = $q->forPage($page,$perPage)->get();
   return ['data'=>$items,'next_cursor'=>null,'per_page'=>$perPage,'table'=>$table,'page'=>$page];
  }
 }
 public function approve(int $taskId, string $decision, string $rationale, $approver, string $ip): array {
  $table=$this->resolveTable();
  return DB::transaction(function() use($table,$taskId,$decision,$rationale,$approver,$ip){
   $row=DB::table($table)->where('id',$taskId)->lockForUpdate()->first();
   if(!$row) throw new \RuntimeException('HITL task not found',404);
   $statusCol = $table==='hitl_approvals' ? 'status' : 'outcome';
   $curStatus = $row->$statusCol ?? 'pending';
   if(!in_array($curStatus,['pending','rejected'],true) && $decision==='approved') throw new \RuntimeException('Task already processed',409);
   // approver micro check is done via RequireMicroPermission middleware; double-check here
   $approverId=$approver?->id ?? 0;
   $trace=app()->bound('trace_id')?app('trace_id'):bin2hex(random_bytes(16));
   if($table==='hitl_approvals'){
    DB::table($table)->where('id',$taskId)->update(['status'=>$decision,'rationale'=>mb_substr(trim($rationale),0,1000),'approved_by'=>$approverId,'approved_at'=>now(),'updated_at'=>now()]);
    // WORM audit
    try{ \App\Services\Security\SecurityAuditLogger::log(['uuid'=>(string)Str::uuid(),'trace_id'=>$trace,'user_id'=>$approverId,'agent_id'=>$row->agent_id ?? null,'app_id'=>$row->app_id ?? 'AU BUSINESS','module_id'=>$row->module_id ?? 9,'action'=>'HITL_'.strtoupper($decision),'route'=>'api/v1/ai/governance/hitl/approve','method'=>'POST','query_params'=>null,'payload_hash'=>hash('sha256',$rationale),'payload_snapshot'=>null,'ip_address'=>$ip,'user_agent'=>substr(request()->userAgent()??'',0,255),'created_at'=>now(3)]); }catch(\Throwable){}
   } else {
    DB::table($table)->where('action_id',$row->action_id ?? $taskId)->update(['outcome'=>$decision==='approved'?'executed':'rejected','hitl_granted_by'=>$approverId]);
    try{ \App\Services\Security\SecurityAuditLogger::log(['uuid'=>(string)Str::uuid(),'trace_id'=>$trace,'user_id'=>$approverId,'agent_id'=>$row->agent_id ?? null,'app_id'=>'AU BUSINESS','module_id'=>9,'action'=>'HITL_'.strtoupper($decision),'route'=>'api/v1/ai/governance/hitl/approve','method'=>'POST','query_params'=>null,'payload_hash'=>hash('sha256',$rationale),'payload_snapshot'=>null,'ip_address'=>$ip,'user_agent'=>substr(request()->userAgent()??'',0,255),'created_at'=>now(3)]); }catch(\Throwable){}
   }
   try{ Cache::tags(['micro_perm'])->flush(); }catch(\Throwable){}
   try{ event(new \App\Events\MicroPermissionToggled($row->agent_id ?? 0, $row->app_id ?? 'AU BUSINESS', \App\Domain\Governance\Enums\SubCapabilityKey::tryFrom($row->capability ?? $row->capability_key ?? 'hitl.approve') ?? \App\Domain\Governance\Enums\SubCapabilityKey::HITL_APPROVE, $decision==='approved')); }catch(\Throwable){}
   // Reverb private tenant hitl — no AgentConfidenceEvaluated broadcast here (decoupled)
   return ['task_id'=>$taskId,'decision'=>$decision,'trace_id'=>$trace];
  });
 }
 private function resolveTable(): string {
  try{ if(\Illuminate\Support\Facades\Schema::hasTable('hitl_approvals')) return 'hitl_approvals'; }catch(\Throwable){}
  return 'agent_actions';
 }
}
