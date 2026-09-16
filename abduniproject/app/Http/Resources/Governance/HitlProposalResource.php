<?php
// HitlProposalResource — B.8 F-10 — Arena — cursor20 tenant isolated proposal formatting
declare(strict_types=1);
namespace App\Http\Resources\Governance;
use Illuminate\Http\Resources\Json\JsonResource;
final class HitlProposalResource extends JsonResource {
 public function toArray($request): array {
  $r=(array)($this->resource ?? []);
  $obj=$this->resource; $get=function($k,$d=null) use($r,$obj){ return $r[$k] ?? ($obj->$k ?? $d); };
  return [
   'id'=>$get('id') ?? $get('action_id'),
   'agent_id'=>$get('agent_id'),
   'app_id'=>$get('app_id') ?? 'AU BUSINESS',
   'module_id'=>$get('module_id') ?? 9,
   'capability'=>$get('capability') ?? $get('capability_key') ?? $get('sub_capability_key'),
   'status'=>$get('status') ?? $get('outcome') ?? 'pending',
   'rationale'=>$get('rationale') ?? $get('reason'),
   'requester_id'=>$get('requester_id') ?? $get('hitl_granted_by'),
   'approved_by'=>$get('approved_by') ?? $get('hitl_granted_by'),
   'created_at'=>$get('created_at'),
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
 public static function collectionPaginated(array $payload): array {
  $items=collect($payload['data'] ?? [])->map(fn($row)=> (new self($row))->toArray(request()))->all();
  return ['data'=>$items,'meta'=>['next_cursor'=>$payload['next_cursor'] ?? null,'per_page'=>$payload['per_page'] ?? 20,'page'=>$payload['page'] ?? null,'table'=>$payload['table'] ?? 'hitl_approvals','trace_id'=>app()->bound('trace_id')?app('trace_id'):null]];
 }
}
