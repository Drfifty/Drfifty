<?php
// RegexDataLeakPatternsSeeder — B.12 F-05 — 8 ReDoS-safe patterns idempotent — Arena
declare(strict_types=1);
namespace Database\Seeders;
use Illuminate\Database\Seeder; use Illuminate\Support\Facades\DB;
final class RegexDataLeakPatternsSeeder extends Seeder {
 public function run(): void {
  if(!\Illuminate\Support\Facades\Schema::hasTable('data_leak_patterns')) return;
  $patterns=[
   ['regex'=>'(?:\\+20|0020|0)?1[0-2,5]{1}[0-9]{8}','action'=>'REDACT','label'=>'phone_eg','priority'=>10],
   ['regex'=>'\\+[0-9]{7,15}','action'=>'REDACT','label'=>'phone_intl','priority'=>11],
   ['regex'=>'(?:\\d[\\s\\-\\.]){7,}\\d','action'=>'REDACT','label'=>'obfuscated_phone','priority'=>12],
   ['regex'=>'[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}','action'=>'REDACT','label'=>'email','priority'=>20],
   ['regex'=>'https?:\\/\\/[^\\s]+|www\\.[^\\s]+','action'=>'BLOCK','label'=>'url','priority'=>30],
   ['regex'=>'wa\\.me\\/[^\\s]+|whatsapp[^\\s]*','action'=>'BLOCK','label'=>'whatsapp','priority'=>31],
   ['regex'=>'t\\.me\\/[^\\s]+|telegram[^\\s]*','action'=>'BLOCK','label'=>'telegram','priority'=>32],
   ['regex'=>'@[a-zA-Z0-9_\\.]{3,}','action'=>'WARN','label'=>'social_handle','priority'=>90],
  ];
  foreach($patterns as $p){
   if(!DB::table('data_leak_patterns')->where('label',$p['label'])->exists()){
    DB::table('data_leak_patterns')->insert(['regex_pattern'=>$p['regex'],'action'=>$p['action'],'label'=>$p['label'],'priority'=>$p['priority'],'is_active'=>1,'is_strict_post_escrow_only'=>0,'created_at'=>now(),'updated_at'=>now()]);
   }
  }
 }
}
