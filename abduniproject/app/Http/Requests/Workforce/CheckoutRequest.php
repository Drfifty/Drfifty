<?php
// CheckoutRequest — B.9 F-07/F-14 — Arena — buyout|subscription SaaS-only + amount_minor server-derived NOT client float
declare(strict_types=1);
namespace App\Http\Requests\Workforce;
use Illuminate\Foundation\Http\FormRequest;
final class CheckoutRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 protected function prepareForValidation(): void {
  $this->merge(['license_type'=>trim((string)$this->license_type),'currency'=>strtoupper(trim((string)($this->currency ?? 'EGP')))]);
 }
 public function rules(): array {
  return [
   'agent_id'=>['required','integer','between:1,13','exists:digital_agents,id'],
   'license_type'=>['required','string','in:buyout,subscription'],
   'currency'=>['nullable','string','in:EGP,USD,SAR,AED'],
   'duration_months'=>['nullable','integer','min:1','max:12','required_if:license_type,subscription'],
  ];
 }
}
