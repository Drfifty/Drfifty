<?php
// BookAppointmentRequest — B.7 F-07 — Arena — pgsql provider exists + scheduled_at after now
declare(strict_types=1);
namespace App\Http\Requests\AUMed;
use Illuminate\Foundation\Http\FormRequest;
final class BookAppointmentRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'provider_id'=>['required','integer'],
   'scheduled_at'=>['required','date','after:now'],
   'complaint_raw'=>['required','string','min:10','max:2000'],
  ];
 }
}
