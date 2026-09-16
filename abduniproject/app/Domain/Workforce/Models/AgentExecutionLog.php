<?php
// AgentExecutionLog — Arena — B.5 — WORM chain — partitioned monthly F-11 — tenant isolated
declare(strict_types=1);
namespace App\Domain\Workforce\Models;
use Illuminate\Database\Eloquent\Model; use Illuminate\Support\Facades\DB;
final class AgentExecutionLog extends Model {
 public $timestamps=false;
 protected $table='agent_execution_logs'; protected $fillable=['subscription_id','agent_id','app_id','input_hash','output_hash','tokens','cost_usd','status','prev_hash','hash_current','created_at'];
 protected $casts=['tokens'=>'integer'];
 protected static function booted(): void {
  static::creating(function(self $m){
   $prev=DB::table('agent_execution_logs')->where('subscription_id',$m->subscription_id)->orderByDesc('id')->value('hash_current');
   $m->prev_hash=$prev; $m->hash_current=hash('sha256', ($prev??'').$m->input_hash.$m->output_hash.microtime(true));
  });
  static::updating(fn()=>false); static::deleting(fn()=>false);
 }
 public function subscription(){ return $this->belongsTo(TenantAgentSubscription::class,'subscription_id'); }
}
