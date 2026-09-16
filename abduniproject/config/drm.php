<?php
// DRM config — Arena — B.3 — RSA pub key + HMAC + URLs
declare(strict_types=1);
return [
 'verify_url'=>env('DRM_VERIFY_URL',''),
 'hmac_key'=>env('DRM_HMAC_KEY','arena-drm-hmac-v1'),
 'rsa_public_key'=>env('DRM_RSA_PUBLIC_KEY',''),
 'heartbeat_interval_minutes'=> (int) env('DRM_HEARTBEAT_INTERVAL',5),
 'quarantine_grace_days'=> (int) env('DRM_GRACE_DAYS',7),
 'heartbeat_fail_threshold'=> (int) env('DRM_HEARTBEAT_FAIL_THRESHOLD',576), // 48h/5min
];
