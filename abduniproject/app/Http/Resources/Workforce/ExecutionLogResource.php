<?php
// ExecutionLogResource — B.9 F-09/F-11 — Arena — stats isolated logs minor formatted trace
declare(strict_types=1);
namespace App\Http\Resources\Workforce;
use Illuminate\Http\Resources\Json\JsonResource;
final class ExecutionLogResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource; $isArr=is_array($r);
  $get=function($k,$d=null) use($r,$isArr){ return $isArr ? ($r[$k] ?? $d) : ($r->$k ?? $d); };
  return [
   'id'=>$get('id'),
   'subscription_id'=>$get('subscription_id'),
   'agent_id'=>$get('agent_id'),
   'app_id'=>$get('app_id'),
   'tokens'=>(int)($get('tokens') ?? 0),
   'cost_usd'=>number_format((float)($get('cost_usd') ?? 0),4,'.',''),
   'status'=>$get('status'),
   'created_at'=>$get('created_at'),
   'hash_current'=>$get('hash_current'),
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'cached'=> $get('cached',false)],
  ];
 }
}
