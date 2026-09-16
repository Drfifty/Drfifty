<?php
// CheckoutController — B.9 F-01/F-07 — Arena — thin buyout|subscription wallet escrow Idempotency
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Workforce;
use Illuminate\Http\JsonResponse; use App\Http\Requests\Workforce\CheckoutRequest;
use App\Domain\Workforce\Actions\CheckoutAction;
final class CheckoutController {
 public function store(CheckoutRequest $req, CheckoutAction $action): JsonResponse {
  $v=$req->validated(); $user=$req->user(); $tenantId=(int)($user->id ?? $user->tenant_id ?? 0);
  $appId= (string)($req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU BUSINESS');
  $idemKey=$req->attributes->get('idempotency_key') ?? $req->header('Idempotency-Key');
  $idemHash=$req->attributes->get('idempotency_hash'); $idemEndpoint=$req->attributes->get('idempotency_endpoint');
  try{
   $res=$action->execute($tenantId,$appId,(int)$v['agent_id'],$v['license_type'],$v['currency'] ?? 'EGP', isset($v['duration_months'])?(int)$v['duration_months']:null, $req->ip()??'0.0.0.0', $idemKey,$idemHash,$idemEndpoint);
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->header('Idempotency-Replayed','false');
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c= $c===429?429: ($c===409?409:422);
   return response()->json(['message'=>$e->getMessage(),'code'=>'WORKFORCE_CHECKOUT_FAILED'], $c);
  }
 }
}
