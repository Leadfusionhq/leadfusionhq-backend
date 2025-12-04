#!/bin/bash

echo "----- Deploying STAGING API -----"

cd /home/ubuntu/var/www/html/leadfusionhq-staging

echo "Fetching latest code..."
git fetch --all
git reset --hard origin/staging

echo "Installing dependencies..."
npm ci --omit=dev

echo "Reloading PM2..."
pm2 reload leadfusion-staging-api --update-env

echo "STAGING deployment complete!"
