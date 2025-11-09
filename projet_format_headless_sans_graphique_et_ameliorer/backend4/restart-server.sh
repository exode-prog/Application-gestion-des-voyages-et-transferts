#!/bin/bash

echo "=== REDEMARRAGE SERVEUR ==="

# Arreter d'abord
./stop-server.sh

# Attendre
sleep 5

# Redemarrer
./start-server-with-logs.sh
