<?php
// PledgeRequest — B.7 F-06 — Arena — minor BIGINT + round isolation + Idempotency
declare(strict_types=1);
namespace App\Http\Requests\AUInvest;
use Illuminate\Foundation\Http\FormRequest;
final class PledgeRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'opportunity_id'=>['required','integer','exists:investment_deals,id'],
   'round_id'=>['required','integer','exists:funding_rounds,id'],
   'amount_minor'=>['required','integer','min:1','max:9000000000000'],
   'currency'=>['required','string','in:EGP,USD,SAR,EUR'],
   'reference_uuid'=>['required','uuid'],
  ];
 }
}
