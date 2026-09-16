<?php
// WalletAdjustmentRequest — B.6 F-05 — Arena — TRIM≥15 dual validated + DB chk_wal_rationale_trim
declare(strict_types=1);
namespace App\Http\Requests\Wallet;
use Illuminate\Foundation\Http\FormRequest;
final class WalletAdjustmentRequest extends FormRequest {
 public function authorize(): bool { return $this->user()?->hasRole('super_admin') ?? false; }
 protected function prepareForValidation(): void {
  $this->merge(['mandatory_rationale'=>trim((string)$this->input('mandatory_rationale'))]);
 }
 public function rules(): array {
  return [
   'wallet_id'=>['required','integer','exists:app_wallets,id'],
   'amount_minor'=>['required','integer','not_in:0'],
   'currency'=>['nullable','string','in:EGP,USD,SAR,EUR'],
   'mandatory_rationale'=>['required','string','min:15','max:2000'],
   'reference_uuid'=>['required','uuid'],
  ];
 }
 public function messages(): array {
  return ['mandatory_rationale.min'=>'Rationale must be at least 15 chars after trim'];
 }
}
