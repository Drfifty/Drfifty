<?php
declare(strict_types=1);
namespace App\Domain\AUServ\Models;
use Illuminate\Database\Eloquent\Model;
final class DispatchLog extends Model {
 public $timestamps=false;
 protected $table='dispatch_logs'; protected $fillable=['ticket_id','provider_id','app_id','dispatched_at','distance_m','created_at'];
 protected $casts=['dispatched_at'=>'datetime','created_at'=>'datetime'];
 public function ticket(){ return $this->belongsTo(ServiceTicket::class,'ticket_id'); }
 public function provider(){ return $this->belongsTo(ServiceProvider::class,'provider_id'); }
}
