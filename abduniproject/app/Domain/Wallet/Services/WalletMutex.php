<?php
// WalletMutex — B2-F3 — Redis funnel wrapper — ensures finally release — ordered locking
declare(strict_types=1);
namespace App\Domain\Wallet\Services;
use Illuminate\Support\Facades\Cache;
final class WalletMutex {
 public static function lock(int $walletId, int $ttl=10): \Illuminate\Contracts\Cache\Lock {
  return Cache::lock("wallet:mutex:{$walletId}", $ttl);
 }
 /** Lock multiple wallets ordered by id to avoid deadlock (B2-F3) */
 public static function lockMany(array $walletIds, int $ttl=10): array {
  sort($walletIds);
  $locks=[];
  foreach($walletIds as $id){
   $l=Cache::lock("wallet:mutex:{$id}",$ttl);
   if(!$l->get()){ foreach($locks as $rl) $rl->release(); throw new \RuntimeException('Concurrent operation, retry',429); }
   $locks[]=$l;
  }
  return $locks;
 }
 public static function releaseMany(array $locks): void { foreach($locks as $l) try{$l->release();}catch(\Throwable){} }
}
