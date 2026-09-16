<?php
// ChatIntercepted — B.10 F-05/F-08/F-11 — Arena — private-admin-support-intercept.{chatId} REDACT
declare(strict_types=1);
namespace App\Events;
use App\Services\Broadcast\HasEventId; use App\Services\Broadcast\ReverbBuffer;
use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcast; use Illuminate\Foundation\Events\Dispatchable;
final class ChatIntercepted implements ShouldBroadcast {
 use Dispatchable, HasEventId;
 public function __construct(
  public string $chatId,
  public string $appId,
  public string $role,
  public string $message,
  public bool $takenOver=false,
  public ?int $adminId=null
 ){
  if(mb_strlen($chatId)>64) throw new \InvalidArgumentException('chatId max 64');
  if(!in_array($appId,['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST'],true)) throw new \InvalidArgumentException('app_id');
  // REDACT leak tiered (B.1a) on admin/customer message
  $msg=preg_replace('/(?:\+20|0020|0)?1[0-2,5][0-9]{8}/u','***',$message) ?? $message;
  $msg=preg_replace('/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i','***',$msg) ?? $msg;
  $msg=preg_replace('/https?:\/\/\S+|www\.\S+/i','***',$msg) ?? $msg;
  $this->message=mb_substr($msg,0,65535);
  $this->initEventId();
 }
 public function broadcastOn(): array { return [new PrivateChannel('private-admin-support-intercept.'.$this->chatId)]; }
 public function broadcastAs(): string { return 'v1.chat.intercepted'; }
 public function broadcastWith(): array {
  $payload=['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null,'chat_id'=>$this->chatId,'app_id'=>$this->appId,'role'=>$this->role,'message'=>$this->message,'taken_over'=>$this->takenOver,'admin_id'=>$this->adminId];
  ReverbBuffer::push('private-admin-support-intercept.'.$this->chatId,$payload);
  return $payload;
 }
}
