<?php
// PromoteRequest — B.7 F-08 — Arena — listing_uuid required uuid
declare(strict_types=1);
namespace App\Http\Requests\AUDeals;
use Illuminate\Foundation\Http\FormRequest;
final class PromoteRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return ['listing_uuid'=>['required','uuid','exists:deals_listings,uuid'],'reason'=>['nullable','string','min:10','max:500']];
 }
}
