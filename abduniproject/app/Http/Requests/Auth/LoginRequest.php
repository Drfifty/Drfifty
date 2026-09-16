<?php
// LoginRequest — B.6 F-13 — Arena — trim + leak scan via SanitizeDataLeaks global already, enforce strict
declare(strict_types=1);
namespace App\Http\Requests\Auth;
use Illuminate\Foundation\Http\FormRequest;
final class LoginRequest extends FormRequest {
 public function authorize(): bool { return true; }
 public function rules(): array {
  return [
   'email'=>['required','email:rfc','max:255'],
   'password'=>['required','string','min:8','max:128'],
  ];
 }
 protected function prepareForValidation(): void {
  $this->merge(['email'=>strtolower(trim((string)$this->email))]);
 }
}
