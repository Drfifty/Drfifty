<?php
declare(strict_types=1);
namespace App\Domain\Workforce\Models;
use Illuminate\Database\Eloquent\Model; use App\Domain\Shared\Traits\TenantScoped;
final class TenantAgentSubscription extends Model {
 use TenantScoped;
 protected $table='tenant_agent_subscriptions'; protected $fillable=['tenant_id','agent_id','app_id','status','started_at','ends_at'];
 protected $casts=['started_at'=>'datetime','ends_at'=>'datetime'];
 public function agent(){ return $this->belongsTo(DigitalAgent::class,'agent_id'); }
 public function tenant(){ return $this->belongsTo(\App\Models\User::class,'tenant_id'); }
 public function logs(){ return $this->hasMany(AgentExecutionLog::class,'subscription_id'); }
}
