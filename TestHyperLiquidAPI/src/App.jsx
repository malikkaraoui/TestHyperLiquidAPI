import React from 'react'
import './App.css'
import SimpleApiPlayground from './SimpleApiPlayground'
import { runQuickTest } from './utils/quickTest'

function App() {
  console.log('App component is rendering');

  // 🧪 Lancer les tests de structure (une fois au chargement)
  React.useEffect(() => {
    console.log('🚀 Lancement des tests de la nouvelle structure...');
    runQuickTest().catch(error => {
      console.error('💥 Erreur lors des tests:', error);
    });
  }, []);
  
  return <SimpleApiPlayground />;
}

export default App;