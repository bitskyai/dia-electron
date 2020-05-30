#!/bin/sh

mkdir -p build/app/ &&
  cp -rf app/engine-ui build/app/engine-ui &&
  cp -rf app/analystservice build/app/analystservice &&
  cp -rf app/agents-headless build/app/agents-headless &&
  cp -rf app/agents-service build/app/agents-service