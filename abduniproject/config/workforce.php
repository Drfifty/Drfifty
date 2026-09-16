<?php
// workforce — Arena B.9 F-16 — env wrapper no hardcode
declare(strict_types=1);
return [
 'commission_rate' => (float) env('WORKFORCE_COMMISSION_RATE', 5.0),
 'subscription_grace_hours' => (int) env('WORKFORCE_SUBSCRIPTION_GRACE_HOURS', 12),
 'catalog_cache_ttl' => (int) env('WORKFORCE_CATALOG_CACHE_TTL', 60),
 'dispatch_throttle_per_min' => (int) env('WORKFORCE_DISPATCH_THROTTLE', 30),
];
