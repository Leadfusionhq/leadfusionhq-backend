#!/bin/bash
cd /home/ubuntu/var/www/html/leadfusionhq-backend
git fetch --all
git reset --hard origin/development
npm ci
pm2 reload leadfusion-api-test --update-env
