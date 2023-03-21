#!/bin/bash
read -p "Are you sure you want to setup MongoDB for this project? This will remove any previous database. Click any key to continue, or Ctrl - C to abort." -n 1 -r
echo    # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
    ./ci/mongo-cleanup.sh --no-interaction
    docker-compose up -d
then
    exit 1
fi