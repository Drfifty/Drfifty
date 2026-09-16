<?php
// ModuleKey — Arena Canonical 9 Modules + 5 Apps — B1-F5 — Exhaustive enum with validation
declare(strict_types=1);
namespace App\Domain\Governance\Enums;
enum ModuleKey: string {
 case AU_BUSINESS = 'au_business';
 case AU_MED      = 'au_med';
 case AU_DEALS    = 'au_deals';
 case AU_SERV     = 'au_serv';
 case AU_INVEST   = 'au_invest';
 public function appId(): string { return match($this){
  self::AU_BUSINESS=>'AU BUSINESS', self::AU_MED=>'AU MED',
  self::AU_DEALS=>'AU DEALS', self::AU_SERV=>'AU SERV', self::AU_INVEST=>'AU INVEST'
 };}
 public function isCore(): bool { return $this===self::AU_BUSINESS; }
 public static function tryFromAppId(string $appId): ?self {
  return match($appId){ 'AU BUSINESS'=>self::AU_BUSINESS,'AU MED'=>self::AU_MED,'AU DEALS'=>self::AU_DEALS,'AU SERV'=>self::AU_SERV,'AU INVEST'=>self::AU_INVEST, default=>null };
 }
 public static function isValidAppId(string $v): bool { return self::tryFromAppId($v)!==null; }
}
