#!/bin/bash

function cleanup() {
    docker-compose down -v
    rm -r mongo-volume > /dev/null 2>&1
}

function cleanupWithPrompt() {
    read -p "Are you sure you want to cleanup MongoDB for this project? This will remove any previous database. Click any key to continue, or Ctrl - C to abort." -n 1 -r
    echo    # (optional) move to a new line
    if [[ ! $REPLY =~ ^[Yy]$ ]]
        cleanup
    then
        exit 1
    fi
}

while test $# -gt 0; do
    case "$1" in
        -n|--no-interaction)
            cleanup
            exit 0
            ;;
    esac
done
cleanupWithPrompt