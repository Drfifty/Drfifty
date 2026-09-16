<?php
// WorkforceCatalogResource — B.9 F-09 — Arena — persona manifests REDACT prompt, minor formatted
declare(strict_types=1);
namespace App\Http\Resources\Workforce;
use Illuminate\Http\Resources\Json\JsonResource;
final class WorkforceCatalogResource extends JsonResource {
 public function toArray($request): array {
  $r=$this->resource;
  $id=$r['id'] ?? $r->id ?? 0;
  $manifest=$r['capability_manifest'] ?? $r->capability_manifest ?? null;
  if(is_string($manifest)) $manifest=json_decode($manifest,true);
  $prompt=$r['prompt_template'] ?? $r->prompt_template ?? null;
  // REDACT phone/email/url from prompt templates (leak tiered)
  if(is_string($prompt) && $prompt!==''){
   $prompt=preg_replace('/(?:\+20|0020|0)?1[0-2,5][0-9]{8}/u','***',$prompt) ?? $prompt;
   $prompt=preg_replace('/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i','***',$prompt) ?? $prompt;
   $prompt=preg_replace('/https?:\/\/\S+|www\.\S+/i','***',$prompt) ?? $prompt;
  }
  return [
   'id'=>(int)$id,
   'code'=>$r['code'] ?? $r->code ?? 'agent_'. $id,
   'name'=>$r['name'] ?? $r->name ?? 'Agent '.$id,
   'app_id'=>$r['app_id'] ?? $r->app_id ?? 'AU BUSINESS',
   'is_active'=>(bool)($r['is_active'] ?? $r->is_active ?? true),
   'capability_manifest'=>$manifest,
   'prompt_template'=>$prompt,
   'pricing'=>[
    'buyout_minor'=>$r['buyout_minor'] ?? $r->buyout_minor ?? 500000, // 5000.00 EGP minor 100
    'buyout_formatted'=>number_format((($r['buyout_minor'] ?? 500000)/100),2,'.',''),
    'subscription_minor'=>$r['subscription_minor'] ?? $r->subscription_minor ?? 99000,
    'subscription_formatted'=>number_format((($r['subscription_minor'] ?? 99000)/100),2,'.',''),
    'currency'=>$r['currency'] ?? $r->currency ?? 'EGP',
   ],
   'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null],
  ];
 }
}
