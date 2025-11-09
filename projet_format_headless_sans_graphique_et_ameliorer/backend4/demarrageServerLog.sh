#!/bin/bash

LOG_FILE="server-start.log"
echo "$(date): === DEMARRAGE SERVEUR AVEC OPTIMISATION ===" | tee -a $LOG_FILE

# Fonction de logging
log() {
    echo "$(date): $1" | tee -a $LOG_FILE
}

# Nettoyage des processus precedents
log "Nettoyage des processus existants..."
pkill -f "node server.js" && log "Processus server.js arrete" || log "Aucun processus server.js trouve"
pkill -f "node.*whatsapp" && log "Processus WhatsApp arrete" || log "Aucun processus WhatsApp trouve"

# Attendre que les processus se terminent
sleep 3

# Verification memoire
log "=== ETAT MEMOIRE ==="
free -h | tee -a $LOG_FILE

# Gestion SWAP
log "Verification SWAP..."
if swapon --show | grep -q "/swapfile2"; then
    log "SWAP deja active"
else
    if [ -f /swapfile2 ]; then
        sudo swapon /swapfile2 && log "SWAP existant active" || log "Echec activation SWAP"
    else
        log "Creation nouveau SWAP..."
        sudo fallocate -l 2G /swapfile2 2>/dev/null || sudo dd if=/dev/zero of=/swapfile2 bs=1M count=2048 status=none
        sudo chmod 600 /swapfile2
        sudo mkswap /swapfile2 > /dev/null
        sudo swapon /swapfile2 && log "Nouveau SWAP cree et active" || log "Echec creation SWAP"
    fi
fi

# Redemarrage MongoDB
log "Redemarrage MongoDB..."
sudo systemctl restart mongod
sleep 8

# Test MongoDB
log "Test connexion MongoDB..."
if node -e "require('mongodb').MongoClient.connect('mongodb://127.0.0.1:27017', {serverSelectionTimeoutMS: 3000}).then(client => { console.log('MongoDB OK'); client.close(); process.exit(0); }).catch(err => { console.log('MongoDB erreur:', err.message); process.exit(1); });" 2>/dev/null; then
    log "MongoDB pret"
else
    log "MongoDB echec - nouvel essai..."
    sleep 5
    sudo systemctl restart mongod
    sleep 8
fi

# Nettoyage des logs trop volumineux
log "Nettoyage des logs..."
find . -name "*.log" -size +100M -exec truncate -s 50M {} \; 2>/dev/null && log "Logs nettoyes" || log "Aucun log volumineux"

# Derniere verification memoire
log "=== ETAT FINAL MEMOIRE ==="
free -h | tee -a $LOG_FILE

# Demarrage du serveur
log "=== DEMARRAGE APPLICATION ==="
log "Lancement: node server.js"
log "Logs detaillees dans: $LOG_FILE"
echo ""

# Executer le serveur
node server.js
