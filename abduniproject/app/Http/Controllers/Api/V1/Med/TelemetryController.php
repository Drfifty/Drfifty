<?php
// TelemetryController — B.7 F-07 — Arena — zero raw enforced by AnonymizedTelemetryMiddleware — HMAC chain
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Med;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\AUMed\TelemetryRequest;
use App\Domain\AUMed\Actions\RecordTelemetryAction;
final class TelemetryController {
 public function audit(TelemetryRequest $req, RecordTelemetryAction $action): JsonResponse {
  $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU MED';
  try{
   $res=$action->execute($req->validated(), $appId);
   return response()->json(['data'=>$res,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId]],201)->header('X-Telemetry-Hashed','1');
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=422;
   return response()->json(['message'=>$e->getMessage()], $c);
  }
 }
}
