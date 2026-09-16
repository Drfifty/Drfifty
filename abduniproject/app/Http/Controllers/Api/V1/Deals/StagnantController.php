<?php
// StagnantController — B.7 F-08 — Arena — Agent3 CMO Tri-Hybrid promote
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Deals;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\AUDeals\PromoteRequest;
use App\Domain\AUDeals\Actions\PromoteStagnantAction;
final class StagnantController {
 public function promote(PromoteRequest $req, PromoteStagnantAction $action): JsonResponse {
  $v=$req->validated(); $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU DEALS';
  try{
   $res=$action->execute($v['listing_uuid'],$appId);
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],202)->header('X-Agent-Id','3');
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=409;
   return response()->json(['message'=>$e->getMessage(),'code'=>'PROMOTE_FAILED'], $c);
  }
 }
}
