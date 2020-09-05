#!/bin/sh

mkdir -p build/app/ &&
  cp -rf app/web-app build/app/web-app &&
  cp -rf app/hello-retailer build/app/hello-retailer &&
  cp -rf app/headless-producer build/app/headless-producer &&
  cp -rf app/service-producer build/app/service-producer