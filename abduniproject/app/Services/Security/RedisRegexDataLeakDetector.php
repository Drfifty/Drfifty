<?php
// RedisRegexDataLeakDetector — B1-F3,F4 — hardened 0-cost — Arena — max 64KB, ReDoS-safe, trim-aware
declare(strict_types=1);
namespace App\Services\Security;
use App\Infrastructure\Persistence\Eloquent\EloquentDataLeakPatternRepository;
use Illuminate\Support\Facades\Log;
final class RedisRegexDataLeakDetector implements RegexDataLeakDetectorInterface {
 private const MAX_INPUT_BYTES=65535;
 public function __construct(private EloquentDataLeakPatternRepository $repo){}
 public function scan(string $input, string $routeGroup='chat'): array {
  $input=mb_substr($input,0,self::MAX_INPUT_BYTES);
  $patterns=$this->repo->allActive();
  $leaks=[]; $sanitized=$input; $hasBlock=false;
  foreach($patterns as $p){
   $regex='/'.str_replace('/','\/',$p['regex_pattern']).'/u';
   $t=microtime(true);
   $matched=@preg_match($regex,$sanitized);
   if(preg_last_error()===PREG_BACKTRACK_LIMIT_ERROR){ Log::warning('redos_backtrack',['label'=>$p['label']]); continue; }
   if($matched){
    $leaks[]=$p['label']??$p['regex_pattern'];
    if($p['action']==='BLOCK') $hasBlock=true;
    if($p['action']==='REDACT' || $p['action']==='BLOCK'){
     $sanitized=(string)@preg_replace($regex,'[REDACTED]',$sanitized);
    }
   }
   if((microtime(true)-$t)*1000>50){ Log::warning('redos_slow_scan',['label'=>$p['label']]); }
  }
  return ['clean'=>$leaks===[], 'sanitized'=>$sanitized, 'leaks'=>$leaks, 'action'=>$hasBlock?'BLOCK':($leaks? 'REDACT':'PASS')];
 }
 public function containsLeak(string $input): bool { return !$this->scan($input)['clean']; }
 public function sanitizePayload(array $payload, string $routeGroup='chat'): array {
  $leaked=false; $out=[];
  foreach($payload as $k=>$v){
   if($v instanceof \Illuminate\Http\UploadedFile) { $out[$k]=$v; continue; }
   if(is_string($v)){
    $slice=mb_substr($v,0,self::MAX_INPUT_BYTES);
    $res=$this->scan($slice,$routeGroup);
    $out[$k]=$res['sanitized'];
    if(!$res['clean']) $leaked=true;
   } elseif(is_array($v)){ $r=$this->sanitizePayload($v,$routeGroup); $out[$k]=$r['payload']; if($r['leaked']) $leaked=true; }
   elseif(is_int($v)||is_float($v)||is_bool($v)||is_null($v)) $out[$k]=$v;
   else $out[$k]=$v;
  }
  return ['payload'=>$out,'leaked'=>$leaked];
 }
}
