#!/bin/bash

echo "========================================"
echo "VÉRIFICATION MONGODB ET RAM"
echo "Date: $(date)"
echo "========================================"
echo ""

echo "--- 1. CONFIGURATION MONGODB ---"
echo ""

echo "A. Cache Size (doit être 0.25 Go = 256 Mo)"
grep -A 1 "cacheSizeGB" /etc/mongod.conf | grep -v "^--$"
echo ""

echo "B. Compression (doit être snappy)"
grep -A 3 "engineConfig:" /etc/mongod.conf | grep "Compressor"
grep -A 2 "collectionConfig:" /etc/mongod.conf | grep "Compressor"
echo ""

echo "C. Profiling (doit être off)"
grep -A 1 "operationProfiling:" /etc/mongod.conf
echo ""

echo "D. BindIp (doit être 127.0.0.1)"
grep -A 2 "^net:" /etc/mongod.conf | grep bindIp
echo ""

echo "--- 2. ÉTAT RAM ET SWAP ---"
echo ""

echo "A. Utilisation mémoire"
free -h
echo ""

echo "B. Swapfile configuré"
swapon --show
echo ""

echo "C. Swappiness (doit être 10)"
echo "Valeur actuelle: $(cat /proc/sys/vm/swappiness)"
echo "Configuration permanente:"
grep swappiness /etc/sysctl.conf
echo ""

echo "--- 3. ÉTAT MONGODB ---"
echo ""

echo "A. Service MongoDB"
systemctl status mongod --no-pager | head -5
echo ""

echo "B. Port d'écoute (doit être 127.0.0.1:27017)"
sudo netstat -tlnp | grep 27017
echo ""

echo "--- 4. PROCESSUS CONSOMMATEURS ---"
echo ""
echo "Top 5 processus RAM:"
ps aux --sort=-%mem | head -6
echo ""

echo "========================================"
echo "FIN DE LA VÉRIFICATION"
echo "========================================"
