<?php
// AuthenticateJwt — B.6 F-04 — Arena — verifies Bearer HS256 15m — 401 on fail — sets $request->user()
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use Illuminate\Support\Facades\DB; use App\Services\Auth\JwtService; use Symfony\Component\HttpFoundation\Response;
final class AuthenticateJwt {
 public function handle(Request $request, Closure $next): Response {
  $auth = $request->header('Authorization','');
  if(!str_starts_with($auth,'Bearer ')) return response()->json(['message'=>'Unauthenticated','code'=>'UNAUTHENTICATED'],401);
  $token = substr($auth,7);
  try{
   $payload = JwtService::verify($token);
   $user = DB::table('users')->where('id',$payload['sub'])->first();
   if(!$user) return response()->json(['message'=>'User not found','code'=>'USER_NOT_FOUND'],401);
   if(in_array($user->status ?? 'active',['banned','suspended'],true)) return response()->json(['message'=>'Account suspended','code'=>'ACCOUNT_SUSPENDED'],403);
   $request->attributes->set('jwt_payload',$payload);
   $request->setUserResolver(fn()=> $this->toUserModel($user));
   app()->instance('auth_user',$user);
   // bind app_id from token if header missing
   if(!$request->header('X-App-Id') && isset($payload['app_id'])) {
    $request->headers->set('X-App-Id',$payload['app_id']);
    $request->attributes->set('app_id',$payload['app_id']);
   }
  } catch(\RuntimeException $e){
   $code = $e->getCode() ?: 401;
   return response()->json(['message'=>$e->getMessage(),'code'=>'TOKEN_INVALID'], $code===401?401:401);
  }
  return $next($request);
 }
 private function toUserModel($row){
  $u = new \App\Models\User(); // if exists else generic
  if(class_exists(\App\Models\User::class)) {
   $m = \App\Models\User::find($row->id); if($m) return $m;
  }
  // lightweight stdClass with hasRole stub
  $obj = $row;
  $obj->hasRole = fn($slug)=> DB::table('user_roles')->join('roles','roles.id','=','user_roles.role_id')->where('user_roles.user_id',$row->id)->where('roles.slug',$slug)->exists();
  return $obj;
 }
}
