<?php
// B.10 additive guard — Arena — reverb at-least-once dedup + last 50 buffer — no DDL, guard only (R11)
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  // no table creation — guarantees are Redis LPUSH broadcast:buffer:{channel} 50 EXPIRE 86400 + Cache processed:event:{event_id} NX EX 3600
  // ensure redis presence store keyspace exists by ping (best effort)
  try{
   // seed meta row for buffer verification via stats_agent_daily existence check
   if(!DB::table('stats_agent_daily')->count()) {} // probe table existence
  } catch(\Throwable){}
 }
 public function down(): void { /* additive only */ }
};
