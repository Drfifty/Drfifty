<?php
// PledgeEscrowAction — B.7 F-06 — Arena — WORM investor_ledgers chain + funding_rounds lockForUpdate + escrow_contracts
declare(strict_types=1);
namespace App\Domain\AUInvest\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Str; use App\Domain\Escrow\DTOs\WalletOperationDTO; use App\Domain\Escrow\Actions\EscrowLockService;
final class PledgeEscrowAction {
 public function execute(array $v, int $investorId, string $ip, string $idempotencyKey, string $idempotencyHash, string $endpoint, string $appId='AU INVEST'): array {
  return DB::transaction(function() use($v,$investorId,$ip,$idempotencyKey,$idempotencyHash,$endpoint,$appId){
   DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
   // idempotency inside tx F-10
   $inside=DB::table('idempotency_keys')->where('idempotency_key',$idempotencyKey)->where('user_id',$investorId)->where('endpoint',$endpoint)->lockForUpdate()->first();
   if($inside){ if($inside->request_hash!==$idempotencyHash) throw new \Illuminate\Validation\ValidationException(validator([],[]), ['Idempotency-Key'=>'already used with different payload']); return json_decode($inside->response_body,true); }
   $deal=DB::table('investment_deals')->where('id',$v['opportunity_id'])->lockForUpdate()->first();
   if(!$deal) throw new \RuntimeException('Opportunity not found',404);
   if(!in_array($deal->status,['draft','funding'],true)) throw new \RuntimeException('Deal not pledgeable in status '.$deal->status,409);
   $round=DB::table('funding_rounds')->where('id',$v['round_id'])->where('deal_id',$deal->id)->lockForUpdate()->first();
   if(!$round) throw new \RuntimeException('Funding round not found',404);
   if($round->status!=='open') throw new \RuntimeException('Round not open',409);
   $amount=(int)$v['amount_minor'];
   $wallet=DB::table('app_wallets')->where('user_id',$investorId)->where('currency','EGP')->where('app_id',$appId)->lockForUpdate()->first();
   if(!$wallet) throw new \RuntimeException('Wallet not found',404);
   $dto=new WalletOperationDTO((int)$wallet->id,$investorId,$amount,'escrow_lock',(string)($v['reference_uuid'] ?? (string)Str::uuid()),$appId,false,null,null,$ip);
   // delegate financial lock (debit) via EscrowLockService inside same outer tx — service has inner tx so avoid nested via manual?
   $prev=DB::table('app_wallets')->where('id',$wallet->id)->value('balance_subunit');
   if((int)$prev < $amount) throw new \RuntimeException('Insufficient funds',422);
   DB::table('app_wallets')->where('id',$wallet->id)->where('version',$wallet->version)->update(['balance_subunit'=>(int)$prev - $amount,'version'=>$wallet->version+1,'updated_at'=>now()]);
   if(DB::table('app_wallets')->where('id',$wallet->id)->where('balance_subunit',$prev - $amount)->count()===0) throw new \RuntimeException('Version conflict — retry',409);
   DB::table('wallet_transactions')->insert(['uuid'=>(string)Str::uuid(),'wallet_id'=>$wallet->id,'user_id'=>$investorId,'app_id'=>$appId,'type'=>'escrow_lock','amount_subunit'=>$amount,'balance_after_subunit'=>(int)$prev - $amount,'currency'=>'EGP','reference_uuid'=>$dto->referenceUuid,'hash_current'=>hash('sha256',$dto->referenceUuid.$amount.microtime(true)),'created_at'=>now(3)]);
   // investor ledger WORM chain
   $prevHash=DB::table('investor_ledgers')->where('deal_id',$deal->id)->orderByDesc('id')->value('hash_current');
   $cur=hash('sha256', ($prevHash??'').$investorId.$amount.now(3));
   DB::table('investor_ledgers')->insert(['deal_id'=>$deal->id,'investor_id'=>$investorId,'app_id'=>$appId,'amount_minor'=>$amount,'currency'=>'EGP','prev_hash'=>$prevHash,'hash_current'=>$cur,'created_at'=>now(3)]);
   DB::table('funding_rounds')->where('id',$round->id)->update(['raised_minor'=>(int)$round->raised_minor + $amount,'updated_at'=>now()]);
   $fresh=DB::table('funding_rounds')->where('id',$round->id)->first();
   if((int)$fresh->raised_minor >= (int)$fresh->target_minor){
    DB::table('funding_rounds')->where('id',$round->id)->update(['status'=>'closed']);
    DB::table('investment_deals')->where('id',$deal->id)->update(['status'=>'funded','funded_minor'=>(int)$fresh->raised_minor,'updated_at'=>now(3)]);
    try{ DB::table('escrow_contracts')->insert(['deal_id'=>$deal->id,'escrow_clearing_id'=>null,'status'=>'holding','amount_minor'=>$amount,'created_at'=>now(3)]); }catch(\Throwable){}
   } else {
    DB::table('investment_deals')->where('id',$deal->id)->update(['funded_minor'=>(int)$fresh->raised_minor + 0,'updated_at'=>now(3)]);
   }
   $result=['opportunity_id'=>$deal->id,'round_id'=>$round->id,'amount_minor'=>$amount,'status'=>'pledged','ledger_hash'=>$cur];
   DB::table('idempotency_keys')->insert(['idempotency_key'=>$idempotencyKey,'endpoint'=>$endpoint,'user_id'=>$investorId,'app_id'=>$appId,'request_hash'=>$idempotencyHash,'response_status'=>200,'response_body'=>json_encode($result),'created_at'=>now(3),'expires_at'=>now()->addHours(24)]);
   return $result;
  },3);
 }
}
