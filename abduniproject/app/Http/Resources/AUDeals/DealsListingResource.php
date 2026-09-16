<?php
// DealsListingResource — B.7 F-05/F-06 — Arena — minor formatted + TenantScoped meta
declare(strict_types=1);
namespace App\Http\Resources\AUDeals;
use Illuminate\Http\Resources\Json\JsonResource;
final class DealsListingResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  $minor=(int)($r->price_minor ?? 0);
  return [
   'uuid'=>$r->uuid ?? null,'title'=>$r->title ?? null,'description'=>$r->description ?? null,
   'price_minor'=>$minor,'price_formatted'=>number_format($minor/100,2,'.',','),
   'currency'=>$r->currency ?? 'EGP','stock'=>$r->stock ?? 0,
   'category_id'=>$r->category_id ?? null,'app_id'=>$r->app_id ?? 'AU DEALS',
   'is_hidden'=>(bool)($r->is_hidden ?? false),'is_stagnant'=>(bool)($r->is_stagnant ?? false),
   'distance_m'=>isset($r->distance_m)? (int)$r->distance_m : null,
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$r->app_id ?? 'AU DEALS'],
  ];
 }
}
