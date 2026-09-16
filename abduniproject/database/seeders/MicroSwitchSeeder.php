<?php
// MicroSwitchSeeder — B.12 F-03 — 13×9×caps exhaustive SubCapabilityKey — 9 Modules not 15 — idempotent — Arena
declare(strict_types=1);
namespace Database\Seeders;
use Illuminate\Database\Seeder; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
final class MicroSwitchSeeder extends Seeder {
 public function run(): void {
  if(!\Illuminate\Support\Facades\Schema::hasTable('micro_switch_matrix')) return;
  // minimal curated caps covering 5 Apps — avoids enum drift — exhaustive via SubCapabilityKey if exists
  $caps=[
   ['key'=>'deals.create','module'=>4,'app'=>'AU DEALS'],['key'=>'deals.promote','module'=>4,'app'=>'AU DEALS'],
   ['key'=>'serv.ticket.create','module'=>5,'app'=>'AU SERV'],['key'=>'serv.provider.view','module'=>5,'app'=>'AU SERV'],
   ['key'=>'invest.fractional.issue','module'=>6,'app'=>'AU INVEST'],['key'=>'invest.pledge.create','module'=>6,'app'=>'AU INVEST'],
   ['key'=>'med.appointment.create','module'=>3,'app'=>'AU MED'],['key'=>'med.telemetry.create','module'=>3,'app'=>'AU MED'],
   ['key'=>'workforce.catalog.view','module'=>8,'app'=>'AU BUSINESS'],['key'=>'workforce.checkout','module'=>8,'app'=>'AU BUSINESS'],['key'=>'workforce.dispatch','module'=>8,'app'=>'AU BUSINESS'],
   ['key'=>'governance.micro.toggle','module'=>9,'app'=>'AU BUSINESS'],['key'=>'governance.drm.annihilate','module'=>9,'app'=>'AU BUSINESS'],['key'=>'calibrator.preop','module'=>9,'app'=>'AU BUSINESS'],
  ];
  // expand SubCapabilityKey enum if available
  try{ if(enum_exists(\App\Domain\Governance\Enums\SubCapabilityKey::class)){ foreach(\App\Domain\Governance\Enums\SubCapabilityKey::cases() as $c){ $caps[]=['key'=>$c->value,'module'=>9,'app'=>'AU BUSINESS']; } $caps=array_unique($caps,SORT_REGULAR);} }catch(\Throwable){}
  $superAdmin=DB::table('users')->where('email', env('SUPERADMIN_EMAIL','superadmin@abduni.com'))->value('id');
  foreach(range(1,13) as $agentId){
   foreach($caps as $cap){
    $exists=DB::table('micro_switch_matrix')->where(['agent_id'=>$agentId,'app_id'=>$cap['app'],'module_id'=>$cap['module'],'sub_capability_key'=>$cap['key']])->exists();
    if(!$exists){
     DB::table('micro_switch_matrix')->insert(['agent_id'=>$agentId,'app_id'=>$cap['app'],'module_id'=>$cap['module'],'sub_capability_key'=>$cap['key'],'is_enabled'=>1,'approval_required'=>0,'preferred_driver'=>'deterministic','llm_fallback_enabled'=>1,'granted_by'=>$superAdmin,'reason'=>'B.12 seed canonical 9 modules','created_at'=>now(),'updated_at'=>now()]);
    }
   }
  }
  try{ Cache::tags(['micro_perm'])->flush(); }catch(\Throwable){}
 }
}
