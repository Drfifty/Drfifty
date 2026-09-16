<?php
// LockRequest — B.6 F-07/F-06 — Arena — transaction_id UUID + minor BIGINT — Idempotency inside tx
declare(strict_types=1);
namespace App\Http\Requests\Escrow;
use Illuminate\Foundation\Http\FormRequest;
final class LockRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'transaction_id'=>['required','uuid'],
   'buyer_id'=>['required','integer','exists:users,id'],
   'seller_id'=>['required','integer','exists:users,id','different:buyer_id'],
   'amount_minor'=>['required','integer','min:1','max:9000000000000'],
   'currency'=>['required','string','in:EGP,USD,SAR,EUR'],
   'deal_type'=>['required','string','in:deals_listing,serv_ticket,invest_dispatch,med_appointment,barter_proposal,auction_win,group_buy'],
   'app_id'=>['required','string','in:AU BUSINESS,AU MED,AU DEALS,AU SERV,AU INVEST'],
  ];
 }
}
