<?php
// ABD UNI PROJECT — Reverb exclusive realtime driver (port 8080, wss://)
// No Pusher/Ably/Soketi — Reverb is the sole driver per manifest

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
                'port' => env('REVERB_PORT', 8080),
                'scheme' => env('REVERB_SCHEME', 'http'),
                'useTLS' => env('REVERB_SCHEME', 'http') === 'https', // wss:// in prod via Nginx/Cloudflare
            ],
            'client_options' => [],
        ],
    ],
];
