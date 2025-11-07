/**
 * 🧪 TEST SIMPLE - Validation de la structure
 * ============================================
 * 
 * Ce fichier teste rapidement si notre nouvelle structure fonctionne
 * avant d'intégrer à l'interface principale.
 */

import { PUBLIC_ENDPOINTS, getBeginnerEndpoints } from '../config/endpoints.js';
import { hyperliquidApi, testApiConnection } from '../api/hyperliquidService.js';
import { replaceParametersInObject } from '../utils/parameterUtils.js';

/**
 * 🎯 Test rapide de la configuration
 */
export async function runQuickTest() {
  console.log('🧪 [TEST] Démarrage des tests de structure...\n');

  // ✅ Test 1 : Vérification de la configuration des endpoints
  console.log('1️⃣ Test de la configuration des endpoints');
  console.log('📊 Endpoints publics trouvés:', PUBLIC_ENDPOINTS.length);
  console.log('🎓 Endpoints pour débutants:', getBeginnerEndpoints().length);
  
  // Afficher le premier endpoint pour vérification
  const firstEndpoint = PUBLIC_ENDPOINTS[0];
  console.log('🔍 Premier endpoint:', {
    id: firstEndpoint.id,
    name: firstEndpoint.name,
    method: firstEndpoint.method,
    hasParams: firstEndpoint.params?.length > 0
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

  // ✅ Test 3 : Test de connexion API (simple et rapide)
  console.log('\n3️⃣ Test de connexion API...');
  const connectionOk = await testApiConnection();
  console.log('🌐 Connexion API:', connectionOk ? '✅ OK' : '❌ ÉCHEC');

  // ✅ Test 4 : Test d'un endpoint simple (allMids)
  if (connectionOk) {
    console.log('\n4️⃣ Test d\'un endpoint simple (allMids)');
    try {
      const allMidsEndpoint = PUBLIC_ENDPOINTS.find(ep => ep.id === 'allMids');
      const result = await hyperliquidApi.executeRequest(allMidsEndpoint);
      
      console.log('📈 Test allMids:', {
        success: result.success,
        status: result.status,
        hasData: result.success && Object.keys(result.data).length > 0,
        sampleKeys: result.success ? Object.keys(result.data).slice(0, 3) : null
      });
    } catch (error) {
      console.log('❌ Erreur lors du test allMids:', error.message);
    }
  }

  console.log('\n🎉 [TEST] Tests de structure terminés !');
  return true;
}