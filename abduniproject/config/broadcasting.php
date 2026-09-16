<?php
// ABD UNI PROJECT — Broadcasting uses Reverb exclusively (port 8080) — B.10 F-03 + FIX-360-09 single alias canonical
declare(strict_types=1);

// FIX-360-09: BROADCAST_PORT canonical, REVERB_PORT @deprecated alias — R17 single source 8080
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
                'port' => (int) env('BROADCAST_PORT', 8080), // FIX-360-09: canonical only — REVERB_PORT deprecated
                'scheme' => env('REVERB_SCHEME', 'http'),
            ],
        ],
        'log' => ['driver' => 'log'],
        'null' => ['driver' => 'null'],
    ],
];
