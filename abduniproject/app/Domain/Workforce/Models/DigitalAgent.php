<?php
declare(strict_types=1);
namespace App\Domain\Workforce\Models;
use Illuminate\Database\Eloquent\Model; use App\Domain\Shared\Traits\TenantScoped;
final class DigitalAgent extends Model {
 use TenantScoped;
 protected $table='digital_agents'; protected $primaryKey='id'; public $incrementing=false;
 protected $fillable=['id','code','name','app_id','is_active'];
 protected $casts=['is_active'=>'boolean'];
 public function subscriptions(){ return $this->hasMany(TenantAgentSubscription::class,'agent_id'); }
}
