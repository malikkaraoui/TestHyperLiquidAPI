/**
 * 🧪 TEST SIMPLE - Validation de la structure
 * ============================================
 * 
 * Ce fichier teste rapidement si notre nouvelle structure fonctionne
 * avant d'intégrer à l'interface principale.
 */

import { HYPERLIQUID_ENDPOINTS } from '../config/endpoints.js';
import { hyperliquidApi } from '../api/hyperliquidService.js';
import { replaceParametersInObject } from '../utils/parameterUtils.js';

/**
 * 🎯 Test rapide de la configuration
 */
export async function runQuickTest() {
  console.log('🧪 [TEST] Démarrage des tests de structure...\n');

  // ✅ Test 1 : Vérification de la configuration des endpoints
  console.log('1️⃣ Test de la configuration des endpoints');
  console.log('📊 Endpoints Hyperliquid trouvés:', HYPERLIQUID_ENDPOINTS.length);
  
  // Afficher le premier endpoint pour vérification
  const firstEndpoint = HYPERLIQUID_ENDPOINTS[0];
  console.log('🔍 Premier endpoint:', {
    id: firstEndpoint.id,
    name: firstEndpoint.name,
    method: firstEndpoint.method,
    hasParams: firstEndpoint.parameters?.length > 0
  });

  // ✅ Test 2 : Test des utilitaires de paramètres
  console.log('\n2️⃣ Test des utilitaires de paramètres');
  
  const testTemplate = {
    type: 'test',
    user: '{{user_address}}',
    coin: '{{coin}}'
  };
  
  const testParams = {
    user_address: '0x123abc',
    coin: 'BTC'
  };
  
  const replaced = replaceParametersInObject(testTemplate, testParams);
  console.log('🔄 Remplacement de paramètres:', {
    original: testTemplate,
    replaced: replaced,
    success: replaced.user === '0x123abc' && replaced.coin === 'BTC'
  });

  // ✅ Test 3 : Test simple d'un endpoint (allMids)
  console.log('\n3️⃣ Test d\'un endpoint simple (allMids)');
  try {
    const allMidsEndpoint = HYPERLIQUID_ENDPOINTS.find(ep => ep.id === 'allMids');
    const result = await hyperliquidApi.executeRequest('allMids');
    
    console.log('📈 Test allMids:', {
      hasData: result && Object.keys(result).length > 0,
      sampleKeys: result ? Object.keys(result).slice(0, 3) : null
    });
  } catch (error) {
    console.log('❌ Erreur lors du test allMids:', error.message);
  }

  console.log('\n🎉 [TEST] Tests de structure terminés !');
  return true;
}