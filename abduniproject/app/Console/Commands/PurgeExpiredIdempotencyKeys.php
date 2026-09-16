<?php
// PurgeExpiredIdempotencyKeys — B2-F6 batched delete 1000 — Arena — scheduled hourly
declare(strict_types=1);
namespace App\Console\Commands;
use Illuminate\Console\Command; use Illuminate\Support\Facades\DB;
final class PurgeExpiredIdempotencyKeys extends Command {
 protected $signature='idempotency:purge {--batch=1000}';
 protected $description='Batched purge expired idempotency_keys (B2-F6) — avoids long table lock';
 public function handle(): int {
  $batch=(int)$this->option('batch');
  $total=0;
  do{
   $deleted=DB::table('idempotency_keys')->where('expires_at','<',now())->limit($batch)->delete();
   $total+=$deleted;
   if($deleted>0) usleep(10000);
  }while($deleted>0 && $deleted===$batch);
  $this->info("Purged {$total} expired idempotency keys");
  // also beat heartbeat if primary
  try{ DB::table('heartbeat')->where('id',1)->update(['beat_at'=>now(3)]); }catch(\Throwable){}
  return 0;
 }
}
