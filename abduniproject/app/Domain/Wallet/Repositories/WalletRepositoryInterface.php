<?php
declare(strict_types=1);
namespace App\Domain\Wallet\Repositories;
use Illuminate\Database\Eloquent\Model;
interface WalletRepositoryInterface {
 /** @return Model lockForUpdate inside active transaction */
 public function findForUpdate(int $id): Model;
 public function findByUserCurrency(int $userId, string $currency, string $appId='AU BUSINESS'): ?Model;
 /** Optimistic guard WHERE version=? */
 public function updateBalanceWithVersion(Model $wallet, int $newBalance, int $expectedVersion): bool;
}
