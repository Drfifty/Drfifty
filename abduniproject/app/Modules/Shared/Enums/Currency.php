<?php
// العملات — Multi-Currency Ledger: لا عملة أساس، كل محفظة بعملة صريحة

declare(strict_types=1);

namespace App\Modules\Shared\Enums;

enum Currency: string
{
    case EGP = 'EGP';
    case USD = 'USD';
    case SAR = 'SAR';
    case AED = 'AED';
    // Super Admin يضيف عملات ديناميكياً عبر exchange_rates + admin panel
    case EUR = 'EUR';
    case GBP = 'GBP';
    case KWD = 'KWD';
    case QAR = 'QAR';

    public static function isSupported(string $code): bool
    {
        return self::tryFrom(strtoupper($code)) !== null;
    }
}
