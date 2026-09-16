<?php
// CatalogueRequest — B.9 F-04/F-14 — Arena — TRIM + app_id enum + cursor20 REDACT prompt sanitized
declare(strict_types=1);
namespace App\Http\Requests\Workforce;
use Illuminate\Foundation\Http\FormRequest;
final class CatalogueRequest extends FormRequest {
 public function authorize(): bool { return true; }
 protected function prepareForValidation(): void {
  $this->merge(['q'=>trim((string)$this->q),'app_id'=>trim((string)($this->app_id ?? $this->header('X-App-Id') ?? ''))]);
 }
 public function rules(): array {
  return [
   'q'=>['nullable','string','max:80'],
   'app_id'=>['nullable','string','in:AU BUSINESS,AU MED,AU DEALS,AU SERV,AU INVEST'],
   'capability'=>['nullable','string','max:80'],
   'is_active'=>['nullable','boolean'],
   'page'=>['nullable','integer','min:1','max:1000'],
   'per_page'=>['nullable','integer','min:1','max:50'],
  ];
 }
}
