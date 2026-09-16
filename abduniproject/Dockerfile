# ABD UNI PROJECT — Dockerfile multistage — PHP 8.4-FPM + Opcache JIT — B.11 F-13 — Arena
# Laragon=local dev, Docker=prod — never cross-apply — default FPM, Octane opt-in via OCTANE=1 (R31 YAGNI)
ARG OCTANE=0
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts || composer install --no-interaction

FROM php:8.4-fpm-alpine AS base
RUN apk add --no-cache $PHPIZE_DEPS linux-headers icu-dev libzip-dev postgresql-dev curl-dev \
 && docker-php-ext-configure zip && docker-php-ext-install pdo_mysql pdo_pgsql opcache zip \
 && pecl install redis && docker-php-ext-enable redis \
 && apk del $PHPIZE_DEPS
# Opcache JIT prod
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
WORKDIR /var/www
COPY . .
COPY --from=vendor /app/vendor ./vendor
RUN chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
EXPOSE 9000
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD php artisan about --only=environment || exit 1

FROM base AS octane
# Optional Swoole/Octane stage — built only when OCTANE=1 — keeps base lean (R31)
ARG OCTANE
RUN if [ "$OCTANE" = "1" ]; then apk add --no-cache libstdc++ && pecl install swoole && docker-php-ext-enable swoole && composer require laravel/octane --no-interaction; fi
CMD ["sh","-c","if [ \"$OCTANE\" = \"1\" ]; then php artisan octane:start --host=0.0.0.0 --port=8000; else php-fpm; fi"]
