<?php
// RegisterRequest — B.6 F-13 — Arena — TRIM + leak REDACT vs BLOCK separation handled globally
declare(strict_types=1);
namespace App\Http\Requests\Auth;
use Illuminate\Foundation\Http\FormRequest;
final class RegisterRequest extends FormRequest {
 public function authorize(): bool { return true; }
 protected function prepareForValidation(): void {
  $this->merge([
   'name'=>trim((string)$this->name),
   'email'=>strtolower(trim((string)$this->email)),
  ]);
 }
 public function rules(): array {
  return [
   'name'=>['required','string','min:2','max:120'],
   'email'=>['required','email:rfc','max:255','unique:users,email'],
   'password'=>['required','string','min:8','max:128','confirmed'],
   'phone'=>['nullable','string','max:45'],
   'app_id'=>['nullable','string','in:AU BUSINESS,AU MED,AU DEALS,AU SERV,AU INVEST'],
  ];
 }
}
