#!/usr/bin/env bash

logName=$(date '+%Y-%m-%d_%H-%M-%S');

mkdir -p /var/log/nmcp

export DEBUG=nmcp*

node app.js >> /var/log/nmcp/${HOSTNAME}-${logName}.log 2>&1

