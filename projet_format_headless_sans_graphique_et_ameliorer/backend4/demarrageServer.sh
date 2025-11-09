#!/bin/bash

{
echo "=== DEMARRAGE SERVEUR EN ARRIERE-PLAN ==="

# Arreter les anciens processus
pkill -f "node server.js" || echo "Aucun processus server.js en cours"
sleep 3

# SWAP
if [ -f /swapfile2 ]; then
    sudo swapon /swapfile2 2>/dev/null && echo "SWAP active"
fi

# Tester MongoDB
timeout 10 mongosh --eval "db.adminCommand('ping')" && echo "MongoDB fonctionne" || echo "MongoDB echoue"

# Demarrer le serveur
echo "Démarrage du serveur Node.js..."
nohup node server.js > server.log 2>&1 &
echo $! > server.pid

echo "Serveur demarre avec PID: $(cat server.pid)"
echo "URL: http://172.237.112.125:5000"


} > /home/exode/datacollect/backend4/demarrage.log 2>&1 &
