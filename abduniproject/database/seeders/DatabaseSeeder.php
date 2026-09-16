<?php
// DatabaseSeeder — B.12 F-01→F-05 aggregator — ordered canonical — Arena
declare(strict_types=1);
namespace Database\Seeders;
use Illuminate\Database\Seeder;
final class DatabaseSeeder extends Seeder {
 public function run(): void {
  $this->call([SuperAdminSeeder::class, FeatureFlagsSeeder::class, RegexDataLeakPatternsSeeder::class, MicroSwitchSeeder::class]);
 }
}
