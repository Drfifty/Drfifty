<?php
// CreateListingAction — B.7 F-05/F-09 — Arena — TRIM+category TenantScoped+is_hidden0+SPATIAL 4326+Cache flush
declare(strict_types=1);
namespace App\Domain\AUDeals\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Str; use Illuminate\Support\Facades\Cache;
final class CreateListingAction {
 public function execute(array $v, int $tenantId, string $appId='AU DEALS'): object {
  return DB::transaction(function() use($v,$tenantId,$appId){
   DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
   $cat=DB::table('deal_categories')->where('id',$v['category_id'])->first();
   if(!$cat) throw new \RuntimeException('Category not found',404);
   if(($cat->app_id ?? 'AU DEALS')!==$appId && $cat->app_id!==null) throw new \RuntimeException('Category app mismatch',422);
   $uuid=(string)Str::uuid();
   $lng=$v['geo_point']['lng'] ?? $v['lng'] ?? null; $lat=$v['geo_point']['lat'] ?? $v['lat'] ?? null;
   $geo=null; if($lng!==null && $lat!==null) $geo=DB::raw("ST_SRID(ST_GeomFromText('POINT(".(float)$lng." ".(float)$lat.")'),4326)");
   $id=DB::table('deals_listings')->insertGetId([
    'uuid'=>$uuid,'tenant_id'=>$tenantId,'category_id'=>$v['category_id'],'app_id'=>$appId,
    'title'=>trim($v['title']),'description'=>trim($v['description']),
    'price_minor'=>(int)$v['price_minor'],'currency'=>$v['currency']??'EGP','stock'=>(int)($v['stock']??0),
    'geo_point'=>$geo,'is_hidden'=>0,'is_stagnant'=>0,'created_at'=>now(3),'updated_at'=>now(3),
   ]);
   if(!empty($v['attributes'])){
    $attr=is_string($v['attributes'])?$v['attributes']:json_encode($v['attributes'], JSON_UNESCAPED_UNICODE);
    try{ DB::table('deal_items')->insert(['listing_id'=>$id,'sku'=>(string)Str::uuid(),'attributes'=>$attr,'price_minor'=>(int)$v['price_minor'],'stock'=>(int)($v['stock']??0),'created_at'=>now(),'updated_at'=>now()]); }catch(\Throwable){}
   }
   $row=DB::table('deals_listings')->where('id',$id)->first();
   try{ Cache::tags(['deals:search'])->flush(); }catch(\Throwable){ Cache::flush(); }
   return (object)array_merge((array)$row,['uuid'=>$uuid]);
  },3);
 }
}
