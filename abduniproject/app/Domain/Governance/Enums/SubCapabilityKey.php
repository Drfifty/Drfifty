<?php
// SubCapabilityKey — Arena — exhaustive enum prevents privilege escalation via guessing (B.3)
declare(strict_types=1);
namespace App\Domain\Governance\Enums;
enum SubCapabilityKey: string {
 // Deals
 case DEALS_CREATE='deals.create'; case DEALS_EDIT='deals.edit'; case DEALS_DELETE='deals.delete';
 case DEALS_BULK_IMPORT='deals.bulk_import'; case DEALS_PROMOTE='deals.promote';
 // Serv
 case SERV_DISPATCH='serv.dispatch'; case SERV_REASSIGN='serv.reassign'; case SERV_TUTORING_CREATE='serv.tutoring.create';
 // Invest
 case INVEST_FRACTIONAL_ISSUE='invest.fractional.issue'; case INVEST_CAMPAIGN_CREATE='invest.campaign.create';
 // Escrow/Wallet
 case ESCROW_LOCK='escrow.lock'; case ESCROW_RELEASE='escrow.release'; case ESCROW_REFUND='escrow.refund'; case WALLET_ADJUST='wallet.adjust';
 // Agents/Calibrator
 case AGENTS_DEPLOY='agents.deploy'; case CALIBRATOR_OVERRIDE='calibrator.override';
 // Governance + HITL + Calibrator — B.8 F-03/F-05/F-10 extended
 case GOVERNANCE_MICRO_TOGGLE='governance.micro.toggle'; case GOVERNANCE_DRM_DISARM='governance.drm.disarm'; case GOVERNANCE_DRM_ANNIHILATE='governance.drm.annihilate';
 case SYSTEM_MODULE_TOGGLE='system.module.toggle'; case HITL_APPROVE='hitl.approve'; case HITL_QUEUE='hitl.queue'; case CALIBRATOR_PREOP='calibrator.preop';
 // Workforce — B.9 F-02 — exhaustive catalog vs tenant vs dispatch
 case WORKFORCE_CATALOG_VIEW='workforce.catalog.view'; case WORKFORCE_CHECKOUT='workforce.checkout'; case WORKFORCE_TENANT_VIEW='workforce.tenant.view'; case WORKFORCE_DISPATCH='workforce.dispatch'; case WORKFORCE_LOGS_VIEW='workforce.logs.view';
 public static function isValid(string $v): bool { return self::tryFrom($v)!==null; }
}
