<?php
// WalletOperationDTO — readonly — Arena — B2 §3.2
declare(strict_types=1);
namespace App\Domain\Escrow\DTOs;
final readonly class WalletOperationDTO {
 public function __construct(
  public int $walletId,
  public int $userId,
  public int $amountMinor,
  public string $transactionType, // deposit|withdrawal|escrow_lock|escrow_release|adjustment
  public string $referenceUuid,
  public string $appId='AU BUSINESS',
  public bool $isAdminAdjustment=false,
  public ?string $rationale=null,
  public ?string $escrowTransactionId=null,
  public ?string $ipAddress=null,
 ){}
 public function isDebit(): bool { return in_array($this->transactionType,['withdrawal','escrow_lock','adjustment'],true); }
}
