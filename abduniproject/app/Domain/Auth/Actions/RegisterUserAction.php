<?php
// RegisterUserAction — B.6 F-13 — Arena — thin DDD Action SRP ≤150L — creates user + wallet + tokens
declare(strict_types=1);
namespace App\Domain\Auth\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Hash; use Illuminate\Support\Str;
final class RegisterUserAction {
 public function execute(array $data, string $ip, string $ua, string $appId='AU BUSINESS'): array {
  return DB::transaction(function() use($data,$ip,$ua,$appId){
   $existing = DB::table('users')->where('email', $data['email'])->first();
   if($existing) throw new \RuntimeException('Email already registered',422);
   $uuid = (string) Str::uuid();
   $userId = DB::table('users')->insertGetId([
    'uuid'=>$uuid,'app_id'=>$appId,'name'=>$data['name'],'email'=>strtolower(trim($data['email'])),
    'password'=>Hash::make($data['password']),'phone_encrypted'=>null,
    'status'=>'active','mfa_enabled'=>false,'failed_mfa_attempts'=>0,
    'email_verified_at'=>null,'created_at'=>now(),'updated_at'=>now(),
   ]);
   // default wallet per app_id+EGP (uk_user_currency)
   try{
    DB::table('app_wallets')->insert([
     'uuid'=>(string)Str::uuid(),'user_id'=>$userId,'app_id'=>$appId,'currency'=>'EGP',
     'balance_subunit'=>0,'locked_subunit'=>0,'status'=>'active','version'=>0,
     'created_at'=>now(),'updated_at'=>now(),
    ]);
   }catch(\Throwable){}
   $tokens = app(\App\Domain\Auth\Actions\RotateTokenAction::class)->issueFamily($userId,$ip,$ua,$appId);
   $user = DB::table('users')->where('id',$userId)->first();
   return ['user'=>$user,'tokens'=>$tokens];
  });
 }
}
