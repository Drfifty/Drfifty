<?php
declare(strict_types=1);
namespace App\Jobs;
use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Support\Facades\DB;
final class HitlBudgetAlertJob implements ShouldQueue { use Dispatchable, Queueable; public function __construct(public int $agentId){} public function handle(): void { try{ DB::table('hitl_queue')->insert(['agent_id'=>$this->agentId,'type'=>'BUDGET_EXHAUSTED','payload'=>json_encode(['agent'=>$this->agentId]),'created_at'=>now()]); }catch(\Throwable){} } }
