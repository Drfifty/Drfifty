<?php
// HasEventId — B.10 F-04 — Arena — at-least-once event_id UUIDv4 + Cairo timestamp + trace_id
declare(strict_types=1);
namespace App\Services\Broadcast;
use Illuminate\Support\Str;
trait HasEventId {
 public string $event_id; public string $event_version='v1'; public string $broadcast_timestamp;
 public function initEventId(): void {
  $this->event_id=(string) Str::uuid();
  $this->broadcast_timestamp=now('Africa/Cairo')->toIso8601String();
 }
 public function eventMeta(): array {
  return ['event_id'=>$this->event_id,'event_version'=>$this->event_version,'timestamp'=>$this->broadcast_timestamp,'trace_id'=>app()->bound('trace_id')?app('trace_id'):null];
 }
}
