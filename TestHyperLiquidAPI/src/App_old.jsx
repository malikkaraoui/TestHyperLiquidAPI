import './App.css'

function App() {
  console.log('App component is rendering');
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      padding: '40px',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: '2rem',
        marginBottom: '20px',
        color: '#10b981'
      }}>
        🚀 TestHyperLiquidAPI
      </h1>
      <p style={{ marginBottom: '15px' }}>
        ✅ Application chargée avec succès !
      </p>
      <p style={{ marginBottom: '15px' }}>
        ✅ React fonctionne correctement
      </p>
      <p style={{ marginBottom: '20px' }}>
        Si vous voyez ce message, l'application de base fonctionne.
      </p>
      
      <button 
        onClick={() => alert('Test réussi!')}
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Tester l'interactivité
      </button>
      
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#333',
        borderRadius: '8px'
      }}>
        <h3>Prochaines étapes :</h3>
        <ol>
          <li>Configurer correctement Tailwind CSS</li>
          <li>Réintégrer le composant ApiPlayground</li>
          <li>Tester les endpoints Hyperliquid</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
