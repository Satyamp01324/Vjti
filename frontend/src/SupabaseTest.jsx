import { useState } from 'react'
import { supabase } from './supabaseClient'

function SupabaseTest() {
  const [configStatus, setConfigStatus] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const testBackendConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/test-supabase-config')
      const data = await response.json()
      setConfigStatus(data)
    } catch (error) {
      setConfigStatus({ error: error.message })
    }
    setLoading(false)
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/test-supabase-connection')
      const data = await response.json()
      setConnectionStatus(data)
    } catch (error) {
      setConnectionStatus({ error: error.message })
    }
    setLoading(false)
  }

  const testDirectSupabase = async () => {
    setLoading(true)
    try {
      // Test direct Supabase connection from frontend
      const { data, error } = await supabase
        .from('test_table')
        .select('*')
        .limit(1)

      if (error) {
        setConnectionStatus({
          status: 'error',
          message: error.message,
          note: 'Frontend direct connection test'
        })
      } else {
        setConnectionStatus({
          status: 'success',
          message: 'Frontend connected to Supabase successfully!',
          data: data
        })
      }
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: error.message
      })
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Supabase Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Step 1: Configure Environment Variables</h3>
        <p>Create <code>.env</code> files in both frontend and backend folders:</p>
        <ul style={{ textAlign: 'left' }}>
          <li>Backend: <code>SUPABASE_URL</code> and <code>SUPABASE_KEY</code></li>
          <li>Frontend: <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code></li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={testBackendConnection} 
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Test Backend Config
        </button>
        <button 
          onClick={testSupabaseConnection} 
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Test Backend Connection
        </button>
        <button 
          onClick={testDirectSupabase} 
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Test Frontend Connection
        </button>
      </div>

      {loading && <p>Testing...</p>}

      {configStatus && (
        <div style={{
          padding: '15px',
          marginTop: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <h4>Configuration Status:</h4>
          <pre style={{ overflow: 'auto' }}>
            {JSON.stringify(configStatus, null, 2)}
          </pre>
        </div>
      )}

      {connectionStatus && (
        <div style={{
          padding: '15px',
          marginTop: '20px',
          backgroundColor: connectionStatus.status === 'success' ? '#d4edda' : '#f8d7da',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <h4>Connection Status:</h4>
          <pre style={{ overflow: 'auto' }}>
            {JSON.stringify(connectionStatus, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h4>📝 Next Steps:</h4>
        <ol style={{ textAlign: 'left' }}>
          <li>Get your Supabase credentials from <a href="https://supabase.com" target="_blank">supabase.com</a></li>
          <li>Create a test table in your Supabase database (or use an existing one)</li>
          <li>Update the table name in the test endpoints (currently set to 'test_table')</li>
          <li>Restart both servers after adding .env files</li>
        </ol>
      </div>
    </div>
  )
}

export default SupabaseTest
