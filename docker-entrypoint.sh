#!/bin/sh
set -e

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
until nc -z -v -w30 mysql 3306
do
  echo "Waiting for MySQL connection..."
  sleep 5
done
echo "MySQL is ready!"

# Wait for RabbitMQ to be ready
echo "Waiting for RabbitMQ to be ready..."
until nc -z -v -w30 rabbitmq 5672
do
  echo "Waiting for RabbitMQ connection..."
  sleep 5
done
echo "RabbitMQ is ready!"

# Run migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate

# Run seeders (ignore errors)
echo "Running database seeders..."
npx sequelize-cli db:seed:all || echo "Seeders may have already been run, continuing..."

# Start the application
echo "Starting the application..."
exec "$@"
