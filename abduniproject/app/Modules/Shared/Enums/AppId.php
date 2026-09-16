<?php
// معرف التطبيق — السياق متعدد المستأجرين (app_id space-form)

declare(strict_types=1);

namespace App\Modules\Shared\Enums;

enum AppId: string
{
    case AuBusiness = 'AU BUSINESS';
    case AuMed = 'AU MED';
    case AuDeals = 'AU DEALS';
    case AuServ = 'AU SERV';
    case AuInvest = 'AU INVEST';

    public function dbPrefix(): string
    {
        return match ($this) {
            self::AuBusiness => 'ab_',
            self::AuMed => 'amed_',
            self::AuDeals => 'adl_',
            self::AuServ => 'asv_',
            self::AuInvest => 'ainv_',
        };
    }

    public function namespace(): string
    {
        return match ($this) {
            self::AuBusiness => 'app/Modules/AUBusiness/',
            self::AuMed => 'app/Modules/AUMed/',
            self::AuDeals => 'app/Modules/AUDeals/',
            self::AuServ => 'app/Modules/AUServ/',
            self::AuInvest => 'app/Modules/AUInvest/',
        };
    }

    public function isCore(): bool
    {
        return $this === self::AuBusiness;
    }
}
