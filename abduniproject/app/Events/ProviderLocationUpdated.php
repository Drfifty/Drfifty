<?php
// ProviderLocationUpdated — B.10 F-05/F-11 — Arena — presence-dispatch-{region} GPS throttled 5s batch 20
declare(strict_types=1);
namespace App\Events;
use App\Services\Broadcast\HasEventId; use App\Services\Broadcast\ReverbBuffer;
use Illuminate\Broadcasting\PresenceChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; use Illuminate\Foundation\Events\Dispatchable;
final class ProviderLocationUpdated implements ShouldBroadcastNow {
 use Dispatchable, HasEventId;
 public function __construct(
  public string $region,
  public int $providerIdHash,
  public float $latitude,
  public float $longitude,
  public int $heading,
  public string $status,
  public string $appId='AU SERV',
  public ?float $accuracy=null, public ?float $speed=null
 ){
  if($latitude<-90 || $latitude>90) throw new \InvalidArgumentException('lat -90..90');
  if($longitude<-180 || $longitude>180) throw new \InvalidArgumentException('lng -180..180');
  if($heading<0 || $heading>359) throw new \InvalidArgumentException('heading 0..359');
  if(!in_array($status,['available','busy','offline'],true)) $status='available';
  $region=trim(strtolower($region));
  $allowed=['cairo','giza','alexandria','dakahlia','red_sea','beheira','fayoum','gharbia','ismailia','monufia','minya','qaliubiya','new_valley','suez','aswan','asyut','beni_suef','port_said','damietta','sharkia','south_sinai','kafr_el_sheikh','matrouh','luxor','qena','north_sinai','sohag'];
  if(!in_array($region,$allowed,true)) throw new \InvalidArgumentException('region enum');
  $this->region=$region;
  $this->initEventId();
 }
 public function broadcastOn(): array { return [new PresenceChannel('presence-dispatch-'.$this->region)]; }
 public function broadcastAs(): string { return 'v1.provider.location.updated'; }
 public function broadcastWith(): array {
  $payload=['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'app_id'=>$this->appId,'region'=>$this->region,'provider_id_hash'=>$this->providerIdHash,'latitude'=>$this->latitude,'longitude'=>$this->longitude,'heading'=>$this->heading,'status'=>$this->status,'accuracy'=>$this->accuracy,'speed'=>$this->speed];
  ReverbBuffer::push('presence-dispatch-'.$this->region, $payload);
  return $payload;
 }
}
