<?php
// WithdrawRequest — B.6 F-01/F-06 — Arena — minor only — balance check inside tx not here
declare(strict_types=1);
namespace App\Http\Requests\Wallet;
use Illuminate\Foundation\Http\FormRequest;
final class WithdrawRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'amount_minor'=>['required','integer','min:1','max:9000000000000'],
   'currency'=>['required','string','in:EGP,USD,SAR,EUR'],
   'reference_uuid'=>['required','uuid'],
  ];
 }
}
