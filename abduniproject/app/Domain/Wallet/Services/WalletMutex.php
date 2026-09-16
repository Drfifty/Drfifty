<?php
// WalletMutex — B2-F3 + FIX-360-15 app-scoped — prevents cross-app mutex collision
declare(strict_types=1);
namespace App\Domain\Wallet\Services;
use Illuminate\Support\Facades\Cache; use App\Support\Lock;
final class WalletMutex {
 // FIX-360-15: app-scoped mutex key wallet:mutex:{appId}:{walletId} — isolates AU DEALS vs AU INVEST
 public static function lock(int $walletId, int $ttl=10, ?string $appId=null): \Illuminate\Contracts\Cache\Lock {
  $key = $appId ? "wallet:mutex:{$appId}:{$walletId}" : "wallet:mutex:{$walletId}";
  return Lock::withSkew($key, $ttl);
 }
 /** Lock multiple wallets ordered by id to avoid deadlock (B2-F3 + FIX-360-13 skew) */
 public static function lockMany(array $walletIds, int $ttl=10, ?string $appId=null): array {
  sort($walletIds);
  $locks=[];
  foreach($walletIds as $id){
   $key = $appId ? "wallet:mutex:{$appId}:{$id}" : "wallet:mutex:{$id}";
   $l=Lock::withSkew($key,$ttl);
   if(!$l->get()){ foreach($locks as $rl) $rl->release(); throw new \RuntimeException('Concurrent operation, retry',429); }
   $locks[]=$l;
  }
  return $locks;
 }
 public static function releaseMany(array $locks): void { foreach($locks as $l) try{$l->release();}catch(\Throwable){} }
}
