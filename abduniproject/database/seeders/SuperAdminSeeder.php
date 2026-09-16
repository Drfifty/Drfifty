<?php
// SuperAdminSeeder — B.12 F-02 — immutable root AU BUSINESS — Zero-Trust 5 checks — idempotent — Arena
declare(strict_types=1);
namespace Database\Seeders;
use Illuminate\Database\Seeder; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Hash; use Illuminate\Support\Str;
final class SuperAdminSeeder extends Seeder {
 public function run(): void {
  if (!DB::table('information_schema.tables')->where('table_name','users')->exists() && !\Illuminate\Support\Facades\Schema::hasTable('users')) return;
  $email = (string) env('SUPERADMIN_EMAIL', 'superadmin@abduni.com');
  $pass = (string) env('SUPERADMIN_PASS', 'Arena-Super-2026!');
  $uuid = (string) Str::uuid();
  $now = now('Africa/Cairo');
  $existing = DB::table('users')->where('email', $email)->first();
  if ($existing) { // refresh hash if env changed, keep idempotent
   DB::table('users')->where('id',$existing->id)->update(['password'=>Hash::make($pass),'email_verified_at'=>$existing->email_verified_at ?? $now, 'status'=>'active','mfa_enabled'=>1,'updated_at'=>$now]);
   $userId=$existing->id;
  } else {
   $userId = DB::table('users')->insertGetId(['uuid'=>$uuid,'app_id'=>'AU BUSINESS','name'=>'Super Admin','email'=>$email,'email_verified_at'=>$now,'password'=>Hash::make($pass),'locale'=>'ar','status'=>'active','mfa_enabled'=>1,'created_at'=>$now,'updated_at'=>$now]);
  }
  // ensure super_admin role exists (seeded via 000010)
  $role = DB::table('roles')->where('slug','super_admin')->first();
  if($role && !DB::table('user_roles')->where(['user_id'=>$userId,'role_id'=>$role->id,'app_id'=>'AU BUSINESS'])->exists()){
   DB::table('user_roles')->insert(['user_id'=>$userId,'role_id'=>$role->id,'app_id'=>'AU BUSINESS','assigned_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
  }
  // audit WORM
  try{ DB::table('security_audit_logs')->insert(['uuid'=>(string)Str::uuid(),'trace_id'=>bin2hex(random_bytes(16)),'user_id'=>$userId,'app_id'=>'AU BUSINESS','action'=>'SEED_SUPER_ADMIN','route'=>'seeders/SuperAdminSeeder','method'=>'CLI','payload_hash'=>hash('sha256',$email),'ip_address'=>'127.0.0.1','created_at'=>$now]); }catch(\Throwable){}
 }
}
