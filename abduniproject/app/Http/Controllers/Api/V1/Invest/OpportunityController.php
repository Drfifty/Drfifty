<?php
// OpportunityController — B.7 F-06/F-11 — Arena — replica + Cache tags 60s + eager ≤5
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Invest;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
use App\Http\Requests\AUInvest\OpportunitiesRequest;
use App\Http\Resources\AUInvest\OpportunityResource;
final class OpportunityController {
 public function index(OpportunitiesRequest $req): JsonResponse {
  $v=$req->validated(); $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU INVEST';
  $cacheKey='invest:opp:'.hash('sha256', json_encode([$appId,$v], JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'');
  $cached=Cache::tags(['invest:opp'])->get($cacheKey) ?? Cache::get($cacheKey);
  if($cached) return response()->json(array_merge($cached,['meta'=>array_merge($cached['meta'],['cached'=>true])]),200);
  $dbRoute='primary'; try{ DB::connection('mysql_replica')->table('heartbeat')->value('beat_at'); $dbRoute='replica'; }catch(\Throwable){}
  $conn=$dbRoute==='replica'?'mysql_replica':'mysql';
  $q=DB::connection($conn)->table('investment_deals')->where('app_id',$appId);
  if(!empty($v['status'])) $q->where('status',$v['status']); else $q->whereIn('status',['funding','funded']);
  if(isset($v['min_target_minor'])) $q->where('funding_target_minor','>=',(int)$v['min_target_minor']);
  $per=(int)($v['per_page']??20); $page=(int)($v['page']??1);
  $total=(clone $q)->count();
  $rows=(clone $q)->orderByDesc('created_at')->forPage($page,$per)->get();
  $data=array_map(fn($r)=> (new OpportunityResource($r))->toArray($req), $rows->all());
  $payload=['data'=>$data,'links'=>['page'=>$page,'per_page'=>$per,'total'=>$total],'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId,'db_route'=>$dbRoute,'cached'=>false]];
  try{ Cache::tags(['invest:opp'])->put($cacheKey,$payload,60); }catch(\Throwable){ Cache::put($cacheKey,$payload,60); }
  return response()->json($payload,200);
 }
}
