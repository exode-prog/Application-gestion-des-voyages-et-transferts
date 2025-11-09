#!/bin/bash

LOG_FILE="server-stop.log"
echo "$(date): === ARRET SERVEUR ===" | tee -a $LOG_FILE

log() {
    echo "$(date): $1" | tee -a $LOG_FILE
}

# Verifier si le serveur tourne
if [ ! -f server.pid ]; then
    log "Aucun PID sauvegarde trouve"
else
    PID=$(cat server.pid)
    log "PID sauvegarde: $PID"
fi

# Arreter par PID sauvegarde
if [ -f server.pid ]; then
    PID=$(cat server.pid)
    if kill $PID 2>/dev/null; then
        log "Serveur arrete via PID: $PID"
        rm server.pid
    else
        log "Echec arret via PID, processus peut-etre deja arrete"
        rm server.pid
    fi
fi

# Arreter par nom au cas ou
if pkill -f "node server.js"; then
    log "Processus supprime par nom"
else
    log "Aucun processus trouve par nom"
fi

# Verifier que tout est arrete
sleep 2
if ps aux | grep -q "[n]ode server.js"; then
    log "ATTENTION: Processus toujours en cours, arret force..."
    pkill -9 -f "node server.js"
else
    log "Serveur completement arrete"
fi

log "=== ARRET TERMINE ==="
