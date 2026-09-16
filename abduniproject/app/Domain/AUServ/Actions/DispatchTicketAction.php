<?php
// DispatchTicketAction — B.7 F-03/F-04 — Arena — POINT 4326 + distance_m + Mutex + escrow optional
declare(strict_types=1);
namespace App\Domain\AUServ\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Str; use Illuminate\Support\Facades\Cache;
final class DispatchTicketAction {
 public function execute(array $v, int $requesterId, string $appId='AU SERV'): object {
  return DB::transaction(function() use($v,$requesterId,$appId){
   DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
   $lock=Cache::lock('ticket:create:'.$requesterId,5);
   try{ $lock->block(3); }catch(\Throwable){}
   $uuid=(string)Str::uuid();
   $pickup=DB::raw("ST_SRID(ST_GeomFromText('POINT(".(float)$v['pickup_lng']." ".(float)$v['pickup_lat'].")'),4326)");
   $id=DB::table('service_tickets')->insertGetId([
    'uuid'=>$uuid,'requester_id'=>$requesterId,'provider_id'=>null,'app_id'=>$appId,
    'title'=>trim($v['title']),'status'=>'requested','pickup_point'=>$pickup,'created_at'=>now(3),'updated_at'=>now(3),
   ]);
   // find nearest active providers scopeWithinRadius F-04
   $near=DB::table('service_providers')->selectRaw("id, ST_Distance_Sphere(provider_location, ST_SRID(POINT(?,?),4326)) as distance_m",[(float)$v['pickup_lng'],(float)$v['pickup_lat']])->where('is_active',1)->where('app_id',$appId)->having('distance_m','<',5000)->orderBy('distance_m')->limit(5)->get();
   $pid=null; $dist=null;
   if($near->isNotEmpty()){ $pid=$near[0]->id; $dist=(int)$near[0]->distance_m; DB::table('service_tickets')->where('id',$id)->update(['provider_id'=>$pid,'status'=>'assigned']); DB::table('dispatch_logs')->insert(['ticket_id'=>$id,'provider_id'=>$pid,'app_id'=>$appId,'dispatched_at'=>now(3),'distance_m'=>$dist,'created_at'=>now(3)]); }
   try{$lock->release();}catch(\Throwable){}
   return DB::table('service_tickets')->where('id',$id)->first();
  },3);
 }
}
