<?php
declare(strict_types=1);
namespace App\Domain\AUInvest\Models;
use Illuminate\Database\Eloquent\Model;
final class FundingRound extends Model {
 protected $table='funding_rounds'; protected $fillable=['deal_id','round_no','status','target_minor','raised_minor','app_id'];
 protected $casts=['target_minor'=>'integer','raised_minor'=>'integer'];
 public function deal(){ return $this->belongsTo(InvestmentDeal::class,'deal_id'); }
}
