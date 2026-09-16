<?php
// ABD UNI PROJECT — Reverb exclusive driver (port 8080, wss://) — B.10 F-03 + FIX-360-09 canonical
declare(strict_types=1);

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
                'port' => (int) env('BROADCAST_PORT', 8080), // FIX-360-09: REVERB_PORT deprecated alias — use BROADCAST_PORT
                'scheme' => env('REVERB_SCHEME', 'http'),
                'useTLS' => env('REVERB_SCHEME', 'http') === 'https',
            ],
            'client_options' => [],
        ],
    ],
];
