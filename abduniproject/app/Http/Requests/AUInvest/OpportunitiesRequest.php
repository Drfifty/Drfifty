<?php
// OpportunitiesRequest — B.7 F-06/F-11 — Arena — filter status + paginate
declare(strict_types=1);
namespace App\Http\Requests\AUInvest;
use Illuminate\Foundation\Http\FormRequest;
final class OpportunitiesRequest extends FormRequest {
 public function authorize(): bool { return true; }
 public function rules(): array {
  return [
   'status'=>['nullable','string','in:draft,funding,funded,escrow_locked,released,refunded,expired'],
   'min_target_minor'=>['nullable','integer','min:0'],
   'page'=>['nullable','integer','min:1','max:1000'],
   'per_page'=>['nullable','integer','min:1','max:50'],
  ];
 }
}
