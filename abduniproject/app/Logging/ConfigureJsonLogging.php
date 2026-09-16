<?php
// ConfigureJsonLogging — B2-F7 — salted HMAC for user_id, allowlist processor, single-line JSON
declare(strict_types=1);
namespace App\Logging;
use Monolog\Logger;
final class ConfigureJsonLogging {
 public function __invoke(Logger $logger): void {
  foreach($logger->getHandlers() as $h){
   $h->pushProcessor(function(array $r): array {
    $traceId=app()->bound('trace_id')? app('trace_id'): ($r['context']['trace_id'] ?? null);
    $userId=$r['context']['user_id'] ?? auth()->id() ?? null;
    $hmacKey=env('LOG_HMAC_KEY','arena-log-salt-v1');
    $hashed=$userId!==null? 'hmac:'.hash_hmac('sha256',(string)$userId,$hmacKey):null;
    // duration & replica lag from context
    $out=[
     'ts'=>now()->toISOString(),
     'level'=>strtolower($r['level_name']),
     'trace_id'=>$traceId,
     'app_id'=>$r['context']['app_id'] ?? app()->bound('app_id')?app('app_id'):null,
     'user_id_hashed'=>$hashed,
     'endpoint'=>$r['context']['endpoint'] ?? request()->method().' '.request()->path(),
     'duration_ms'=>$r['context']['duration_ms'] ?? null,
     'error_code'=>$r['context']['error_code'] ?? null,
     'wallet_id'=>$r['context']['wallet_id'] ?? null,
     'amount_minor'=>$r['context']['amount_minor'] ?? null,
     'transaction_id'=>$r['context']['transaction_id'] ?? null,
     'replica_lag_ms'=>$r['context']['replica_lag_ms'] ?? \Illuminate\Support\Facades\Cache::get('replica_lag_ms'),
    ];
    // redact rationale/payment raw — never ship
    $r['extra']=$out;
    return $r;
   });
  }
 }
}
