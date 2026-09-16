<?php
// B.12 F-13 — failed_jobs dead-letter for 3-attempt bulkhead — additive guard — Arena
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  if(!Schema::hasTable('failed_jobs')){
   Schema::create('failed_jobs', function(Blueprint $t){
    $t->id(); $t->string('uuid')->unique()->comment('queue failed uuid');
    $t->text('connection'); $t->text('queue'); $t->longText('payload'); $t->longText('exception'); $t->timestamp('failed_at')->useCurrent();
   });
  }
 }
 public function down(): void { /* additive */ }
};
