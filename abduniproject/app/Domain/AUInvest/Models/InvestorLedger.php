<?php
// InvestorLedger — Arena — B.5 — WORM hash_chain minor BIGINT — REVOKE UPDATE,DELETE
declare(strict_types=1);
namespace App\Domain\AUInvest\Models;
use Illuminate\Database\Eloquent\Model; use Illuminate\Support\Facades\DB;
final class InvestorLedger extends Model {
 public $timestamps=false;
 protected $table='investor_ledgers'; protected $fillable=['deal_id','investor_id','app_id','amount_minor','currency','prev_hash','hash_current','created_at'];
 protected $casts=['amount_minor'=>'integer'];
 protected static function booted(): void {
  static::creating(function(self $m){
   $prev=DB::table('investor_ledgers')->where('deal_id',$m->deal_id)->orderByDesc('id')->value('hash_current');
   $m->prev_hash=$prev; $m->hash_current=hash('sha256', ($prev??'').$m->amount_minor.$m->investor_id.microtime(true));
  });
  static::updating(fn()=>false); static::deleting(fn()=>false);
 }
 public function deal(){ return $this->belongsTo(InvestmentDeal::class,'deal_id'); }
}
