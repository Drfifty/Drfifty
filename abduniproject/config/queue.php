<?php
// queue — B.12 F-11 — bulkhead 4 logical queues critical/standard/low/ai — failed database-uuids — Arena
declare(strict_types=1);
return [
 'default'=>env('QUEUE_CONNECTION','redis'),
 'connections'=>[
  'sync'=>['driver'=>'sync'],
  'redis'=>[
   'driver'=>'redis','connection'=>'default','queue'=>env('QUEUE_DEFAULT','default'),
   'retry_after'=>(int) env('QUEUE_RETRY_AFTER',90),'block_for'=>null,'after_commit'=>false,
  ],
 ],
 'failed'=>['driver'=>env('QUEUE_FAILED_DRIVER','database-uuids'),'database'=>env('DB_CONNECTION','mysql'),'table'=>env('QUEUE_FAILED_TABLE','failed_jobs')],
 // bulkhead names for horizon/doc
 'bulkhead'=>[
  'critical'=>['queue'=>'critical','timeout'=>12,'tries'=>3,'maxTime'=>3600,'replicas'=>2],
  'standard'=>['queue'=>'standard','timeout'=>60,'tries'=>3,'maxTime'=>3600,'replicas'=>1],
  'low'=>['queue'=>'low','timeout'=>60,'tries'=>3,'maxTime'=>3600,'replicas'=>1],
  'ai'=>['queue'=>'ai','timeout'=>125,'tries'=>3,'maxTime'=>3600,'replicas'=>2],
 ],
];
