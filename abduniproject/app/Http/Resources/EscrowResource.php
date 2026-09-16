<?php
// EscrowResource — B.6 F-07 — Arena — immutable snapshot read
declare(strict_types=1);
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
final class EscrowResource extends JsonResource {
 public function toArray($request): array {
  $e = $this->resource;
  $minor = (int)($e->amount_subunit ?? $e->amount_minor ?? 0);
  $comm = (int)($e->commission_amount_subunit ?? 0);
  return [
   'transaction_id'=>$e->transaction_id ?? $e->uuid ?? null,
   'buyer_id'=>$e->buyer_id,'seller_id'=>$e->seller_id,
   'amount_minor'=>$minor,'amount_formatted'=>number_format($minor/100,2,'.',','),
   'commission_minor'=>$comm,'commission_rate'=>$e->commission_rate_snapshot ?? null,
   'currency'=>$e->currency ?? 'EGP','status'=>$e->status ?? 'holding',
   'release_eligible_at'=>$e->release_eligible_at ?? $e->dispute_deadline_at ?? null,
   'app_id'=>$e->app_id ?? 'AU BUSINESS',
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
