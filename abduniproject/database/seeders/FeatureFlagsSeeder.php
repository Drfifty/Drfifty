<?php
// FeatureFlagsSeeder — B.12 F-04 — 5 flags AU BUSINESS is_core=1 — idempotent updateOrInsert — Arena
declare(strict_types=1);
namespace Database\Seeders;
use Illuminate\Database\Seeder; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache;
final class FeatureFlagsSeeder extends Seeder {
 public function run(): void {
  if(!\Illuminate\Support\Facades\Schema::hasTable('feature_flags')) return;
  $flags=[
   ['flag_key'=>'au_business','flag_name'=>'AU BUSINESS','flag_name_ar'=>'إيه يو بيزنس','is_enabled'=>1,'is_core'=>1],
   ['flag_key'=>'au_med','flag_name'=>'AU MED','flag_name_ar'=>'إيه يو ميد','is_enabled'=>1,'is_core'=>0],
   ['flag_key'=>'au_deals','flag_name'=>'AU DEALS','flag_name_ar'=>'إيه يو ديلز','is_enabled'=>1,'is_core'=>0],
   ['flag_key'=>'au_serv','flag_name'=>'AU SERV','flag_name_ar'=>'إيه يو سيرف','is_enabled'=>1,'is_core'=>0],
   ['flag_key'=>'au_invest','flag_name'=>'AU INVEST','flag_name_ar'=>'إيه يو إنفست','is_enabled'=>1,'is_core'=>0],
  ];
  foreach($flags as $f){
   DB::table('feature_flags')->updateOrInsert(['flag_key'=>$f['flag_key']],['flag_name'=>$f['flag_name'],'flag_name_ar'=>$f['flag_name_ar'],'is_enabled'=>$f['is_enabled'],'is_core'=>$f['is_core'],'rollout_percentage'=>100,'updated_at'=>now()]);
  }
  try{ Cache::tags(['feature_flags'])->flush(); }catch(\Throwable){ try{ Cache::forget('feature_flags'); }catch(\Throwable){} }
  try{ DB::table('feature_flags')->where('flag_key','au_lite')->delete(); }catch(\Throwable){}
 }
}
