#!/bin/bash

# ✅ Script de test pour vérifier les soumissions
# Créer ce fichier : backend4/test-submission.sh
# chmod +x test-submission.sh
# ./test-submission.sh

echo "🧪 TEST DES ROUTES DE SOUMISSION"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL de base
BASE_URL="http://localhost:5000/api/documents"

# Créer un fichier de test temporaire
TEST_FILE="/tmp/test-document.txt"
echo "Ceci est un document de test" > $TEST_FILE

echo "📝 Fichier de test créé : $TEST_FILE"
echo ""

# ==========================================
# TEST 1 : SOUMISSION VOYAGE
# ==========================================

echo "${YELLOW}TEST 1 : Soumission VOYAGE${NC}"
echo "----------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/submit" \
  -F "nom=Diop" \
  -F "prenom=Aminata" \
  -F "email=aminata.test@example.com" \
  -F "telephone=+221771234567" \
  -F "profession=Commerçante" \
  -F "sexe=F" \
  -F "pays=FR" \
  -F "raison=formation" \
  -F "dateDebut=2025-10-20" \
  -F "dateFin=2025-10-25" \
  -F "files=@$TEST_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
  echo -e "${GREEN}✅ SUCCÈS${NC} - Code: $HTTP_CODE"
  echo "Réponse:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}❌ ÉCHEC${NC} - Code: $HTTP_CODE"
  echo "Réponse:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""

# ==========================================
# TEST 2 : SOUMISSION TRANSFERT
# ==========================================

echo "${YELLOW}TEST 2 : Soumission TRANSFERT${NC}"
echo "-------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/submit-transfert" \
  -F "nom=Sow" \
  -F "prenom=Mamadou" \
  -F "email=mamadou.test@example.com" \
  -F "telephone=+221771234568" \
  -F "profession=Entrepreneur" \
  -F "sexe=H" \
  -F "typeTransfert=Achat de services" \
  -F "dateDebut=2025-10-18" \
  -F "dateFin=2025-10-30" \
  -F "files=@$TEST_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
  echo -e "${GREEN}✅ SUCCÈS${NC} - Code: $HTTP_CODE"
  echo "Réponse:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}❌ ÉCHEC${NC} - Code: $HTTP_CODE"
  echo "Réponse:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""

# ==========================================
# TEST 3 : RÉCUPÉRATION ADMIN
# ==========================================

echo "${YELLOW}TEST 3 : Récupération admin (sans auth)${NC}"
echo "---------------------------------------"
echo "Note: Cette requête devrait échouer car elle nécessite une authentification"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/admin/dossiers")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "403" ]; then
  echo -e "${GREEN}✅ PROTECTION OK${NC} - Code: $HTTP_CODE (authentification requise)"
else
  echo -e "${YELLOW}⚠️  ATTENTION${NC} - Code: $HTTP_CODE"
  echo "La route admin devrait être protégée"
fi

echo ""

# ==========================================
# TEST 4 : VÉRIFICATION MONGODB
# ==========================================

echo "${YELLOW}TEST 4 : Vérification MongoDB${NC}"
echo "------------------------------"

if command -v mongosh &> /dev/null; then
  echo "Comptage des documents dans la base:"
  
  TOTAL=$(mongosh datacollectapp --quiet --eval "db.documents.countDocuments()" 2>/dev/null)
  VOYAGES=$(mongosh datacollectapp --quiet --eval "db.documents.countDocuments({typeDocument:'voyage'})" 2>/dev/null)
  TRANSFERTS=$(mongosh datacollectapp --quiet --eval "db.documents.countDocuments({typeDocument:'transfert'})" 2>/dev/null)
  
  echo "  📊 Total documents: $TOTAL"
  echo "  ✈️  Voyages: $VOYAGES"
  echo "  💸 Transferts: $TRANSFERTS"
  
  if [ "$TOTAL" -gt 0 ]; then
    echo -e "${GREEN}✅ Documents créés avec succès${NC}"
  else
    echo -e "${RED}❌ Aucun document trouvé${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  mongosh non disponible${NC}"
  echo "Vérification MongoDB manuelle requise"
fi

echo ""

# ==========================================
# NETTOYAGE
# ==========================================

rm -f $TEST_FILE
echo "🧹 Fichier de test supprimé"

echo ""
echo "================================"
echo "🎯 RÉSUMÉ DES TESTS"
echo "================================"
echo ""
echo "Si tous les tests sont verts (✅), votre application fonctionne correctement !"
echo ""
echo "Prochaines étapes:"
echo "  1. Tester depuis le frontend (http://localhost:3000)"
echo "  2. Vérifier l'interface admin"
echo "  3. Tester les changements de statut"
echo ""
