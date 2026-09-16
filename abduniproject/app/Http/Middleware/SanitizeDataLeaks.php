<?php
// SanitizeDataLeaks — B1-F3 hardened — Arena — skip multipart/file, 64KB leaf limit, X-Leak-Sanitized, chat vs listing
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use App\Services\Security\RegexDataLeakDetectorInterface; use Symfony\Component\HttpFoundation\Response;
final class SanitizeDataLeaks {
 public function __construct(private RegexDataLeakDetectorInterface $detector){}
 public function handle(Request $request, Closure $next): Response {
  // skip web assets & multipart file uploads (preserve UploadedFile)
  $ct=$request->header('Content-Type','');
  if(str_contains($ct,'multipart/form-data') && $request->hasFile('image')){ /* still scan non-file fields */ }
  if(in_array($request->method(),['POST','PUT','PATCH'],true)){
   $isChat=(bool)($request->attributes->get('is_chat_endpoint', false) || str_contains($request->path(),'chat') || str_contains($request->path(),'messages'));
   // skip detached post-escrow REDACT if flag says so (Oil1) — detector handles priority
   $payload=$request->all();
   // do not scan file objects — handled inside detector
   $hasFiles=!empty($request->allFiles());
   if($hasFiles){
    // remove files from scan payload, re-inject after
    $files=$request->allFiles();
    $payloadNoFiles=array_filter($payload, fn($v,$k)=>!isset($files[$k]), ARRAY_FILTER_USE_BOTH);
   } else { $payloadNoFiles=$payload; }
   $flat=json_encode($payloadNoFiles,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) ?: '';
   if(mb_strlen($flat)>65535) $flat=mb_substr($flat,0,65535);
   $scan=$this->detector->scan($flat, $isChat?'chat':'listing');
   if($scan['action']==='BLOCK' && !$isChat){
    return response()->json(['message'=>'Data leak detected','leaks'=>$scan['leaks'],'code'=>'DATA_LEAK_BLOCKED'],422);
   }
   $sanitized=$this->detector->sanitizePayload($payloadNoFiles, $isChat?'chat':'listing');
   // re-inject files untouched
   if($hasFiles) foreach($files as $k=>$f) $sanitized['payload'][$k]=$f;
   // replace only sanitized leaves — keep UploadedFile instances
   $request->replace($sanitized['payload']);
   if($sanitized['leaked']) $request->headers->set('X-Leak-Sanitized','1');
   if(!$scan['clean'] && $isChat){ \Illuminate\Support\Facades\Log::info('leak_redacted',['path'=>$request->path(),'leaks'=>$scan['leaks']]); }
  }
  return $next($request);
 }
}
