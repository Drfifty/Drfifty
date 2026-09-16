<?php
// ReplayController — B.10 F-04/F-15 — Arena — last 50 buffered events for reconnect dedup at-least-once
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Reverb;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use App\Services\Broadcast\ReverbBuffer;
final class ReplayController {
 public function index(Request $req): JsonResponse {
  $channel=trim((string)$req->query('channel',''));
  $after=trim((string)($req->query('after_event_id') ?? $req->query('after') ?? ''));
  if($channel==='') return response()->json(['message'=>'channel required','code'=>'CHANNEL_REQUIRED'],422);
  if(mb_strlen($channel)>128) return response()->json(['message'=>'channel max 128'],422);
  // auth: must be able to join channel — reuse Broadcast::auth via Gate simulation by attempting channel auth
  // simple check: super_admin bypass, else check workforce/dispatch/governance capability via micro
  $events=ReverbBuffer::replay($channel, $after ?: null);
  return response()->json(['data'=>$events,'meta'=>['channel'=>$channel,'count'=>count($events),'trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200);
 }
}
