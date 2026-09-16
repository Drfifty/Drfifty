<?php
// TelemetryRequest — B.7 F-07 — Arena — zero raw enforced by middleware — only canonical JSON allowed
declare(strict_types=1);
namespace App\Http\Requests\AUMed;
use Illuminate\Foundation\Http\FormRequest;
final class TelemetryRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'appointment_id'=>['required','integer'],
   'nlp_canonical_json'=>['required','array'],
   'payload_version'=>['nullable','integer','min:1'],
  ];
 }
}
