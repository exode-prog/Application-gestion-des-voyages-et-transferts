#!/bin/bash

LOG_FILE="server-check.log"
echo "$(date): === VERIFICATION SERVEUR ===" | tee -a $LOG_FILE

log() {
    echo "$(date): $1" | tee -a $LOG_FILE
}

log "Adresse: http://172.237.112.125:5000"

# Verifier processus
if ps aux | grep -q "[n]ode server.js"; then
    PID=$(ps aux | grep '[n]ode server.js' | awk '{print $2}')
    log "STATUS: Serveur en cours d execution (PID: $PID)"
else
    log "STATUS: Serveur arrete"
    exit 1
fi

# Verifier port
if netstat -tln | grep -q :5000; then
    log "PORT: 5000 en ecoute"
else
    log "PORT: 5000 non actif"
fi

# Verifier logs recentes
if [ -f server-app.log ]; then
    LAST_LOG=$(tail -1 server-app.log)
    log "Derniere log application: ${LAST_LOG:0:100}"
fi

if [ -f server.pid ]; then
    log "PID sauvegarde: $(cat server.pid)"
fi

# Test sante
log "Test endpoint sante..."
curl -s --connect-timeout 10 http://172.237.112.125:5000/health > /dev/null
if [ $? -eq 0 ]; then
    log "TEST SANTE: OK"
else
    log "TEST SANTE: ECHEC"
fi

# Test API docs
log "Test documentation API..."
curl -s --connect-timeout 10 http://172.237.112.125:5000/api-docs > /dev/null
if [ $? -eq 0 ]; then
    log "TEST DOCS: OK"
else
    log "TEST DOCS: ECHEC"
fi

log "=== VERIFICATION TERMINEE ==="
