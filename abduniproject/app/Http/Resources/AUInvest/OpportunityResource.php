<?php
// OpportunityResource — B.7 F-06 — Arena — minor formatted + funding progress
declare(strict_types=1);
namespace App\Http\Resources\AUInvest;
use Illuminate\Http\Resources\Json\JsonResource;
final class OpportunityResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  $target=(int)($r->funding_target_minor ?? $r->target_minor ?? 0);
  $funded=(int)($r->funded_minor ?? $r->raised_minor ?? 0);
  return [
   'id'=>$r->id,'uuid'=>$r->uuid ?? null,'title'=>$r->title ?? null,
   'amount_minor'=>(int)($r->amount_minor ?? $target),'amount_formatted'=>number_format(((int)($r->amount_minor ?? $target))/100,2,'.',','),
   'funding_target_minor'=>$target,'funded_minor'=>$funded,'progress_pct'=>$target>0 ? round($funded/$target*100,2):0,
   'status'=>$r->status ?? 'funding','currency'=>$r->currency ?? 'EGP','app_id'=>$r->app_id ?? 'AU INVEST',
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
