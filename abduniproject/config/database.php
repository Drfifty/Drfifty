<?php
// ABD UNI PROJECT — Dual DB config (MySQL 8.4 core + PostgreSQL 16 clinical)
// MySQL 8.4: InnoDB utf8mb4 native Spatial — sole relational source for platform core
// PostgreSQL 16: PostGIS + pgcrypto — exclusive for AU MED PHI (AES-256-GCM)
// Rule 7: MySQL uses JSON (not JSONB) — JSONB is PostgreSQL-only, would hard-fail migration

declare(strict_types=1);

return [
    'default' => env('DB_CONNECTION', 'mysql'),

    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'abduniproject'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => 'InnoDB',
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
            'spatial' => true, // native MySQL 8.4 Spatial
        ],

        // AU MED clinical store only — never for core tables
        'pgsql' => [
            'driver' => 'pgsql',
            'host' => env('DB_PGSQL_HOST', '127.0.0.1'),
            'port' => env('DB_PGSQL_PORT', '5432'),
            'database' => env('DB_PGSQL_DATABASE', 'abduniproject_clinical'),
            'username' => env('DB_PGSQL_USERNAME', 'postgres'),
            'password' => env('DB_PGSQL_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => 'amed_',
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],
    ],

    'migrations' => 'migrations',

    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),
        'options' => ['cluster' => env('REDIS_CLUSTER', 'redis'), 'prefix' => env('REDIS_PREFIX', 'abduniproject_')],
        'default' => ['host' => env('REDIS_HOST', '127.0.0.1'), 'password' => env('REDIS_PASSWORD'), 'port' => env('REDIS_PORT', '6379'), 'database' => 0],
        'cache' => ['host' => env('REDIS_HOST', '127.0.0.1'), 'password' => env('REDIS_PASSWORD'), 'port' => env('REDIS_PORT', '6379'), 'database' => 1],
        'queue' => ['host' => env('REDIS_HOST', '127.0.0.1'), 'password' => env('REDIS_PASSWORD'), 'port' => env('REDIS_PORT', '6379'), 'database' => 2],
    ],
];
