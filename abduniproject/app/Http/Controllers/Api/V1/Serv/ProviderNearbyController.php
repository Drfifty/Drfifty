<?php
// ProviderNearbyController — B.7 F-04 — Arena — SPATIAL SRID4326 sub-ms
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Serv;
use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
use App\Http\Requests\AUServ\NearbyProvidersRequest;
use App\Http\Resources\AUServ\ProviderNearbyResource;
final class ProviderNearbyController {
 public function index(NearbyProvidersRequest $req): JsonResponse {
  $v=$req->validated(); $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU SERV';
  $lat=(float)$v['lat']; $lng=(float)$v['lng']; $radius=(int)($v['radius_m']??5000); $limit=(int)($v['limit']??20);
  $cacheKey='serv:nearby:'.hash('sha256', json_encode([$appId,$v], JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'');
  $cached=Cache::get($cacheKey); if($cached) return response()->json(array_merge($cached,['meta'=>array_merge($cached['meta'],['cached'=>true])]),200);
  $dbRoute='primary'; try{ DB::connection('mysql_replica')->table('heartbeat')->value('beat_at'); $dbRoute='replica'; }catch(\Throwable){}
  $conn=$dbRoute==='replica'?'mysql_replica':'mysql';
  $q=DB::connection($conn)->table('service_providers')->where('app_id',$appId)->where('is_active',1);
  if(!empty($v['specialty'])) $q->where('specialty',$v['specialty']);
  $rows=$q->selectRaw("service_providers.*, ST_Distance_Sphere(provider_location, ST_SRID(POINT(?,?),4326)) as distance_m",[$lng,$lat])->having('distance_m','<',$radius)->orderBy('distance_m')->limit($limit)->get();
  $data=array_map(fn($r)=> (new ProviderNearbyResource($r))->toArray($req), $rows->all());
  $payload=['data'=>$data,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId,'db_route'=>$dbRoute,'cached'=>false,'count'=>count($data)]];
  Cache::put($cacheKey,$payload,30);
  return response()->json($payload,200);
 }
}
