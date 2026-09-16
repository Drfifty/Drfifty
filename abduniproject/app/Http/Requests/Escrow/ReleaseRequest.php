<?php
// ReleaseRequest — B.6 F-07 — Arena — must be holding/partial_milestone/release_eligible else 409 canTransition
declare(strict_types=1);
namespace App\Http\Requests\Escrow;
use Illuminate\Foundation\Http\FormRequest;
final class ReleaseRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return ['transaction_id'=>['required','uuid']];
 }
}
