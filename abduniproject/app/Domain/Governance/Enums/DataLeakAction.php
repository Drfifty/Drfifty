<?php
declare(strict_types=1);
namespace App\Domain\Governance\Enums;
enum DataLeakAction: string { case BLOCK='BLOCK'; case REDACT='REDACT'; case WARN='WARN'; }
