<?php
// BudgetGuard — Arena — B.4 F-01 + B.11 F-05/F-16 — Redis Lua atomic + skew + Clock — HOT path
declare(strict_types=1);
namespace App\Services\Agents;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Redis;
final class BudgetGuard {
 private static function ttl(): int { return 90000 + (int) config('ai.clock_skew_margin', env('CLOCK_SKEW_MARGIN', 30)); }
 private static function dateKey(int $agentId): string { return "budget:{$agentId}:" . \Carbon\Carbon::today('Africa/Cairo')->toDateString(); }
 public static function wouldExceed(int $agentId, float $deltaCost): bool {
  $key=self::dateKey($agentId).":spend";
  $cap=(float)(Cache::get("budget:cap:{$agentId}") ?? DB::table('agent_budget_caps')->where(['agent_id'=>$agentId,'budget_date'=>\Carbon\Carbon::today('Africa/Cairo')->toDateString()])->value('daily_cost_cap_usd') ?? 5.0);
  $ttl=self::ttl();
  $lua="local new=redis.call('INCRBYFLOAT',KEYS[1],ARGV[1]); redis.call('EXPIRE',KEYS[1],ARGV[3]); if tonumber(new) > tonumber(ARGV[2]) then redis.call('INCRBYFLOAT',KEYS[1],-ARGV[1]); return 0 end return 1";
  try{ $res=Redis::eval($lua,1,$key,(string)$deltaCost,(string)$cap,(string)$ttl); if($res===1){ Redis::eval("redis.call('INCRBYFLOAT',KEYS[1],-ARGV[1])",1,$key,(string)$deltaCost); return false; } return true; }catch(\Throwable){ // fallback non-Lua
   $cur=(float)(Redis::get($key) ?? 0); return ($cur + $deltaCost) > $cap;
  }
 }
 public static function add(int $agentId, int $tokens, float $cost): void {
  $k=self::dateKey($agentId); $ttl=self::ttl();
  Redis::incrby("{$k}:tokens", $tokens);
  Redis::eval("redis.call('INCRBYFLOAT',KEYS[1],ARGV[1]); redis.call('EXPIRE',KEYS[1],ARGV[2]);",1,"{$k}:spend",(string)$cost,(string)$ttl);
  Redis::expire("{$k}:spend",$ttl); Redis::expire("{$k}:tokens",$ttl);
 }
 public static function checkExceeded(int $agentId): bool {
  $k=self::dateKey($agentId).":spend";
  $cap=(float)(DB::table('agent_budget_caps')->where(['agent_id'=>$agentId,'budget_date'=>\Carbon\Carbon::today('Africa/Cairo')->toDateString()])->value('daily_cost_cap_usd') ?? 5.0);
  return ((float)(Redis::get($k) ?? 0)) >= $cap;
 }
}
