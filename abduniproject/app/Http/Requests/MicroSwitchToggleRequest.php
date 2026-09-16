<?php
declare(strict_types=1);
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class MicroSwitchToggleRequest extends FormRequest {
 public function authorize(): bool { return $this->user()?->hasRole('super_admin') ?? false; }
 public function rules(): array {
  return [
   'agent_id'=>['required','integer','between:1,13'],
   'app_id'=>['required','string','in:AU BUSINESS,AU MED,AU DEALS,AU SERV,AU INVEST'],
   'module_id'=>['required','integer','between:1,9'],
   'sub_capability_key'=>['required','string','max:80'],
   'is_enabled'=>['required','boolean'],
   'approval_required'=>['required','boolean'],
   'reason'=>['required','string','min:15'],
  ];
 }
 protected function prepareForValidation(): void { $this->merge(['reason'=>trim((string)$this->reason)]); }
}
