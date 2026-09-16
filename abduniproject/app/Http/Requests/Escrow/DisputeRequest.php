<?php
// DisputeRequest — B.6 F-07 — Arena — reason_code min 5 — SanitizeDataLeaks global handles leak redaction
declare(strict_types=1);
namespace App\Http\Requests\Escrow;
use Illuminate\Foundation\Http\FormRequest;
final class DisputeRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'transaction_id'=>['required','uuid'],
   'reason_code'=>['required','string','min:5','max:100'],
   'details'=>['nullable','string','max:2000'],
  ];
 }
 protected function prepareForValidation(): void {
  if($this->has('reason_code')) $this->merge(['reason_code'=>trim((string)$this->reason_code)]);
 }
}
