<?php
// ReplicaConnectionResolver — B2-F5 — heartbeat instead of SHOW SLAVE STATUS (no privilege)
declare(strict_types=1);
namespace App\Infrastructure\Database;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
final class ReplicaConnectionResolver {
 public static function connection(): string {
  $threshold=(int)env('DB_REPLICA_LAG_THRESHOLD',5);
  try{
   $lagMs=self::lagMs();
   if($lagMs===null) return 'mysql';
   return $lagMs > $threshold*1000 ? 'mysql' : 'mysql_replica';
  }catch(\Throwable){ return 'mysql'; }
 }
 public static function lagMs(): ?int {
  try{
   $cached=Cache::get('replica_lag_ms');
   if($cached!==null) return (int)$cached;
   // heartbeat lag: TIMESTAMPDIFF(MICROSECOND, beat_at, NOW(3))
   $row=DB::connection('mysql_replica')->table('heartbeat')->where('id',1)->first(['beat_at']);
   if(!$row) return null;
   $primaryRow=DB::connection('mysql')->table('heartbeat')->where('id',1)->first(['beat_at']);
   // fallback: compare replica beat_at vs now on replica
   $lag=DB::connection('mysql_replica')->selectOne("SELECT TIMESTAMPDIFF(MICROSECOND, beat_at, NOW(3)) as usec FROM heartbeat WHERE id=1");
   $usec=(int)($lag->usec ?? 0);
   $ms=max(0,intdiv($usec,1000));
   Cache::put('replica_lag_ms',$ms,5);
   return $ms;
  }catch(\Throwable $e){ return null; }
 }
 public static function headerValue(): string { return self::connection()==='mysql_replica' ? 'replica' : 'primary-fallback'; }
}
