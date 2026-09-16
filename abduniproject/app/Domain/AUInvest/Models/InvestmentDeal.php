<?php
// InvestmentDeal — Arena — B.5 — state-machine trigger + BIGINT minor R37
declare(strict_types=1);
namespace App\Domain\AUInvest\Models;
use Illuminate\Database\Eloquent\Model; use App\Domain\Shared\Traits\TenantScoped;
final class InvestmentDeal extends Model {
 use TenantScoped;
 protected $table='investment_deals'; protected $fillable=['uuid','tenant_id','app_id','title','amount_minor','currency','status','funding_target_minor','funded_minor'];
 protected $casts=['amount_minor'=>'integer','funding_target_minor'=>'integer','funded_minor'=>'integer'];
 public const TRANSITIONS=['draft'=>['funding','expired'],'funding'=>['funded','expired'],'funded'=>['escrow_locked','expired'],'escrow_locked'=>['released','refunded','disputed']];
 public function canTransition(string $to): bool { return in_array($to, self::TRANSITIONS[$this->status] ?? [], true); }
 public function rounds(){ return $this->hasMany(FundingRound::class,'deal_id'); }
 public function ledger(){ return $this->hasMany(InvestorLedger::class,'deal_id'); }
}
