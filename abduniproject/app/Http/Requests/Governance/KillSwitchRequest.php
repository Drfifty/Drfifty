<?php
// KillSwitchRequest — B.8 F-05 — Arena — TRIM≥15 + confirm_token HMAC 5min
declare(strict_types=1);
namespace App\Http\Requests\Governance;
use Illuminate\Foundation\Http\FormRequest;
final class KillSwitchRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 protected function prepareForValidation(): void { $this->merge(['reason'=>trim((string)$this->reason)]); }
 public function rules(): array {
  return [
   'reason'=>['required','string','min:15','max:500'],
   'confirm_token'=>['required','string','min:10','max:256'],
   'totp'=>['nullable','string','size:6'],
  ];
 }
}
