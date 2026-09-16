<?php
// Broadcast Channels — Reverb 8080 exclusive — Arena canonical
declare(strict_types=1);
use App\Models\EscrowClearing;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('presence-dispatch-{region}', function ($user, $region) {
    return $user->can('serv.dispatch.view') && strtolower($user->governorate ?? '') === strtolower($region);
});
Broadcast::channel('private-invest.{uuid}', function ($user, $uuid) {
    $esc = EscrowClearing::where('uuid', $uuid)->first();
    return $esc && ((int)$esc->buyer_id === (int)$user->id || (int)$esc->seller_id === (int)$user->id);
});
Broadcast::channel('private-escrow.{uuid}', function ($user, $uuid) {
    $esc = EscrowClearing::where('uuid', $uuid)->first();
    return $esc && ((int)$esc->buyer_id === (int)$user->id || (int)$esc->seller_id === (int)$user->id);
});
// Workforce — per-tenant private stream — Arena (app_id isolation)
Broadcast::channel('private-tenant.{appId}.workforce', function ($user, $appId) {
    return in_array($appId, ['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST']) && $user->can('workforce.tenant.view');
});
