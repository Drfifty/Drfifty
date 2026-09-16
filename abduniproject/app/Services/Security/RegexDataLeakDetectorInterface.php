<?php
declare(strict_types=1);
namespace App\Services\Security;
interface RegexDataLeakDetectorInterface {
 /** @return array{clean:bool, sanitized:string, leaks: string[], action: 'PASS'|'REDACT'|'BLOCK'} */
 public function scan(string $input, string $routeGroup='chat'): array;
 public function containsLeak(string $input): bool;
 /** @param array<string,mixed> $payload @return array{payload:array<string,mixed>, leaked:bool} */
 public function sanitizePayload(array $payload, string $routeGroup='chat'): array;
}
