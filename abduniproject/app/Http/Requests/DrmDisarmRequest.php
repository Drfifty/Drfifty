<?php
declare(strict_types=1);
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class DrmDisarmRequest extends FormRequest {
 public function authorize(): bool { return $this->user()?->hasRole('super_admin') ?? false; }
 public function rules(): array { return ['master_passphrase'=>['required','string','min:8'],'totp'=>['required','string','size:6','regex:/^\d{6}$/']]; }
}
