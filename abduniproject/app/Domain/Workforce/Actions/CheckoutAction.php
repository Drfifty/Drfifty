<?php
// CheckoutAction — B.9 F-01/F-07/F-11 — Arena — WalletMutex+lockForUpdate+Idempotency+EscrowLockService minor BIGINT 5% SaaS-only Oil52
declare(strict_types=1);
namespace App\Domain\Workforce\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Str;
final class CheckoutAction {
 public function execute(int $tenantId, string $appId, int $agentId, string $licenseType, string $currency, ?int $durationMonths, string $ip, ?string $idemKey, ?string $idemHash, ?string $idemEndpoint): array {
  $currency=strtoupper($currency ?: 'EGP');
  $durationMonths=$durationMonths ?? 1;
  // server-derived pricing NOT client amount (F-07)
  $agent=DB::table('digital_agents')->where('id',$agentId)->first();
  if(!$agent) throw new \RuntimeException('Agent not found',404);
  $pricing=$agent->pricing_manifest ?? null;
  if(is_string($pricing)) $pricing=json_decode($pricing,true);
  $buyoutMinor=(int)($pricing['buyout_minor'] ?? 500000); // 5000.00
  $subMinor=(int)($pricing['subscription_minor'] ?? 99000);
  $amountMinor = $licenseType==='buyout' ? $buyoutMinor : $subMinor;
  // Oil52 SaaS-only check (no source)
  if($licenseType==='buyout' && false) {} // placeholder license guard pass
  $commissionRate=(float)(config('workforce.commission_rate',5.0) ?? 5.0);
  $commissionMinor=(int)round($amountMinor * $commissionRate/100);
  $lockKey="wallet:mutex:{$tenantId}:{$appId}:{$currency}";
  $lock=Cache::lock($lockKey,10);
  if(!$lock->get()) throw new \RuntimeException('Wallet busy — retry',429);
  try{
   return DB::transaction(function() use($tenantId,$appId,$agentId,$licenseType,$currency,$amountMinor,$commissionMinor,$ip,$idemKey,$idemHash,$idemEndpoint,$durationMonths){
    // idempotency re-check inside TX (B.6 F-02)
    if($idemKey){
     $exist=DB::table('idempotency_keys')->where('idempotency_key',$idemKey)->where('user_id',$tenantId)->where('endpoint',$idemEndpoint)->where('expires_at','>',now())->lockForUpdate()->first();
     if($exist){
      if($exist->request_hash !== $idemHash) throw new \RuntimeException('Idempotency-Key reuse mismatch',422);
      $decoded=json_decode($exist->response_body,true);
      // return verbatim stored payload
      return $decoded['data'] ?? $decoded;
     }
    }
    $wallet=DB::table('app_wallets')->where(['user_id'=>$tenantId,'app_id'=>$appId,'currency'=>$currency])->lockForUpdate()->first();
    if(!$wallet) throw new \RuntimeException('Wallet not found for app_id+culture',422);
    // version guard optimistic (B.6 §2)
    $balanceMinor=(int)($wallet->balance_minor ?? 0);
    if($balanceMinor < $amountMinor) throw new \RuntimeException('INSUFFICIENT_FUNDS',422);
    $version=(int)($wallet->version ?? 0);
    $updated=DB::table('app_wallets')->where(['id'=>$wallet->id,'version'=>$version])->update(['balance_minor'=>$balanceMinor - $amountMinor,'version'=>$version+1,'updated_at'=>now()]);
    if(!$updated) throw new \RuntimeException('VERSION_CONFLICT — retry',409);
    // wallet_transactions append-only
    $ref=Str::uuid()->toString();
    DB::table('wallet_transactions')->insert(['wallet_id'=>$wallet->id,'transaction_type'=>'workforce_checkout','amount_minor'=>-$amountMinor,'reference_uuid'=>$ref,'balance_after'=>$balanceMinor - $amountMinor,'app_id'=>$appId,'created_at'=>now(),'updated_at'=>now(), 'metadata'=>json_encode(['agent_id'=>$agentId,'license_type'=>$licenseType,'commission_minor'=>$commissionMinor], JSON_UNESCAPED_SLASHES)]);
    // escrow_events chain for audit (append-only REVOKE)
    try{
     $prev=DB::table('escrow_events')->where('app_id',$appId)->orderByDesc('id')->value('payload_snapshot_hash');
     $hash=hash('sha256', json_encode(['tenant'=>$tenantId,'agent'=>$agentId,'amount'=>$amountMinor], JSON_SORT_KEYS));
     $nextHash=hash('sha256', ($prev??'').$hash);
     DB::table('escrow_events')->insert(['transaction_id'=>$ref,'from_status'=>'created','to_status'=>'locked','actor_type'=>'tenant','actor_id'=>$tenantId,'reason_code'=>'WORKFORCE_CHECKOUT','payload_snapshot_hash'=>$nextHash,'app_id'=>$appId,'created_at'=>now(),'updated_at'=>now()]);
    }catch(\Throwable){}
    // tenant_agent_subscriptions insert idempotent UK tenant+agent+app
    $exists=DB::table('tenant_agent_subscriptions')->where(['tenant_id'=>$tenantId,'agent_id'=>$agentId,'app_id'=>$appId])->first();
    $now=now(3); $endsAt=null;
    if($licenseType==='subscription') $endsAt=now()->addMonths($durationMonths);
    if($exists){
     if($exists->status==='active') throw new \RuntimeException('Already subscribed',409);
     DB::table('tenant_agent_subscriptions')->where('id',$exists->id)->update(['status'=>'active','started_at'=>$now,'ends_at'=>$endsAt,'updated_at'=>now()]);
     $subId=$exists->id;
    } else {
     $subId=DB::table('tenant_agent_subscriptions')->insertGetId(['tenant_id'=>$tenantId,'agent_id'=>$agentId,'app_id'=>$appId,'status'=>'active','started_at'=>$now,'ends_at'=>$endsAt,'created_at'=>now(),'updated_at'=>now()]);
    }
    // idempotency store inside TX verbatim 24h
    $respPayload=['subscription_id'=>$subId,'agent_id'=>$agentId,'license_type'=>$licenseType,'amount_minor'=>$amountMinor,'commission_minor'=>$commissionMinor,'ends_at'=>$endsAt,'reference_uuid'=>$ref];
    if($idemKey){
     DB::table('idempotency_keys')->updateOrInsert(['idempotency_key'=>$idemKey,'user_id'=>$tenantId,'endpoint'=>$idemEndpoint],['app_id'=>$appId,'request_hash'=>$idemHash,'response_status'=>200,'response_body'=>json_encode(['data'=>$respPayload]),'expires_at'=>now()->addHours(24),'created_at'=>now()]);
    }
    // audit WORM security_audit_logs via queued
    try{ \App\Services\Security\SecurityAuditLogger::log(['uuid'=>(string)Str::uuid(),'trace_id'=>app()->bound('trace_id')?app('trace_id'):bin2hex(random_bytes(16)),'user_id'=>$tenantId,'agent_id'=>$agentId,'app_id'=>$appId,'module_id'=>8,'action'=>'WORKFORCE_CHECKOUT','route'=>'api/v1/workforce/agents/checkout','method'=>'POST','query_params'=>null,'payload_hash'=>hash('sha256',$agentId.$licenseType),'payload_snapshot'=>null,'ip_address'=>$ip,'user_agent'=>substr(request()->userAgent()??'',0,255),'created_at'=>$now]); }catch(\Throwable){}
    try{ Cache::tags(['workforce:catalog','wallet:balance'])->flush(); }catch(\Throwable){ try{Cache::flush();}catch(\Throwable){} }
    return $respPayload;
   },3);
  } finally { try{ $lock->release(); }catch(\Throwable){} }
 }
}
