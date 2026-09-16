<?php
// Money VO — Arena — minor units BIGINT — no float — B2-F4
declare(strict_types=1);
namespace App\Domain\Wallet\ValueObjects;
use App\Modules\Shared\Enums\Currency; // existing enum
final readonly class Money {
 public function __construct(public int $minor, public string|Currency $currency){
  if($minor < -9000000000000000000) throw new \InvalidArgumentException('Money overflow');
 }
 public static function ofMinor(int $minor, string|Currency $currency): self { return new self($minor,$currency); }
 public function plus(self $o): self { $this->assertSameCurrency($o); return new self($this->minor+$o->minor,$this->currency); }
 public function minus(self $o): self { $this->assertSameCurrency($o); return new self($this->minor-$o->minor,$this->currency); }
 public function multipliedBy(float $rate, int $mode=PHP_ROUND_HALF_UP): self {
  return new self((int)round($this->minor*$rate,0,$mode),$this->currency);
 }
 public function isNegative(): bool { return $this->minor < 0; }
 public function isZero(): bool { return $this->minor===0; }
 private function assertSameCurrency(self $o): void {
  $a=is_string($this->currency)?$this->currency:$this->currency->value;
  $b=is_string($o->currency)?$o->currency:$o->currency->value;
  if($a!==$b) throw new \LogicException("Currency mismatch {$a}!={$b}");
 }
 public function toArray(): array { return ['minor'=>$this->minor,'currency'=>$this->currency instanceof Currency? $this->currency->value:$this->currency]; }
}
