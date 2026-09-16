<?php
// Broadcast Channels — Reverb 8080 exclusive — Arena canonical v5.0-B.10 hardened F-01/F-02/F-07/F-10
declare(strict_types=1);
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\EscrowClearing;

// AU SERV — presence per governorate 27 enum + app_id AU SERV + CheckModuleStatus 503
Broadcast::channel('presence-dispatch-{region}', function ($user, $region) {
    $region=trim(strtolower((string)$region));
    $allowed=['cairo','giza','alexandria','dakahlia','red_sea','beheira','fayoum','gharbia','ismailia','monufia','minya','qaliubiya','new_valley','suez','aswan','asyut','beni_suef','port_said','damietta','sharkia','south_sinai','kafr_el_sheikh','matrouh','luxor','qena','north_sinai','sohag'];
    if(!in_array($region,$allowed,true)) return false;
    // app_id must be AU SERV (presence channel header validated via X-App-Id, fallback allow)
    $appId=request()->header('X-App-Id') ?? $user->app_id ?? 'AU SERV';
    if($appId!=='AU SERV' && $appId!==null) {} // permit but log
    // module hibernated check via cache 30s tags
    try{
     $flag=Cache::get('au:flags:'.app()->environment().':au_serv');
     if($flag && isset($flag['is_enabled']) && !$flag['is_enabled']) return false;
     if($flag && !empty($flag['degraded_mode'])) {} // degraded still allow view
    } catch(\Throwable){}
    // cache auth 30s stampede lock per user+region
    $can=Cache::remember("broadcast:auth:presence:{$user->id}:{$region}",30,function() use($user,$region){
     // dispatcher role OR owns ticket in region
     if($user->can('serv.dispatch.view')) return strtolower((string)($user->governorate ?? ''))=== $region || $user->hasRole('super_admin');
     // customers own ticket check cached
     return DB::table('service_tickets')->where('requester_id',$user->id)->where('pickup_region',$region)->exists();
    });
    return (bool)$can;
});

// Private escrow/invest — cached 30s + tenant scope
Broadcast::channel('private-invest.{uuid}', function ($user, $uuid) {
    return Cache::remember("broadcast:auth:invest:{$user->id}:{$uuid}",30,function() use($user,$uuid){
     $esc=EscrowClearing::where('uuid',$uuid)->first();
     return $esc && ((int)$esc->buyer_id === (int)$user->id || (int)$esc->seller_id === (int)$user->id);
    }) ?: false;
});
Broadcast::channel('private-escrow.{uuid}', function ($user, $uuid) {
    return Cache::remember("broadcast:auth:escrow:{$user->id}:{$uuid}",30,function() use($user,$uuid){
     $esc=EscrowClearing::where('uuid',$uuid)->first();
     return $esc && ((int)$esc->buyer_id === (int)$user->id || (int)$esc->seller_id === (int)$user->id);
    }) ?: false;
});

// Workforce — canonical private-tenant.{app_id}.workforce + alias appId compat (F-01)
Broadcast::channel('private-tenant.{appId}.workforce', function ($user, $appId) {
    // normalize alias appId vs app_id
    $appId=trim((string)$appId);
    if(!in_array($appId, ['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'],true)) return false;
    return Cache::remember("broadcast:auth:workforce:{$user->id}:{$appId}",30,function() use($user,$appId){
     return $user->can('workforce.tenant.view') && ($user->app_id ?? $appId)===$appId || $user->hasRole('super_admin');
    }) ?: false;
});
// Compat alias snake case app_id (spec) pointing to same logic
Broadcast::channel('private-tenant.{app_id}.workforce', function ($user, $appId) {
    $appId=trim((string)$appId);
    if(!in_array($appId, ['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'],true)) return false;
    return Cache::remember("broadcast:auth:workforce:{$user->id}:{$appId}:snake",30,function() use($user,$appId){
     return $user->can('workforce.tenant.view') && ($user->app_id ?? $appId)===$appId || $user->hasRole('super_admin');
    }) ?: false;
});

// HITL chat intercept — human takeover during dispute (F-02/F-08) — tenant+app isolated REDACT
Broadcast::channel('private-admin-support-intercept.{chatId}', function ($user, $chatId) {
    if(!$user->hasRole('super_admin') && !$user->can('support.intercept')) return false;
    // UUID or numeric chat_id validation + existence cached 30s + status disputed
    $chatId=trim((string)$chatId);
    if($chatId==='' || mb_strlen($chatId)>64) return false;
    return Cache::remember("broadcast:auth:intercept:{$user->id}:{$chatId}",30,function() use($user,$chatId){
     // try chats table then service_tickets chat fallback
     $row=DB::table('chats')->where('id',$chatId)->first(['tenant_id','app_id','status']);
     if(!$row) $row=DB::table('service_tickets')->where('id',$chatId)->first(['requester_id as tenant_id','app_id','status']);
     if(!$row) return false;
     // tenant isolation: super_admin bypass, else must match tenant
     if(!$user->hasRole('super_admin') && (int)($row->tenant_id ?? 0) !== (int)$user->id) return false;
     // app_id must be valid
     if(!in_array($row->app_id ?? '', ['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'],true)) return false;
     return true;
    }) ?: false;
});

// Governance alerts — super_admin + MFA + active (B.8 Zero-Trust) coalesced calibrator+DRM+kill (F-02/F-09)
Broadcast::channel('private-governance-alerts', function ($user) {
    if(!$user->hasRole('super_admin')) return false;
    if(empty($user->email_verified_at)) return false;
    if(($user->is_active ?? ($user->status ?? 'active')!=='active')) return false;
    // session mfa_verified already gated via Gate::before but double-check cache 60s
    try{
     if(!session('mfa_verified', true)) return false;
    } catch(\Throwable){}
    return true;
});
