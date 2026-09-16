<?php
// LoginAction — B.6 F-04/F-12 — Arena — bcrypt verify + status gate + throttle via outside RateLimiter
declare(strict_types=1);
namespace App\Domain\Auth\Actions;
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Hash; use Illuminate\Support\Facades\Cache;
final class LoginAction {
 public function execute(string $email, string $password, string $ip, string $ua, string $appId='AU BUSINESS'): array {
  $user = DB::table('users')->where('email', strtolower(trim($email)))->first();
  if(!$user || !Hash::check($password, $user->password)){
   throw new \RuntimeException('Invalid credentials',401);
  }
  if(in_array($user->status ?? 'active',['banned','suspended'],true)){
   throw new \RuntimeException('Account suspended',403);
  }
  if(($user->failed_mfa_attempts ?? 0) >= 3){
   DB::table('users')->where('id',$user->id)->update(['status'=>'frozen_soft']);
   throw new \RuntimeException('Account frozen — too many attempts',503);
  }
  // reset failed on success
  try{ DB::table('users')->where('id',$user->id)->update(['failed_mfa_attempts'=>0,'last_login_at'=>now()]); }catch(\Throwable){}
  $tokens = app(RotateTokenAction::class)->issueFamily((int)$user->id,$ip,$ua,$appId);
  return ['user'=>$user,'tokens'=>$tokens];
 }
}
