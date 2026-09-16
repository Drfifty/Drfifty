<?php
// CreateTicketRequest — B.7 F-03/F-04 — Arena — pickup POINT 4326 required
declare(strict_types=1);
namespace App\Http\Requests\AUServ;
use Illuminate\Foundation\Http\FormRequest;
final class CreateTicketRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'title'=>['required','string','min:5','max:255'],
   'description'=>['nullable','string','max:2000'],
   'pickup_lng'=>['required','numeric','between:-180,180'],
   'pickup_lat'=>['required','numeric','between:-90,90'],
   'amount_minor'=>['nullable','integer','min:0','max:9000000000000'],
  ];
 }
}
