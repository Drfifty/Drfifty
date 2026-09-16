<?php
declare(strict_types=1);
namespace App\Domain\Escrow\Enums;
enum EscrowStatus: string {
 case HOLDING='holding'; case PARTIAL_MILESTONE='partial_milestone'; case RELEASE_ELIGIBLE='release_eligible';
 case RELEASED='released'; case REFUNDED='refunded'; case DISPUTED='disputed'; case EXPIRED='expired';
 case WAITING_LIST='waiting_list'; case CHARGEBACK_FROZEN='chargeback_frozen';
 public static function canTransition(self $from, self $to): bool {
  return match(true){
   $from===self::HOLDING && in_array($to,[self::RELEASE_ELIGIBLE,self::PARTIAL_MILESTONE,self::DISPUTED,self::EXPIRED,self::WAITING_LIST])=>true,
   $from===self::PARTIAL_MILESTONE && in_array($to,[self::RELEASE_ELIGIBLE,self::DISPUTED,self::EXPIRED])=>true,
   $from===self::RELEASE_ELIGIBLE && in_array($to,[self::RELEASED,self::DISPUTED])=>true,
   $from===self::DISPUTED && in_array($to,[self::REFUNDED,self::RELEASED,self::CHARGEBACK_FROZEN])=>true,
   default=>false
  };
 }
}
