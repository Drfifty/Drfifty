<?php
// CloudLlmClient — Arena — B.4 — timeout 5s — cost tally — traceparent — secrets .env only F-05
declare(strict_types=1);
namespace App\Infrastructure\Http\Clients;
use Illuminate\Support\Facades\Http;
final class CloudLlmClient {
 public function chat(array $messages): array {
  $base=(string)config('ai.cloud.base_url', env('CLOUD_LLM_BASE_URL','https://api.openai.com/v1'));
  $key=(string)config('ai.cloud.api_key', env('CLOUD_LLM_API_KEY',''));
  if(!$key) throw new \RuntimeException('CLOUD_LLM_API_KEY missing');
  $trace=app()->bound('trace_id') ? app('trace_id') : bin2hex(random_bytes(16));
  $res=Http::timeout(5)->connectTimeout(1)->withToken($key)->withHeaders(['traceparent'=>"00-{$trace}-".bin2hex(random_bytes(8))."-01"])->post(rtrim($base,'/').'/chat/completions', ['model'=>config('ai.cloud.model','gpt-4o-mini'),'messages'=>$messages,'temperature'=>0.2]);
  if($res->failed()) throw new \RuntimeException('Cloud LLM failed: '.$res->status().' '.$res->body());
  $j=$res->json();
  return ['content'=>$j['choices'][0]['message']['content'] ?? '', 'tokens'=>(int)($j['usage']['total_tokens'] ?? 0), 'cost'=> (float)($j['usage']['total_tokens'] ?? 0) * 0.00001];
 }
}
