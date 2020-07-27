#!/bin/sh

mkdir -p build/app/ &&
  cp -rf app/engine-ui build/app/engine-ui &&
  cp -rf app/retailerservice build/app/retailerservice &&
  cp -rf app/agents-headless build/app/agents-headless &&
  cp -rf app/agents-service build/app/agents-service