import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useQuery } from '@tanstack/react-query'

type Stats = {
  total_alerts: number
  flagged_addresses: number
  transactions_indexed: number
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch('/api/stats', { cache: 'no-store' })
  if (!res.ok) throw new Error(`stats request failed: ${res.status}`)
  return res.json()
}

function App() {
  const { data, error, isLoading } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h1 className="text-xl font-semibold">SentinelMesh</h1>
        <WalletMultiButton />
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-2 text-lg font-medium">Backend status</h2>
          {isLoading && <p className="text-slate-400">Loading stats…</p>}
          {error && <p className="text-red-400">Could not reach backend: {(error as Error).message}</p>}
          {data && (
            <dl className="grid grid-cols-3 gap-4 text-center">
              <div>
                <dt className="text-sm text-slate-400">Alerts</dt>
                <dd className="text-2xl font-semibold">{data.total_alerts}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Flagged addresses</dt>
                <dd className="text-2xl font-semibold">{data.flagged_addresses}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Transactions indexed</dt>
                <dd className="text-2xl font-semibold">{data.transactions_indexed}</dd>
              </div>
            </dl>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
