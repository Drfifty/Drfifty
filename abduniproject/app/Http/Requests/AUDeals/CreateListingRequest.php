<?php
// CreateListingRequest — B.7 F-05/F-09 — Arena — price_minor minor + leak BLOCK vs REDACT handled globally
declare(strict_types=1);
namespace App\Http\Requests\AUDeals;
use Illuminate\Foundation\Http\FormRequest;
final class CreateListingRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 protected function prepareForValidation(): void {
  $this->merge(['title'=>trim((string)$this->title),'description'=>trim((string)$this->description)]);
 }
 public function rules(): array {
  return [
   'category_id'=>['required','integer','exists:deal_categories,id'],
   'title'=>['required','string','min:5','max:255'],
   'description'=>['required','string','min:10','max:5000'],
   'price_minor'=>['required','integer','min:1','max:9000000000000'],
   'currency'=>['nullable','string','in:EGP,USD,SAR,EUR'],
   'stock'=>['nullable','integer','min:0','max:999999'],
   'attributes'=>['nullable','array'],
   'geo_point.lng'=>['nullable','numeric','between:-180,180'],
   'geo_point.lat'=>['nullable','numeric','between:-90,90'],
   'lng'=>['nullable','numeric','between:-180,180'],
   'lat'=>['nullable','numeric','between:-90,90'],
  ];
 }
}
