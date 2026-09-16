<?php
// LogsRequest — B.9 F-04/F-14 — Arena — cursor20 + stats isolation R37
declare(strict_types=1);
namespace App\Http\Requests\Workforce;
use Illuminate\Foundation\Http\FormRequest;
final class LogsRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'page'=>['nullable','integer','min:1','max:1000'],
   'per_page'=>['nullable','integer','min:1','max:50'],
   'status'=>['nullable','string','in:queued,running,completed,failed'],
   'from'=>['nullable','date'],
   'to'=>['nullable','date','after_or_equal:from'],
  ];
 }
}
