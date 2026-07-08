'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, Eye, EyeOff, Copy, Check, Plus, Trash2, ChevronDown, ChevronUp, Globe, Key, Server, Settings } from 'lucide-react'

const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'

// ── Static tenant registry (source of truth for deployment) ──────────────────

const TENANTS = [
  {
    id: '81b78be3-db0c-41f3-8f6f-e3989114eacf',
    slug: 'mliang',
    name: 'M. Liang Realty',
    adminEmail: 'admin@realtyprov1.com',
    status: 'active',
    plan: 'Starter',
    createdAt: '2024-01-01',
    deployment: {
      domain: 'mliang.realtyprov1.com',
      vercelProject: 'nextMliang',
      branch: 'main',
    },
    db: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '(set in .env)',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '(set in .env)',
      listingsTable: 'mlianglistings',
      tenantId: '81b78be3-db0c-41f3-8f6f-e3989114eacf',
    },
    env: [
      { key: 'NEXT_PUBLIC_SUPABASE_URL',      value: process.env.NEXT_PUBLIC_SUPABASE_URL || '' },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
      { key: 'NEXT_PUBLIC_TENANT_SLUG',       value: 'mliang' },
      { key: 'NEXT_PUBLIC_LISTINGS_TABLE',    value: 'mlianglistings' },
      { key: 'NEXT_PUBLIC_TENANT_ID',         value: '81b78be3-db0c-41f3-8f6f-e3989114eacf' },
    ],
    rls: [
      { policy: 'anon_select_listings',        op: 'SELECT', role: 'anon',  status: 'active' },
      { policy: 'anon_insert_listings',        op: 'INSERT', role: 'anon',  status: 'active' },
      { policy: 'anon_delete_listings',        op: 'DELETE', role: 'anon',  status: 'active' },
      { policy: 'anon_update_featured_listings', op: 'UPDATE', role: 'anon', status: 'active' },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function MaskedValue({ value }: { value: string }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const display = show ? value : (value ? '•'.repeat(Math.min(value.length, 32)) : '(not set)')

  return (
    <div className="flex items-center gap-2 font-mono text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 mt-1">
      <span className="flex-1 truncate" style={{ color: '#000' }}>{display}</span>
      <button onClick={() => setShow(v => !v)} className="text-gray-400 hover:text-gray-700 shrink-0">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button onClick={copy} className="text-gray-400 hover:text-gray-700 shrink-0">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

function TenantCard({ tenant }: { tenant: typeof TENANTS[0] }) {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'env' | 'db' | 'rls' | 'deploy'>('env')

  return (
    <Card className="border-2" style={{ borderColor: 'hsl(var(--border))' }}>
      {/* Header */}
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'hsl(var(--primary))' }}>
              {tenant.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{tenant.name}</span>
                <Badge className={tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                  {tenant.status}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700">{tenant.plan}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500">slug: <code className="font-mono">{tenant.slug}</code></span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{tenant.adminEmail}</span>
              </div>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            {([
              ['env',    'Env Variables', Key],
              ['db',     'Database',      Database],
              ['rls',    'RLS Policies',  Shield2],
              ['deploy', 'Deployment',    Globe],
            ] as [string, string, any][]).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
                style={{
                  borderBottomColor: tab === key ? 'hsl(var(--primary))' : 'transparent',
                  color: tab === key ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ENV VARIABLES */}
          {tab === 'env' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Copy these into your <code className="bg-gray-100 px-1 rounded">.env.local</code> or Vercel project environment variables.
              </p>
              {tenant.env.map(({ key, value }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600">{key}</label>
                  <MaskedValue value={value} />
                </div>
              ))}
              <div className="pt-2">
                <CopyAllEnvButton env={tenant.env} />
              </div>
            </div>
          )}

          {/* DATABASE */}
          {tab === 'db' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Supabase URL</label>
                  <MaskedValue value={tenant.db.supabaseUrl} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Anon Key</label>
                  <MaskedValue value={tenant.db.anonKey} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Listings Table</label>
                  <div className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 mt-1" style={{ color: '#000' }}>
                    {tenant.db.listingsTable}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Tenant UUID</label>
                  <MaskedValue value={tenant.db.tenantId} />
                </div>
              </div>
            </div>
          )}

          {/* RLS POLICIES */}
          {tab === 'rls' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                Row-Level Security policies on <code className="bg-gray-100 px-1 rounded">{tenant.db.listingsTable}</code>. Run missing policies in the Supabase SQL editor.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                    <th className="text-left pb-2 font-medium">Policy Name</th>
                    <th className="text-left pb-2 font-medium">Operation</th>
                    <th className="text-left pb-2 font-medium">Role</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                  {tenant.rls.map(r => (
                    <tr key={r.policy}>
                      <td className="py-2 font-mono text-xs" style={{ color: '#000' }}>{r.policy}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          r.op === 'SELECT' ? 'bg-blue-100 text-blue-700' :
                          r.op === 'INSERT' ? 'bg-green-100 text-green-700' :
                          r.op === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{r.op}</span>
                      </td>
                      <td className="py-2 font-mono text-xs text-gray-600">{r.role}</td>
                      <td className="py-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">✓ active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pt-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                <p className="text-xs font-semibold text-gray-600 mb-2">Quick SQL — apply all policies:</p>
                <RlsSqlBlock table={tenant.db.listingsTable} />
              </div>
            </div>
          )}

          {/* DEPLOYMENT */}
          {tab === 'deploy' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Domain</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-mono" style={{ color: '#000' }}>{tenant.deployment.domain}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Vercel Project</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Server className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-mono" style={{ color: '#000' }}>{tenant.deployment.vercelProject}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Branch</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-mono" style={{ color: '#000' }}>{tenant.deployment.branch}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Tenant ID</label>
                  <div className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 mt-1 truncate" style={{ color: '#000' }}>
                    {tenant.id}
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg border text-xs space-y-1" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}>
                <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Deployment checklist</p>
                {[
                  'Set all Env Variables in Vercel project settings',
                  'Run RLS migration SQL in Supabase SQL editor',
                  'Verify anon key has INSERT + DELETE on listings table',
                  'Set custom domain in Vercel → Domains',
                  'Test login with tenant admin credentials',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="mt-0.5 text-green-500">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Inline shield icon (lucide doesn't export Shield2 by name in all versions)
function Shield2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function CopyAllEnvButton({ env }: { env: { key: string; value: string }[] }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    const text = env.map(e => `${e.key}=${e.value}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <Button variant="outline" size="sm" onClick={copy} className="flex items-center gap-2">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy all as .env'}
    </Button>
  )
}

function RlsSqlBlock({ table }: { table: string }) {
  const [copied, setCopied] = useState(false)
  const sql = `DROP POLICY IF EXISTS "anon_select_listings" ON ${table};
CREATE POLICY "anon_select_listings" ON ${table} FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_listings" ON ${table};
CREATE POLICY "anon_insert_listings" ON ${table} FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_listings" ON ${table};
CREATE POLICY "anon_delete_listings" ON ${table} FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "anon_update_featured_listings" ON ${table};
CREATE POLICY "anon_update_featured_listings" ON ${table} FOR UPDATE TO anon
  USING (true) WITH CHECK (true);`

  const copy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative">
      <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">{sql}</pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
      >
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TenantManagementPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const auth = sessionStorage.getItem('brokerAdminAuth')
    const email = sessionStorage.getItem('userEmail')
    if (auth === 'authenticated' && email === SUPERADMIN_EMAIL) {
      setAuthorized(true)
    } else {
      router.replace('/admin/settings')
    }
    setChecking(false)
  }, [router])

  if (checking) return null

  if (!authorized) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
      <p className="text-gray-500">Access denied.</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Tenant Management</h2>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Superadmin only — env credentials, database config, RLS policies, and deployment settings per tenant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 text-xs">Superadmin Only</Badge>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5" disabled>
              <Plus className="w-3.5 h-3.5" />
              Add Tenant
            </Button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Tenants', value: TENANTS.length },
            { label: 'Active',        value: TENANTS.filter(t => t.status === 'active').length },
            { label: 'Tables',        value: TENANTS.length },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tenant cards */}
        <div className="space-y-6">
          {TENANTS.map(tenant => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-lg border text-xs" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
          <strong>Note:</strong> Env variable values are read from the server-side <code>process.env</code> at build time.
          Sensitive keys (anon key, service role key) should never be committed to source control.
          Use Vercel project environment variables or a secrets manager for production deployments.
        </div>
      </div>
    </div>
  )
}
