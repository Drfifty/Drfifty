<?php
// AppointmentController — B.7 F-07 — Arena — pgsql encrypted pgsql+PGCRYPTO_KEY accessor never returns raw
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Med;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\AUMed\BookAppointmentRequest;
use App\Http\Resources\AUMed\AppointmentResource;
use App\Domain\AUMed\Actions\BookAppointmentAction;
final class AppointmentController {
 public function store(BookAppointmentRequest $req, BookAppointmentAction $action): JsonResponse {
  $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU MED';
  $uid=$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? 0;
  try{
   $row=$action->execute($req->validated(), (int)$uid, $appId);
   return response()->json(['data'=>new AppointmentResource($row),'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId]],201);
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=422;
   return response()->json(['message'=>$e->getMessage()], $c);
  }
 }
}
