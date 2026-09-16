<?php
// SearchRequest — B.7 F-05 — Arena — ngram search + filters + pagination cursor
declare(strict_types=1);
namespace App\Http\Requests\AUDeals;
use Illuminate\Foundation\Http\FormRequest;
final class SearchRequest extends FormRequest {
 public function authorize(): bool { return true; }
 public function rules(): array {
  return [
   'search'=>['nullable','string','min:2','max:120'],
   'category_id'=>['nullable','integer','exists:deal_categories,id'],
   'price_min_minor'=>['nullable','integer','min:0'],
   'price_max_minor'=>['nullable','integer','min:0'],
   'near_lng'=>['nullable','numeric','between:-180,180'],
   'near_lat'=>['nullable','numeric','between:-90,90'],
   'radius_m'=>['nullable','integer','min:100','max:50000'],
   'page'=>['nullable','integer','min:1','max:1000'],
   'per_page'=>['nullable','integer','min:1','max:50'],
  ];
 }
 public function withValidator($v){ $v->after(function($validator){ $min=$this->price_min_minor; $max=$this->price_max_minor; if($min!==null && $max!==null && (int)$max < (int)$min) $validator->errors()->add('price_max_minor','max must be >= min'); }); }
}
