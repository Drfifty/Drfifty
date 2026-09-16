<?php
// SystemToggleRequest — B.8 F-04/F-07 — Arena — polymorphic flag/agent/module + reason TRIM≥15
declare(strict_types=1);
namespace App\Http\Requests\Governance;
use Illuminate\Foundation\Http\FormRequest;
final class SystemToggleRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 protected function prepareForValidation(): void { $this->merge(['reason'=>trim((string)$this->reason)]); }
 public function rules(): array {
  return [
   'flag_key'=>['sometimes','string','in:au_med,au_deals,au_serv,au_invest,au_business'],
   'agent_id'=>['sometimes','integer','between:1,13'],
   'capability_key'=>['required_with:agent_id','string','max:80'],
   'module_id'=>['sometimes','integer','between:1,9'],
   'is_enabled'=>['required','boolean'],
   'reason'=>['required','string','min:15','max:500'],
  ];
 }
 public function withValidator($v){ $v->after(function($validator){ if($this->input('flag_key')==='au_business' && $this->input('is_enabled')===false) $validator->errors()->add('flag_key','AU BUSINESS core is non-hibernatable (is_core lock)'); }); }
}
