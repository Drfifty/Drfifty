<?php
// Med ProviderController — B.7 F-07 — Arena — pgsql GIST PostGIS + trust pre-aggregated + 60s cache
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1\Med;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
use App\Http\Resources\AUMed\ProviderResource;
final class ProviderController {
 public function index(Request $req): JsonResponse {
  $appId=$req->attributes->get('app_id') ?? $req->header('X-App-Id') ?? 'AU MED';
  $specialty=$req->query('specialty'); $lat=$req->query('near_lat'); $lng=$req->query('near_lng'); $radius=(int)($req->query('radius_m',5000));
  $cacheKey='med:providers:'.hash('sha256', json_encode([$appId,$specialty,$lat,$lng,$radius], JSON_UNESCAPED_SLASHES)?:'');
  $cached=Cache::get($cacheKey); if($cached) return response()->json(array_merge($cached,['meta'=>array_merge($cached['meta'],['cached'=>true])]),200);
  $pg=DB::connection('pgsql');
  $q=$pg->table('amed_medical_providers')->where('app_id','AU MED');
  if($specialty) $q->where('specialty',$specialty);
  if($lat!==null && $lng!==null) $q->whereRaw("ST_DWithin(clinic_location, ST_SetSRID(ST_MakePoint(?,?),4326)::geography, ?)", [(float)$lng,(float)$lat,$radius]);
  $rows=$q->orderBy('is_verified','desc')->limit(50)->get();
  // enrich trust score from pre-aggregated if exists
  $data=array_map(fn($r)=> (new ProviderResource($r))->toArray($req), $rows->all());
  $payload=['data'=>$data,'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$appId,'cached'=>false,'count'=>count($data)]];
  Cache::put($cacheKey,$payload,60);
  return response()->json($payload,200);
 }
}
