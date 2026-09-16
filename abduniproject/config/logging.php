<?php
// Logging — B2-F7 + B1+B2 single-line JSON allowlist — Arena — salted HMAC, replica_lag_ms
declare(strict_types=1);
return [
 'default'=>env('LOG_CHANNEL','single'),
 'channels'=>[
  'single'=>[
   'driver'=>'single','path'=>storage_path('logs/laravel.log'),'level'=>env('LOG_LEVEL','info'),
   'replace_placeholders'=>true,'formatter'=>\Monolog\Formatter\JsonFormatter::class,'formatter_with'=>['includeStacktraces'=>false],
   'tap'=>[\App\Logging\ConfigureJsonLogging::class],
  ],
  'daily'=>[
   'driver'=>'daily','path'=>storage_path('logs/laravel.log'),'level'=>env('LOG_LEVEL','info'),'days'=>14,
   'formatter'=>\Monolog\Formatter\JsonFormatter::class,'formatter_with'=>['includeStacktraces'=>false],
   'tap'=>[\App\Logging\ConfigureJsonLogging::class],
  ],
 ],
 // allowlist — only these keys ship (PII redacted)
 'allowlist'=>['ts','level','trace_id','app_id','user_id_hashed','endpoint','duration_ms','error_code','wallet_id','amount_minor','transaction_id','replica_lag_ms'],
];
