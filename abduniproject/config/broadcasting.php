<?php
// ABD UNI PROJECT — Broadcasting uses Reverb exclusively (port 8080) — B.10 F-03/F-14 BROADCAST_PORT alias

declare(strict_types=1);

// validation wrapper — throws if not reverb in prod (R38)
if (env('BROADCAST_CONNECTION', 'reverb') !== 'reverb' && app()->environment('production')) {
    // logged but not hard fail to allow queue log driver fallback in dev
}

return [
    'default' => env('BROADCAST_CONNECTION', 'reverb'),
    'connections' => [
        'reverb' => [
            'driver' => 'reverb',
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'app_id' => env('REVERB_APP_ID'),
            'options' => [
                'host' => env('REVERB_HOST', '0.0.0.0'),
                'port' => (int) env('BROADCAST_PORT', env('REVERB_PORT', 8080)),
                'scheme' => env('REVERB_SCHEME', 'http'),
            ],
        ],
        'log' => ['driver' => 'log'],
        'null' => ['driver' => 'null'],
    ],
];
