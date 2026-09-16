<?php
// HitlQueueRequest — B.8 F-10 — Arena — paginated cursor 20 tenant+app isolated
declare(strict_types=1);
namespace App\Http\Requests\Governance;
use Illuminate\Foundation\Http\FormRequest;
final class HitlQueueRequest extends FormRequest {
 public function authorize(): bool { return $this->user() !== null; }
 public function rules(): array {
  return [
   'status'=>['nullable','string','in:pending,approved,rejected,expired'],
   'page'=>['nullable','integer','min:1','max:1000'],
   'per_page'=>['nullable','integer','min:1','max:50'],
   'app_id'=>['nullable','string','in:AU BUSINESS,AU MED,AU DEALS,AU SERV,AU INVEST'],
  ];
 }
}
