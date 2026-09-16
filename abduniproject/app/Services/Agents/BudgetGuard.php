<?php
// BudgetGuard — Arena — B.4 F-01 — Redis Lua atomic INCRBYFLOAT — Cairo date — HOT path 0 DB
declare(strict_types=1);
namespace App\Services\Agents;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Redis;
final class BudgetGuard {
 private static function dateKey(int $agentId): string { return "budget:{$agentId}:" . \Carbon\Carbon::today('Africa/Cairo')->toDateString(); }
 public static function wouldExceed(int $agentId, float $deltaCost): bool {
  $key=self::dateKey($agentId).":spend";
  $cap=(float)(Cache::get("budget:cap:{$agentId}") ?? DB::table('agent_budget_caps')->where(['agent_id'=>$agentId,'budget_date'=>\Carbon\Carbon::today('Africa/Cairo')->toDateString()])->value('daily_cost_cap_usd') ?? 5.0);
  // Lua atomic check
  $lua="local new=redis.call('INCRBYFLOAT',KEYS[1],ARGV[1]); redis.call('EXPIRE',KEYS[1],90000); if tonumber(new) > tonumber(ARGV[2]) then redis.call('INCRBYFLOAT',KEYS[1],-ARGV[1]); return 0 end return 1";
  try{ $res=Redis::eval($lua,1,$key,(string)$deltaCost,(string)$cap); if($res===1){ Redis::eval("redis.call('INCRBYFLOAT',KEYS[1],-ARGV[1])",1,$key,(string)$deltaCost); return false; } return true; }catch(\Throwable){ // fallback non-Lua
   $cur=(float)(Redis::get($key) ?? 0); return ($cur + $deltaCost) > $cap;
  }
 }
 public static function add(int $agentId, int $tokens, float $cost): void {
  $k=self::dateKey($agentId);
  Redis::incrby("{$k}:tokens", $tokens);
  Redis::eval("redis.call('INCRBYFLOAT',KEYS[1],ARGV[1]); redis.call('EXPIRE',KEYS[1],90000);",1,"{$k}:spend",(string)$cost);
  Redis::expire("{$k}:spend",90000); Redis::expire("{$k}:tokens",90000);
 }
 public static function checkExceeded(int $agentId): bool {
  $k=self::dateKey($agentId).":spend";
  $cap=(float)(DB::table('agent_budget_caps')->where(['agent_id'=>$agentId,'budget_date'=>\Carbon\Carbon::today('Africa/Cairo')->toDateString()])->value('daily_cost_cap_usd') ?? 5.0);
  return ((float)(Redis::get($k) ?? 0)) >= $cap;
 }
}
