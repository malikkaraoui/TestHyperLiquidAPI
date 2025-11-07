/**
 * 🔧 PARAMETER UTILITIES
 * ======================
 * 
 * Utilitaires pour la gestion et le remplacement des paramètres
 * dans les templates d'endpoints API.
 * 
 * 🎯 Fonctionnalités :
 * - Remplacement de placeholders {{param}} dans les objets
 * - Validation des paramètres
 * - Conversion de types
 * - Gestion des valeurs par défaut
 */

/**
 * 🔄 Remplace récursivement tous les placeholders dans un objet
 * 
 * Cherche les patterns {{paramName}} et les remplace par les valeurs
 * fournies dans le mappage des paramètres.
 * 
 * @param {any} value - Valeur à traiter (objet, string, array, etc.)
 * @param {Object} parameterMap - Map des paramètres {nom: valeur}
 * @returns {any} Valeur avec les paramètres remplacés
 * 
 * @example
 * const template = { type: "user", address: "{{user_address}}" };
 * const params = { user_address: "0x123..." };
 * const result = replaceParametersInObject(template, params);
 * // => { type: "user", address: "0x123..." }
 */
export function replaceParametersInObject(value, parameterMap) {
  // 🔍 Cas de base : valeur nulle/undefined
  if (value == null) {
    return value;
  }

  // 📝 Cas string : remplacer les placeholders
  if (typeof value === 'string') {
    return replaceParametersInString(value, parameterMap);
  }

  // 📋 Cas array : traiter chaque élément
  if (Array.isArray(value)) {
    return value.map(item => replaceParametersInObject(item, parameterMap));
  }

  // 🎯 Cas objet : traiter chaque propriété
  if (typeof value === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = replaceParametersInObject(val, parameterMap);
    }
    return result;
  }

  // 🔢 Autres types : retourner tel quel (number, boolean, etc.)
  return value;
}

/**
 * 📝 Remplace les placeholders dans une chaîne de caractères
 * 
 * @param {string} text - Texte contenant des {{placeholders}}
 * @param {Object} parameterMap - Map des paramètres
 * @returns {string} Texte avec paramètres remplacés
 */
export function replaceParametersInString(text, parameterMap) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
    const value = parameterMap[paramName];
    
    // Si le paramètre n'existe pas, garder le placeholder
    if (value === undefined || value === null) {
      console.warn(`⚠️ [Params] Paramètre manquant: ${paramName}`);
      return match; // Garder {{paramName}}
    }
    
    // Convertir en string
    return String(value);
  });
}

/**
 * ✅ Valide les paramètres requis pour un endpoint
 * 
 * @param {Array} requiredParams - Liste des paramètres requis de l'endpoint
 * @param {Object} providedParams - Paramètres fournis par l'utilisateur
 * @returns {Object} Résultat de validation { valid: boolean, missing: Array, errors: Array }
 */
export function validateParameters(requiredParams, providedParams) {
  const missing = [];
  const errors = [];

  // Vérifier chaque paramètre requis
  for (const param of requiredParams) {
    const value = providedParams[param.name];
    
    // Vérifier si le paramètre est présent
    if (param.required && (value === undefined || value === null || value === '')) {
      missing.push(param.name);
      continue;
    }

    // Si pas de valeur et pas requis, passer au suivant
    if (!value) continue;

    // Valider le type selon la configuration du paramètre
    const typeError = validateParameterType(param, value);
    if (typeError) {
      errors.push(`${param.name}: ${typeError}`);
    }

    // Valider avec regex si spécifié
    if (param.validation && !new RegExp(param.validation).test(value)) {
      errors.push(`${param.name}: Format invalide`);
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

/**
 * 🔍 Valide le type d'un paramètre spécifique
 * 
 * @param {Object} paramConfig - Configuration du paramètre
 * @param {any} value - Valeur à valider
 * @returns {string|null} Message d'erreur ou null si valide
 */
function validateParameterType(paramConfig, value) {
  switch (paramConfig.type) {
    case 'string': {
      if (typeof value !== 'string') {
        return 'Doit être une chaîne de caractères';
      }
      break;
    }
      
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        return 'Doit être un nombre valide';
      }
      break;
    }
      
    case 'select': {
      if (paramConfig.options && !paramConfig.options.includes(value)) {
        return `Doit être une des valeurs: ${paramConfig.options.join(', ')}`;
      }
      break;
    }
      
    default:
      // Type non reconnu, pas d'erreur
      break;
  }
  
  return null;
}

/**
 * 🎨 Formate la valeur d'un paramètre selon son type
 * 
 * @param {Object} paramConfig - Configuration du paramètre
 * @param {any} value - Valeur brute
 * @returns {any} Valeur formatée
 */
export function formatParameterValue(paramConfig, value) {
  if (!value) return value;

  switch (paramConfig.type) {
    case 'number':
      return Number(value);
      
    case 'string':
      return String(value).trim();
      
    case 'select':
      return String(value);
      
    default:
      return value;
  }
}

/**
 * 📋 Extrait les noms des paramètres requis d'un endpoint
 * 
 * @param {Object} endpoint - Configuration de l'endpoint
 * @returns {Array} Liste des noms de paramètres requis
 */
export function getRequiredParameterNames(endpoint) {
  if (!endpoint.params) return [];
  
  return endpoint.params
    .filter(param => param.required)
    .map(param => param.name);
}

/**
 * 🔧 Crée un objet de paramètres avec les valeurs par défaut
 * 
 * @param {Array} paramConfigs - Configuration des paramètres
 * @returns {Object} Objet avec les valeurs par défaut
 */
export function createDefaultParameters(paramConfigs) {
  const defaults = {};
  
  for (const param of paramConfigs) {
    if (param.default !== undefined) {
      defaults[param.name] = param.default;
    } else if (param.placeholder) {
      defaults[param.name] = param.placeholder;
    }
  }
  
  return defaults;
}

/**
 * 📊 Affiche un résumé des paramètres pour debugging
 * 
 * @param {Object} endpoint - Configuration de l'endpoint
 * @param {Object} parameters - Paramètres actuels
 */
export function logParameterSummary(endpoint, parameters) {
  console.log('📊 [Params] Résumé des paramètres:', {
    endpoint: endpoint.name,
    required: getRequiredParameterNames(endpoint),
    provided: Object.keys(parameters),
    values: parameters
  });
}