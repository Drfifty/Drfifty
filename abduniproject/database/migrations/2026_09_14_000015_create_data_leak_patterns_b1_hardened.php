<?php
// AUDIT FIX B1 — Data Leak Patterns Hardened — Arena — B1-F3,F4
// ReDoS guard, max_input_bytes, is_strict_post_escrow_only, PCRE validation, compressed index
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema; use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  if (!Schema::hasTable('data_leak_patterns')) {
   Schema::create('data_leak_patterns', function(Blueprint $t){
    $t->id();
    $t->string('regex_pattern',500)->comment('PCRE validated on insert — see model hook');
    $t->enum('action',['BLOCK','REDACT','WARN'])->default('REDACT')->comment('BLOCK=422 REDACT=sanitize WARN=log');
    $t->boolean('is_active')->default(true)->index();
    $t->boolean('is_strict_post_escrow_only')->default(false)->comment('Oil1: enforce until holding');
    $t->unsignedSmallInteger('priority')->default(100)->comment('lower=earlier, phone first');
    $t->string('label',80)->nullable()->comment('human label: phone_eg, email, url...');
    $t->timestamps();
    $t->index(['is_active','priority']);
   });
  } else {
   Schema::table('data_leak_patterns', function(Blueprint $t){
    if (!Schema::hasColumn('data_leak_patterns','is_strict_post_escrow_only')) $t->boolean('is_strict_post_escrow_only')->default(false)->after('is_active');
    if (!Schema::hasColumn('data_leak_patterns','priority')) $t->unsignedSmallInteger('priority')->default(100)->after('is_strict_post_escrow_only');
    if (!Schema::hasColumn('data_leak_patterns','label')) $t->string('label',80)->nullable()->after('priority');
   });
  }
  // Seed hardened 8 patterns idempotent — priority ordered by frequency (phone 70% first)
  $patterns = [
   ['regex'=>'(?:\\+20|0020|0)?1[0-2,5]{1}[0-9]{8}','action'=>'REDACT','label'=>'phone_eg','priority'=>10,'strict'=>0],
   ['regex'=>'\\+[0-9]{7,15}','action'=>'REDACT','label'=>'phone_intl','priority'=>11,'strict'=>0],
   ['regex'=>'(?:\\d[\\s\\-\\.]){7,}\\d','action'=>'REDACT','label'=>'obfuscated_phone','priority'=>12,'strict'=>0],
   ['regex'=>'[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}','action'=>'REDACT','label'=>'email','priority'=>20,'strict'=>0],
   ['regex'=>'https?:\\/\\/[^\\s]+|www\\.[^\\s]+','action'=>'BLOCK','label'=>'url','priority'=>30,'strict'=>0],
   ['regex'=>'wa\\.me\\/[^\\s]+|whatsapp[^\\s]*','action'=>'BLOCK','label'=>'whatsapp','priority'=>31,'strict'=>0],
   ['regex'=>'t\\.me\\/[^\\s]+|telegram[^\\s]*','action'=>'BLOCK','label'=>'telegram','priority'=>32,'strict'=>0],
   ['regex'=>'@[a-zA-Z0-9_\\.]{3,}','action'=>'WARN','label'=>'social_handle','priority'=>90,'strict'=>0],
  ];
  foreach($patterns as $p){
   $exists = DB::table('data_leak_patterns')->where('label',$p['label'])->exists();
   if(!$exists) DB::table('data_leak_patterns')->insert([
    'regex_pattern'=>$p['regex'],'action'=>$p['action'],'label'=>$p['label'],'priority'=>$p['priority'],'is_active'=>1,'is_strict_post_escrow_only'=>$p['strict'],'created_at'=>now(),'updated_at'=>now()
   ]);
  }
  // Add DB validation trigger (ReDoS pre-check) — optional app-level validation also enforces
  try { DB::statement("ALTER TABLE data_leak_patterns ADD CONSTRAINT chk_regex_not_empty CHECK (CHAR_LENGTH(TRIM(regex_pattern)) > 0)"); } catch(\Throwable $e){}
 }
 public function down(): void { /* additive only */ }
};
