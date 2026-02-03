function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f0' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#006B6B',
          padding: '1.5rem 2rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1
          style={{
            color: '#f5f5f0',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          Eurostar Portfolio
        </h1>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2
            style={{
              color: '#1a1a1a',
              fontSize: '1.25rem',
              fontWeight: 500,
              marginTop: 0,
              marginBottom: '0.5rem',
            }}
          >
            Foundation Phase
          </h2>
          <p
            style={{
              color: '#666',
              margin: 0,
              fontSize: '0.95rem',
            }}
          >
            Authentication Setup Pending
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
