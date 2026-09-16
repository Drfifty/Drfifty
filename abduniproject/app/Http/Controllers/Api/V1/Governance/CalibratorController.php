<?php
// CalibratorController — B.8 F-06/F-09 — Arena — thin ≤60L health-score cache 10s + pre-op <15ms zero DB
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Governance;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse;
use App\Domain\Governance\Actions\CalibratorHealthAction;
use App\Http\Resources\Governance\HealthScoreResource;
final class CalibratorController {
 public function healthScore(Request $req, CalibratorHealthAction $action): JsonResponse {
  $data=$action->execute();
  $res=new HealthScoreResource($data);
  return response()->json($res,200)->header('Cache-Control','max-age=10, public')->header('X-Cache',$data['cached']?'HIT':'MISS')->header('X-DB-Route',$data['db_route'] ?? 'primary');
 }
 public function preOp(Request $req): JsonResponse {
  $t0=microtime(true);
  $cached=\Illuminate\Support\Facades\Cache::get('calibrator:health') ?? ['health_pct'=>100,'status'=>'healthy'];
  $score=(int)($cached['health_pct'] ?? 100);
  // self-healing evaluate deterministic only, no DB, via cache snapshot
  if($score<90){
   try{ $ev = new \App\Events\AgentConfidenceEvaluated(agentId:0, confidence:(float)$score, reasonCode:'calibrator_preop', traceId: app()->bound('trace_id')?app('trace_id'):bin2hex(random_bytes(4)), durationMs:0, costUsd:0.0); app(\App\Services\Calibrator\CalibratorSelfHealingEngine::class)->evaluate($ev); }catch(\Throwable){}
  }
  $elapsed=(microtime(true)-$t0)*1000;
  return response()->json(['data'=>['allowed'=>true,'health_pct'=>$score,'elapsed_ms'=>round($elapsed,2)],'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'cached'=> $cached['cached'] ?? (bool)\Illuminate\Support\Facades\Cache::has('calibrator:health')]],200)->header('X-PreOp-Elapsed-Ms',(string)round($elapsed,2));
 }
}
