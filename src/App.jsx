import { useEffect, useMemo, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function currencyFromCents(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100)
}

function App() {
  const [plans, setPlans] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [google, setGoogle] = useState({ ready: false })

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/plans`).then(r => r.json()).then(setPlans).catch(() => setPlans([]))
    fetch(`${BACKEND_URL}/api/google/oauth/url`).then(r => r.json()).then(setGoogle).catch(() => setGoogle({ ready: false }))
  }, [])

  const successUrl = useMemo(() => window.location.origin + '/?success=true', [])
  const cancelUrl = useMemo(() => window.location.origin + '/?canceled=true', [])

  const subscribe = async (price_id) => {
    if (!email) return alert('Enter your email to continue')
    setLoading(true)
    try {
      const r = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id, customer_email: email, success_url: successUrl, cancel_url: cancelUrl })
      })
      const data = await r.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.detail || 'Could not start checkout')
      }
    } catch (e) {
      alert('Error starting checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">System Management</h1>
        <div className="flex items-center gap-3">
          <input type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring focus:ring-blue-200 bg-white" />
          <button disabled className="px-3 py-2 rounded bg-slate-200 text-slate-500">Sign in (scaffold)</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-8">
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Pricing</h2>
          <p className="text-slate-600 mb-4">Pick a plan and subscribe securely.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map(p => (
              <div key={p.id} className="border rounded-lg p-5 flex flex-col">
                <div className="text-lg font-medium">{p.name}</div>
                <div className="text-3xl font-bold mt-2">{currencyFromCents(p.price_cents)}<span className="text-base text-slate-500 font-medium">/{p.interval}</span></div>
                <ul className="mt-4 text-sm text-slate-600 list-disc pl-5 space-y-1">
                  {p.features?.map((f, i) => (<li key={i}>{f}</li>))}
                </ul>
                <button onClick={() => subscribe(p.stripe_price_id)} disabled={loading}
                  className="mt-auto inline-flex justify-center items-center rounded-lg bg-blue-600 text-white font-medium py-2.5 px-4 hover:bg-blue-700 disabled:opacity-60">
                  {loading ? 'Starting...' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Google Business Profile</h2>
          <p className="text-slate-600 mb-4">Connect your Google account to manage locations.</p>
          {google.ready ? (
            <a href={google.url} className="inline-flex items-center px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Connect Google</a>
          ) : (
            <div className="text-sm text-slate-500">Google OAuth not configured yet. Add credentials to enable connection.</div>
          )}
          <Locations />
        </section>
      </main>
    </div>
  )
}

function Locations() {
  const [data, setData] = useState({ connected: false, locations: [] })
  useEffect(() => { fetch(`${BACKEND_URL}/api/google/locations`).then(r => r.json()).then(setData).catch(() => setData({ connected: false, locations: [] })) }, [])
  return (
    <div className="mt-6">
      <div className="text-slate-700 font-medium">Locations</div>
      {!data.connected && <div className="text-sm text-slate-500 mt-2">No Google account connected.</div>}
      {data.connected && (
        <ul className="mt-3 space-y-2">
          {data.locations.map((loc, i) => (
            <li key={i} className="border rounded p-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{loc.name}</div>
                <div className="text-xs text-slate-500">{loc.storeCode}</div>
              </div>
              <button className="text-blue-600 hover:underline text-sm">Manage</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
