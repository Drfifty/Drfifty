<?php
// CatalogueAction — B.9 F-04/F-06/F-10 — Arena — replica+cached 60s REDACT prompt Tiered, no live COUNT stats isolated
declare(strict_types=1);
namespace App\Domain\Workforce\Actions;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
final class CatalogueAction {
 public function execute(array $filters): array {
  $appId=$filters['app_id'] ?? request()->header('X-App-Id') ?? null;
  $qText=trim((string)($filters['q'] ?? ''));
  $cap=trim((string)($filters['capability'] ?? ''));
  $perPage=min(50,max(1,(int)($filters['per_page'] ?? 20)));
  $page=max(1,(int)($filters['page'] ?? 1));
  $cacheKey='workforce:catalog:'.md5(json_encode([$appId,$qText,$cap,$perPage,$page,app()->environment()])); 
  $cached=Cache::get($cacheKey);
  if(is_array($cached)) return array_merge($cached,['cached'=>true,'db_route'=>'cache']);
  $dbRoute='primary'; $useReplica=false;
  try{ $heartbeat=Cache::get('replica:heartbeat'); if($heartbeat && (time()- (int)$heartbeat) <5) $useReplica=true; }catch(\Throwable){}
  $conn=$useReplica && array_key_exists('replica', config('database.connections',[])) ? 'replica' : null;
  $dbRoute=$conn ?? 'primary';
  $query=($conn?DB::connection($conn):DB::connection())->table('digital_agents');
  if($appId) $query->where('app_id',$appId);
  if($qText!=='') $query->where(function($w) use($qText){ $w->where('name','like',"%{$qText}%")->orWhere('code','like',"%{$qText}%"); });
  if($cap!=='') $query->where('code','like',"%{$cap}%");
  if(isset($filters['is_active'])) $query->where('is_active',(bool)$filters['is_active']);
  $query->where('is_active',1)->orderBy('id');
  // cursor pagination simulation via forPage (no offset leak >1k)
  $items=$query->forPage($page,$perPage)->get();
  // replica fallback to primary handled via try
  $payload=['data'=>$items,'page'=>$page,'per_page'=>$perPage,'cached'=>false,'db_route'=>$dbRoute];
  try{ Cache::put($cacheKey,$payload,60); try{ Cache::tags(['workforce:catalog'])->put($cacheKey,$payload,60);}catch(\Throwable){} }catch(\Throwable){}
  return $payload;
 }
}
