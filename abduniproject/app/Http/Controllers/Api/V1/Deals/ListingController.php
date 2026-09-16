<?php
// ListingController — B.7 F-05/F-09/F-11 — Arena — thin search ngram + nearby + category filter + replica+cache
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Deals;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
use App\Http\Requests\AUDeals\{CreateListingRequest,SearchRequest};
use App\Http\Resources\AUDeals\DealsListingResource;
use App\Domain\AUDeals\Actions\CreateListingAction;
final class ListingController {
 public function index(SearchRequest $req): JsonResponse {
  $v=$req->validated(); $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU DEALS';
  $cacheKey='deals:search:'.hash('sha256', json_encode([$appId,$v], JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS)?:'');
  $cached=Cache::tags(['deals:search'])->get($cacheKey) ?? Cache::get($cacheKey);
  if($cached) return response()->json(array_merge($cached,['meta'=>array_merge($cached['meta'],['cached'=>true])]),200);
  $dbRoute='primary'; try{ DB::connection('mysql_replica')->table('heartbeat')->value('beat_at'); $dbRoute='replica'; }catch(\Throwable){}
  $conn=$dbRoute==='replica'?'mysql_replica':'mysql';
  $q=DB::connection($conn)->table('deals_listings')->where('app_id',$appId)->where('is_hidden',0);
  if(!empty($v['search'])) $q->whereRaw("MATCH(title,description) AGAINST(? IN BOOLEAN MODE)", [$v['search']]);
  if(!empty($v['category_id'])) $q->where('category_id',$v['category_id']);
  if(isset($v['price_min_minor'])) $q->where('price_minor','>=',(int)$v['price_min_minor']);
  if(isset($v['price_max_minor'])) $q->where('price_minor','<=',(int)$v['price_max_minor']);
  $hasGeo=!empty($v['near_lng']) && !empty($v['near_lat']);
  if($hasGeo){
   $lng=(float)$v['near_lng']; $lat=(float)$v['near_lat']; $rad=(int)($v['radius_m']??5000);
   $q->selectRaw("deals_listings.*, ST_Distance_Sphere(geo_point, ST_SRID(POINT(?,?),4326)) as distance_m",[$lng,$lat])->having('distance_m','<',$rad)->orderBy('distance_m');
  }
  $per=(int)($v['per_page']??20); $page=(int)($v['page']??1);
  $total=(clone $q)->count();
  $rows=(clone $q)->forPage($page,$per)->get();
  $data=array_map(fn($r)=> (new DealsListingResource($r))->toArray($req), $rows->all());
  $payload=['data'=>$data,'links'=>['page'=>$page,'per_page'=>$per,'total'=>$total],'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId,'db_route'=>$dbRoute,'cached'=>false]];
  try{ Cache::tags(['deals:search'])->put($cacheKey,$payload,60); }catch(\Throwable){ Cache::put($cacheKey,$payload,60); }
  return response()->json($payload,200);
 }
 public function show(Request $req, string $uuid): JsonResponse {
  $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU DEALS';
  $row=DB::table('deals_listings')->where('uuid',$uuid)->where('app_id',$appId)->first();
  if(!$row) return response()->json(['message'=>'Not found','code'=>'NOT_FOUND'],404);
  return response()->json(['data'=>new DealsListingResource($row),'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200);
 }
 public function store(CreateListingRequest $req, CreateListingAction $action): JsonResponse {
  $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU DEALS';
  $uid=$req->attributes->get('jwt_payload')['sub'] ?? $req->user()?->id ?? 0;
  $row=$action->execute($req->validated(), (int)$uid, $appId);
  return response()->json(['data'=>new DealsListingResource($row),'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],201);
 }
}
