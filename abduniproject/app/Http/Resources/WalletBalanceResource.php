<?php
// WalletBalanceResource — B.6 F-08/F-06 — Arena — minor source of truth + formatted for display only
declare(strict_types=1);
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
final class WalletBalanceResource extends JsonResource {
 public function toArray($request): array {
  $wallets = $this->resource['wallets'] ?? [];
  $data = array_map(function($w){
   $minor = (int)($w->balance_subunit ?? $w->balance_minor ?? 0);
   $avail = (int)($w->available_minor ?? $minor);
   return [
    'wallet_id'=>$w->id,'currency'=>$w->currency,'app_id'=>$w->app_id,
    'balance_minor'=>$minor,'balance_formatted'=>number_format($minor/100,2,'.',','),
    'available_minor'=>$avail,'available_formatted'=>number_format($avail/100,2,'.',','),
    'status'=>$w->status ?? 'active','updated_at'=>$w->updated_at,
   ];
  }, is_array($wallets)?$wallets:[$wallets]);
  return [
   'wallets'=>$data,
   'meta'=>[
    'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,
    'app_id'=>$request->attributes->get('app_id') ?? $request->header('X-App-Id') ?? 'AU BUSINESS',
    'db_route'=>$this->resource['db_route'] ?? 'primary',
    'cached'=>$this->resource['cached'] ?? false,
   ],
  ];
 }
}
