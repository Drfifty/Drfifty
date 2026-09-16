<?php
// FingerprintService — Arena — B.3 — stable fingerprint via machine-id (NOT MAC) + AES-GCM encrypt
declare(strict_types=1);
namespace App\Services\Security;
final class FingerprintService {
 public static function generate(): string {
  $machine=@file_get_contents('/etc/machine-id') ?: @file_get_contents('/var/lib/dbus/machine-id') ?: gethostname() ?: 'fallback';
  $machine=trim((string)$machine);
  $domain=parse_url((string)config('app.url'), PHP_URL_HOST) ?: (function_exists('request')? request()->getHost() : 'localhost');
  $ip=@gethostbyname(gethostname() ?: '127.0.0.1');
  $keyHash=hash('sha256',(string)config('app.key'));
  $raw=json_encode(['k'=>$keyHash,'m'=>$machine,'d'=>$domain,'ip'=>$ip], JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION|JSON_SORT_KEYS);
  return hash('sha256',$raw);
 }
 public function verify(?string $storedHash): bool { return $storedHash!==null && hash_equals($storedHash, self::generate()); }
 public function encrypt(string $data): string {
  $key=hash('sha256',(string)config('app.key'),true);
  $iv=random_bytes(12); $tag='';
  $ct=openssl_encrypt($data,'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag);
  return base64_encode($iv.$tag.$ct);
 }
 public function decrypt(string $payload): string {
  $key=hash('sha256',(string)config('app.key'),true);
  $raw=base64_decode($payload,true) ?: '';
  $iv=substr($raw,0,12); $tag=substr($raw,12,16); $ct=substr($raw,28);
  return openssl_decrypt($ct,'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag) ?: '';
 }
}
