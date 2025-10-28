# Usa PHP con Apache
FROM php:8.2-apache

# Instala extensiones necesarias
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Copia todos los archivos del proyecto
COPY . /var/www/html/

# Expone el puerto 80
EXPOSE 80