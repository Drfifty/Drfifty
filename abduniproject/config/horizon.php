<?php
// horizon — B.12 F-11 — bulkhead autoscale 4 supervisors — critical 10s never blocked by ai — Arena
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
  'local'=>['supervisor-1'=>['connection'=>'redis','queue'=>['critical','standard','low','ai'],'balance'=>'simple','processes'=>3,'tries'=>3,'timeout'=>90]],
 ],
];
