<?php
declare(strict_types=1);
namespace App\Domain\Escrow\Enums;
enum ActorType: string { case BUYER='buyer'; case SELLER='seller'; case AGENT_CFO='agent_cfo'; case SUPER_ADMIN='super_admin'; case SYSTEM='system'; case AGENT_13_FRAUD='agent_13_fraud'; }
