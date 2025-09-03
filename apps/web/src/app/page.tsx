import { Dashboard } from '../components/dashboard/dashboard'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre plateforme Elavira Agents
        </p>
      </div>
      <Dashboard />
    </div>
  )
}
