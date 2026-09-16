<?php
// LocalGpuClient — Arena — B.4 F-04 SSRF guard + timeout 3s + traceparent F-13
declare(strict_types=1);
namespace App\Infrastructure\Http\Clients;
use Illuminate\Support\Facades\Http;
final class LocalGpuClient {
 public function post(array $payload): array {
  $endpoint=(string)config('ai.local_gpu.endpoint', env('LOCAL_GPU_ENDPOINT','http://127.0.0.1:8001'));
  $this->assertSafeUrl($endpoint);
  $trace=app()->bound('trace_id') ? app('trace_id') : bin2hex(random_bytes(16));
  $res=Http::timeout(3)->connectTimeout(1)->withHeaders(['traceparent'=>"00-{$trace}-".bin2hex(random_bytes(8))."-01"])->post(rtrim($endpoint,'/').'/v1/completions', $payload);
  if($res->failed()) throw new \RuntimeException('Local GPU failed: '.$res->status());
  return $res->json() ?? [];
 }
 private function assertSafeUrl(string $url): void {
  if(!filter_var($url, FILTER_VALIDATE_URL)) throw new \InvalidArgumentException('Invalid LOCAL_GPU_ENDPOINT');
  $host=parse_url($url, PHP_URL_HOST) ?: '';
  $allow=explode(',', (string)env('LOCAL_GPU_ALLOWLIST','http://vllm:8001,http://127.0.0.1:8001,http://localhost:8001'));
  $isAllow=false; foreach($allow as $a) if(str_contains($a, $host)) $isAllow=true;
  $private=['10.','192.168.','172.16.','172.17.','172.18.','172.19.','172.20.','169.254.','127.0.0.1'];
  // if not in allowlist and private IP → block
  if(!$isAllow){
   foreach($private as $p) if(str_starts_with($host, rtrim($p,'.'))) throw new \RuntimeException('SSRF blocked: private IP');
   if($host==='169.254.169.254') throw new \RuntimeException('SSRF blocked: metadata');
  }
 }
}
