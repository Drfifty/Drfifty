<?php
declare(strict_types=1);
namespace App\Domain\AUServ\Models;
use Illuminate\Database\Eloquent\Model; use App\Domain\Shared\Traits\TenantScoped;
final class ServiceTicket extends Model {
 use TenantScoped;
 protected $table='service_tickets'; protected $fillable=['uuid','requester_id','provider_id','app_id','title','status','pickup_point'];
 protected $casts=['created_at'=>'datetime'];
 public function requester(){ return $this->belongsTo(\App\Models\User::class,'requester_id'); }
 public function provider(){ return $this->belongsTo(ServiceProvider::class,'provider_id'); }
 public function dispatches(){ return $this->hasMany(DispatchLog::class,'ticket_id'); }
}
