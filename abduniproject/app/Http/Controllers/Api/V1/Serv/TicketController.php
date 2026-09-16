<?php
// TicketController — B.7 F-03/F-04 — Arena — thin dispatch via Action + Mutex
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Serv;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\AUServ\CreateTicketRequest;
use App\Domain\AUServ\Actions\DispatchTicketAction;
final class TicketController {
 public function store(CreateTicketRequest $req, DispatchTicketAction $action): JsonResponse {
  $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU SERV';
  $uid=$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? 0;
  try{
   $row=$action->execute($req->validated(), (int)$uid, $appId);
   return response()->json(['data'=>['uuid'=>$row->uuid ?? null,'provider_id'=>$row->provider_id ?? null,'status'=>$row->status ?? 'requested'],'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId]],201);
  }catch(\RuntimeException $e){
   $c=$e->getCode(); if($c<400||$c>=600) $c=422;
   return response()->json(['message'=>$e->getMessage()], $c);
  }
 }
}
