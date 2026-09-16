<?php
// AgentMemorySandbox — Arena — B.5 — tenant+app isolation CHECK + JSON_VALID F-08
declare(strict_types=1);
namespace App\Domain\Workforce\Models;
use Illuminate\Database\Eloquent\Model; use App\Domain\Shared\Traits\TenantScoped;
final class AgentMemorySandbox extends Model {
 use TenantScoped;
 protected $table='agent_memory_sandboxes'; protected $fillable=['agent_id','tenant_id','app_id','memory_key','memory_json'];
 protected $casts=['memory_json'=>'array'];
 public function agent(){ return $this->belongsTo(DigitalAgent::class,'agent_id'); }
}
