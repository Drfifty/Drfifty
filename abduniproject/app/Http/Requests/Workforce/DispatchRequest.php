<?php
// DispatchRequest — B.9 F-14 — Arena — TRIM + payload 64KB + app_id tenant isolated
declare(strict_types=1);
namespace App\Http\Requests\Workforce;
use Illuminate\Foundation\Http\FormRequest;
final class DispatchRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 protected function prepareForValidation(): void {
  if(is_string($this->task_payload)) $this->merge(['task_payload'=>trim($this->task_payload)]);
 }
 public function rules(): array {
  return [
   'id'=>['sometimes','integer','between:1,13'],
   'task_payload'=>['required','array'],
   'task_payload.prompt'=>['nullable','string','max:65535'],
   'task_payload.instructions'=>['nullable','string','max:65535'],
  ];
 }
 public function withValidator($v): void {
  $v->after(function($validator){
   $flat=json_encode($this->task_payload ?? [], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) ?: '';
   if(mb_strlen($flat)>65535) $validator->errors()->add('task_payload','Payload exceeds 64KB leaf limit');
  });
 }
}
