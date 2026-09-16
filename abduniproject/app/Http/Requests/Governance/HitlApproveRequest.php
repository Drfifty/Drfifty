<?php
// HitlApproveRequest — B.8 F-10 — Arena — decision enum + rationale TRIM≥15
declare(strict_types=1);
namespace App\Http\Requests\Governance;
use Illuminate\Foundation\Http\FormRequest;
final class HitlApproveRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 protected function prepareForValidation(): void { $this->merge(['rationale'=>trim((string)$this->rationale)]); }
 public function rules(): array {
  return [
   'task_id'=>['required','integer','exists:hitl_approvals,id'],
   'decision'=>['required','string','in:approved,rejected'],
   'rationale'=>['required','string','min:15','max:1000'],
  ];
 }
}
