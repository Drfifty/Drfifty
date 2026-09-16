<?php
// NearbyProvidersRequest — B.7 F-04 — Arena — lat/lng required radius 100..50000
declare(strict_types=1);
namespace App\Http\Requests\AUServ;
use Illuminate\Foundation\Http\FormRequest;
final class NearbyProvidersRequest extends FormRequest {
 public function authorize(): bool { return true; }
 public function rules(): array {
  return [
   'lat'=>['required','numeric','between:-90,90'],
   'lng'=>['required','numeric','between:-180,180'],
   'radius_m'=>['nullable','integer','min:100','max:50000'],
   'specialty'=>['nullable','string','max:80'],
   'limit'=>['nullable','integer','min:1','max:50'],
  ];
 }
}
