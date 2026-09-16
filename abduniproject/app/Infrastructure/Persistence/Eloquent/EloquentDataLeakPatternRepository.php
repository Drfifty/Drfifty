<?php
// EloquentDataLeakPatternRepository — cached active patterns — B1-F4 hardened
declare(strict_types=1);
namespace App\Infrastructure\Persistence\Eloquent;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
final class EloquentDataLeakPatternRepository {
 private const KEY='data_leak_patterns:active:v2';
 private const TTL=60;
 /** @return array<int,array{regex_pattern:string,action:string,priority:int,label:string}> */
 public function allActive(): array {
  return Cache::remember(self::KEY,self::TTL,function(){
   return DB::table('data_leak_patterns')->where('is_active',1)->orderBy('priority')->orderBy('id')->get(['regex_pattern','action','priority','label'])->map(fn($r)=>['regex_pattern'=>$r->regex_pattern,'action'=>$r->action,'priority'=>$r->priority,'label'=>$r->label])->all();
  });
 }
 public function invalidate():void{ Cache::forget(self::KEY); }
 // Validate PCRE before insert — ReDoS guard (B1-F4)
 public static function validateRegexPattern(string $pattern): void {
  if(trim($pattern)==='') throw new \InvalidArgumentException('regex_pattern empty');
  if(strlen($pattern)>500) throw new \InvalidArgumentException('regex_pattern >500 chars');
  $t=microtime(true);
  $ok=@preg_match('/'.$pattern.'/u','test');
  $elapsed=(microtime(true)-$t)*1000;
  if($ok===false || preg_last_error()!==PREG_NO_ERROR) throw new \InvalidArgumentException('Invalid PCRE: '.preg_last_error_msg());
  if($elapsed>10) throw new \InvalidArgumentException('ReDoS: pattern compile >10ms');
 }
}
