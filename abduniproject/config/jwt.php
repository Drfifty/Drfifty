<?php
// JWT config — B.6 F-04/R17 — Arena — env wrapper never hardcode — validated at startup
declare(strict_types=1);
return [
 'secret'=>env('JWT_SECRET', env('APP_KEY')),
 'ttl'=> (int) env('JWT_TTL',15), // minutes — access 15m
 'refresh_ttl'=> (int) env('JWT_REFRESH_TTL',20160), // minutes — 7d
 'refresh_cookie'=>env('JWT_REFRESH_COOKIE','__Host-refresh'),
 'algo'=>'HS256',
];
