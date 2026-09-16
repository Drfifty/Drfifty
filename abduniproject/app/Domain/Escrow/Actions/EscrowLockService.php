<?php
// EscrowLockService — B2-F1,F2,F3 + C-F1 — Arena — atomic idempotency, version guard, ordered locks, READ COMMITTED
declare(strict_types=1);
namespace App\Domain\Escrow\Actions;
use App\Domain\Escrow\DTOs\WalletOperationDTO;
use App\Domain\Wallet\Services\WalletMutex;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
final class EscrowLockService {
 public function lockAndMove(WalletOperationDTO $dto, string $idempotencyKey, string $idempotencyHash, string $endpoint): array {
  // 1) outer idempotency replay (fast path — no lock) — B2-F1 atomic
  $existing=DB::table('idempotency_keys')->where('idempotency_key',$idempotencyKey)->where('user_id',$dto->userId)->where('endpoint',$endpoint)->where('expires_at','>',now())->first();
  if($existing){
   if($existing->request_hash!==$idempotencyHash) throw ValidationException::withMessages(['Idempotency-Key'=>'already used with different payload']);
   return json_decode($existing->response_body, true) ?? ['replayed'=>true];
  }
  $lock=WalletMutex::lock($dto->walletId,10);
  if(!$lock->get()) throw new \RuntimeException('Concurrent operation, retry',429);
  try {
   return DB::transaction(function() use($dto,$idempotencyKey,$idempotencyHash,$endpoint){
    DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED'); // C-F1
    // pessimistic lock — inside tx
    $wallet=DB::table('app_wallets')->where('id',$dto->walletId)->lockForUpdate()->first();
    if(!$wallet) throw new \RuntimeException('Wallet not found',404);
    // re-check idempotency inside tx with FOR UPDATE to avoid race
    $inside=DB::table('idempotency_keys')->where('idempotency_key',$idempotencyKey)->where('user_id',$dto->userId)->where('endpoint',$endpoint)->lockForUpdate()->first();
    if($inside){
     if($inside->request_hash!==$idempotencyHash) throw ValidationException::withMessages(['Idempotency-Key'=>'already used with different payload']);
     return json_decode($inside->response_body,true);
    }
    // invariants
    if($dto->transactionType==='withdrawal' || $dto->transactionType==='escrow_lock'){
     if((int)$wallet->balance_subunit < $dto->amountMinor) throw new \RuntimeException('Insufficient funds',422);
    }
    $prev=(int)$wallet->balance_subunit;
    $new=$dto->transactionType==='withdrawal'||$dto->transactionType==='escrow_lock' ? $prev-$dto->amountMinor : $prev+$dto->amountMinor;
    if($new<0) throw new \RuntimeException('Balance would go negative',422);
    // optimistic version guard B2-F3
    $expected=(int)$wallet->version;
    $updated=DB::table('app_wallets')->where('id',$dto->walletId)->where('version',$expected)->update(['balance_subunit'=>$new,'version'=>$expected+1,'updated_at'=>now()]);
    if($updated===0) throw new \RuntimeException('Version conflict — retry',409);
    // admin adjustment log B2-F2 — trim check
    if($dto->isAdminAdjustment){
     $rationale=trim((string)$dto->rationale);
     if(mb_strlen($rationale)<15) throw ValidationException::withMessages(['mandatory_rationale'=>'min 15 chars after trim']);
     $ip=$dto->ipAddress ?? request()->ip() ?? '0.0.0.0';
     DB::table('wallet_adjustment_logs')->insert([
      'wallet_id'=>$dto->walletId,'admin_id'=>auth()->id()??$dto->userId,'amount_changed_minor'=>$dto->transactionType==='withdrawal'? -$dto->amountMinor:$dto->amountMinor,
      'previous_balance_minor'=>$prev,'new_balance_minor'=>$new,'mandatory_rationale'=>$rationale,'ip_address'=>$ip,'reference_uuid'=>$dto->referenceUuid,'app_id'=>$dto->appId,'created_at'=>now(3)
     ]);
    }
    // ledger
    $balanceAfter=$new;
    DB::table('wallet_transactions')->insert([
     'uuid'=>$dto->referenceUuid,'wallet_id'=>$dto->walletId,'user_id'=>$dto->userId,'app_id'=>$dto->appId,'type'=>$dto->transactionType,'amount_subunit'=>$dto->amountMinor,'balance_after_subunit'=>$balanceAfter,'currency'=>'EGP','reference_uuid'=>$dto->referenceUuid,'hash_current'=>hash('sha256',$dto->referenceUuid.$new.microtime(true)),'created_at'=>now(3)
    ]);
    // escrow event if needed
    if($dto->escrowTransactionId){
     $row=DB::table('escrow_clearings')->where('transaction_id',$dto->escrowTransactionId)->first();
     $payload=json_encode($row, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_SORT_KEYS) ?: '{}';
     DB::table('escrow_events')->insert([
      'transaction_id'=>$dto->escrowTransactionId,'from_status'=>$row->status??'holding','to_status'=>$row->status??'holding','actor_type'=>'buyer','actor_id'=>$dto->userId,'reason_code'=>'WALLET_MOVE','payload_snapshot_hash'=>hash('sha256',$payload),'payload_snapshot'=>json_encode(['wallet_id'=>$dto->walletId,'balance_after'=>$new]),'app_id'=>$dto->appId,'created_at'=>now(3)
     ]);
    }
    $result=['wallet_id'=>$dto->walletId,'balance_after'=>$new,'reference_uuid'=>$dto->referenceUuid,'status'=>'ok'];
    // idempotency store inside same TX — atomic
    DB::table('idempotency_keys')->insert([
     'idempotency_key'=>$idempotencyKey,'endpoint'=>$endpoint,'user_id'=>$dto->userId,'app_id'=>$dto->appId,'request_hash'=>$idempotencyHash,'response_status'=>200,'response_body'=>json_encode($result),'created_at'=>now(3),'expires_at'=>now()->addHours(24)
    ]);
    return $result;
   },3);
  } catch(\Illuminate\Database\QueryException $e){
   // duplicate idempotency race — replay instead of 500 (B2-F1)
   if(str_contains($e->getMessage(),'uk_key_user_endpoint')||str_contains($e->getMessage(),'Duplicate entry')){
    $row=DB::table('idempotency_keys')->where('idempotency_key',$idempotencyKey)->where('user_id',$dto->userId)->where('endpoint',$endpoint)->first();
    if($row) return json_decode($row->response_body,true) ?? [];
   }
   throw $e;
  } finally { try{$lock->release();}catch(\Throwable){} }
 }
}
