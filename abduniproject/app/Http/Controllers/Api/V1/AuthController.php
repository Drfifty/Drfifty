<?php
// AuthController — B.6 F-04/F-12/F-13 — Arena — ultra-thin 0 business logic — delegates to Actions — sets __Host-refresh cookie
declare(strict_types=1);
namespace App\Http\Controllers\Api\V1;
use Illuminate\Http\Request; use Illuminate\Http\JsonResponse; use Illuminate\Support\Facades\RateLimiter;
use App\Http\Requests\Auth\{LoginRequest,RegisterRequest};
use App\Http\Resources\AuthUserResource;
use App\Domain\Auth\Actions\{RegisterUserAction,LoginAction,RotateTokenAction};
final class AuthController {
 public function register(RegisterRequest $req, RegisterUserAction $action): JsonResponse {
  $key = 'auth-register:'.($req->ip().'|'.$req->email);
  if(RateLimiter::tooManyAttempts($key,5)) return response()->json(['message'=>'Too many attempts','code'=>'THROTTLED'],429)->header('Retry-After','60');
  RateLimiter::hit($key,60);
  $appId = $req->header('X-App-Id') ?? $req->input('app_id') ?? 'AU BUSINESS';
  $res = $action->execute($req->validated(), $req->ip() ?? '0.0.0.0', $req->userAgent() ?? '', $appId);
  $cookie = cookie(self::cookieName(), $res['tokens']['refresh_raw'], 60*24*7, '/api', null, true, true, false, 'lax');
  RateLimiter::clear($key);
  return response()->json(['user'=>new AuthUserResource($res['user']), 'access_token'=>$res['tokens']['access']['access_token'],'expires_in'=>$res['tokens']['access']['expires_in'],'token_type'=>'Bearer','meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->withCookie($cookie);
 }
 public function login(LoginRequest $req, LoginAction $action): JsonResponse {
  $key='auth-login:'.$req->ip().'|'.strtolower($req->email);
  if(RateLimiter::tooManyAttempts($key,5)) return response()->json(['message'=>'Too many attempts','code'=>'THROTTLED'],429)->header('Retry-After','60');
  RateLimiter::hit($key,60);
  try{
   $appId=$req->header('X-App-Id') ?? 'AU BUSINESS';
   $res=$action->execute($req->email,$req->password,$req->ip()??'0.0.0.0',$req->userAgent()??'',$appId);
  } catch(\RuntimeException $e){
   return response()->json(['message'=>$e->getMessage(),'code'=>'AUTH_FAILED'],$e->getCode()?:401);
  }
  $cookie=cookie(self::cookieName(), $res['tokens']['refresh_raw'], 60*24*7, '/api', null, true, true, false, 'lax');
  RateLimiter::clear($key);
  return response()->json(['user'=>new AuthUserResource($res['user']),'access_token'=>$res['tokens']['access']['access_token'],'expires_in'=>$res['tokens']['access']['expires_in'],'token_type'=>'Bearer','meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->withCookie($cookie);
 }
 public function refresh(Request $req, RotateTokenAction $rotator): JsonResponse {
  $raw=$req->cookie(self::cookieName()) ?? $req->cookie('refresh_token');
  if(!$raw) return response()->json(['message'=>'Refresh cookie missing','code'=>'REFRESH_MISSING'],401);
  $key='auth-refresh:'.$req->ip();
  if(RateLimiter::tooManyAttempts($key,10)) return response()->json(['message'=>'Too many refresh attempts'],429);
  RateLimiter::hit($key,60);
  try{
   $res=$rotator->refreshFromCookie($raw,$req->ip()??'0.0.0.0',$req->userAgent()??'');
   $user=\DB::table('users')->where('id',$res['user_id'])->first();
   $cookie=cookie(self::cookieName(), $res['refresh_raw'], 60*24*7, '/api', null, true, true, false, 'lax');
   RateLimiter::clear($key);
   return response()->json(['access_token'=>$res['access']['access_token'],'expires_in'=>$res['access']['expires_in'],'token_type'=>'Bearer','user'=>new AuthUserResource($user),'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200)->withCookie($cookie);
  }catch(\RuntimeException $e){
   // on reuse clear cookie
   $c=cookie(self::cookieName(),'',-1,'/api',null,true,true,false,'lax');
   return response()->json(['message'=>$e->getMessage(),'code'=>'REFRESH_INVALID'],$e->getCode()?:401)->withCookie($c);
  }
 }
 public function me(Request $req): JsonResponse {
  $user=$req->attributes->get('jwt_payload') ? \DB::table('users')->where('id',$req->attributes->get('jwt_payload')['sub'])->first() : $req->user();
  if(!$user) {
   $authUser=app()->bound('auth_user')?app('auth_user'):null;
   $user=$authUser;
  }
  if(!$user) return response()->json(['message'=>'Unauthenticated'],401);
  return response()->json(['data'=>new AuthUserResource($user),'meta'=>['trace_id'=>app()->bound('trace_id')?app('trace_id'):null]],200);
 }
 public function logout(Request $req): JsonResponse {
  $raw=$req->cookie(self::cookieName());
  if($raw){
   $hash=hash('sha256',trim($raw));
   try{ \DB::table('refresh_tokens')->where('token_hash',$hash)->update(['revoked_at'=>now()]); }catch(\Throwable){}
  }
  $c=cookie(self::cookieName(),'',-1,'/api',null,true,true,false,'lax');
  return response()->json(['message'=>'Logged out'],200)->withCookie($c);
 }
 private static function cookieName(): string { return env('JWT_REFRESH_COOKIE','__Host-refresh'); }
}
