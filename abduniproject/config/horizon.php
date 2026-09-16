<?php
// horizon — B.12 F-11 + FIX-360-08 local bulkhead parity — critical 12s never blocked by ai — Arena
declare(strict_types=1);
return [
 'defaults'=>['supervisor-1'=>['connection'=>'redis','queue'=>['critical','standard','low','ai'],'balance'=>'auto','minProcesses'=>1,'maxProcesses'=>10,'balanceMaxShift'=>1,'balanceCooldown'=>3,'tries'=>3,'timeout'=>90,'maxTime'=>3600,'maxJobs'=>1000]],
 'environments'=>[
  'production'=>[
   'supervisor-critical'=>['connection'=>'redis','queue'=>['critical'],'balance'=>'auto','minProcesses'=>1,'maxProcesses'=>5,'balanceMaxShift'=>1,'balanceCooldown'=>3,'tries'=>3,'timeout'=>12,'maxTime'=>3600,'maxJobs'=>1000],
   'supervisor-standard'=>['connection'=>'redis','queue'=>['standard'],'balance'=>'auto','minProcesses'=>1,'maxProcesses'=>5,'tries'=>3,'timeout'=>60,'maxTime'=>3600,'maxJobs'=>1000],
   'supervisor-low'=>['connection'=>'redis','queue'=>['low'],'balance'=>'auto','minProcesses'=>1,'maxProcesses'=>5,'tries'=>3,'timeout'=>60,'maxTime'=>3600,'maxJobs'=>1000],
   'supervisor-ai'=>['connection'=>'redis','queue'=>['ai'],'balance'=>'auto','minProcesses'=>1,'maxProcesses'=>5,'tries'=>3,'timeout'=>125,'maxTime'=>3600,'maxJobs'=>1000],
  ],
  // FIX-360-08: local now mirrors prod bulkhead timeouts 12/60/60/125 (was single 90) — prevents 125s ai killed at 90s
  'local'=>[
   'supervisor-critical'=>['connection'=>'redis','queue'=>['critical'],'balance'=>'simple','processes'=>1,'tries'=>3,'timeout'=>12,'maxTime'=>3600,'maxJobs'=>1000],
   'supervisor-standard'=>['connection'=>'redis','queue'=>['standard'],'balance'=>'simple','processes'=>1,'tries'=>3,'timeout'=>60,'maxTime'=>3600,'maxJobs'=>1000],
   'supervisor-low'=>['connection'=>'redis','queue'=>['low'],'balance'=>'simple','processes'=>1,'tries'=>3,'timeout'=>60,'maxTime'=>3600,'maxJobs'=>1000],
   'supervisor-ai'=>['connection'=>'redis','queue'=>['ai'],'balance'=>'simple','processes'=>1,'tries'=>3,'timeout'=>125,'maxTime'=>3600,'maxJobs'=>1000],
  ],
 ],
];
