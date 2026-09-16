<?php
// CircuitBreaker — Arena — B.4 F-07 + B.11 F-16 — 5→OPEN 5min+skew — HALF_OPEN probe
declare(strict_types=1);
namespace App\Services\Agents;
use Illuminate\Support\Facades\Redis;
final class CircuitBreaker {
 private const THRESHOLD=5; private const TTL=300;
 private static function ttl(): int { return self::TTL + (int) config('ai.clock_skew_margin', env('CLOCK_SKEW_MARGIN', 30)); }
 private static function key(string $driver,int $agentId): string { return "circuit:{$driver}:{$agentId}"; }
 public static function isOpen(string $driver,int $agentId): bool {
  $ttl=self::ttl();
  $v=Redis::get(self::key($driver,$agentId));
  if(!$v) return false;
  $data=json_decode($v,true);
  if(($data['state']??'CLOSED')==='OPEN'){
   if(time() - ($data['opened_at']??0) >= $ttl){
    Redis::setex(self::key($driver,$agentId), $ttl, json_encode(['state'=>'HALF_OPEN','failures'=>self::THRESHOLD,'opened_at'=>$data['opened_at']]));
    return false; // allow single probe
   }
   return true;
  }
  return false;
 }
 public static function recordSuccess(string $driver,int $agentId): void { Redis::del(self::key($driver,$agentId)); }
 public static function recordFailure(string $driver,int $agentId): void {
  $k=self::key($driver,$agentId); $ttl=self::ttl();
  $raw=Redis::get($k); $d=$raw? json_decode($raw,true): ['failures'=>0,'state'=>'CLOSED'];
  $d['failures']=(int)($d['failures']??0)+1;
  if($d['failures'] >= self::THRESHOLD){ $d['state']='OPEN'; $d['opened_at']=time(); Redis::setex($k,$ttl,json_encode($d)); }
  else Redis::setex($k,$ttl,json_encode($d));
 }
}
