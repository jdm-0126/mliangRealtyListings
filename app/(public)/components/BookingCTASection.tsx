'use client'
// app/(public)/components/BookingCTASection.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, MessageCircle, UserCheck } from 'lucide-react'
import { getSocialLinksFromStorage } from '@/lib/social'
import { supabase } from '@/app/lib/supabaseClient'

type AgentEntry = { name: string; title: string; phone: string }

const DEFAULT_AGENT: AgentEntry = { name: 'M. Liang', title: 'Licensed Broker', phone: '09393440944' }

async function fetchTodayAgent(): Promise<AgentEntry> {
  try {
    const raw = localStorage.getItem('tenantSettings')
    if (!raw) return DEFAULT_AGENT
    const parsed = JSON.parse(raw)
    const ids: (number | null)[] = parsed.agentsOfTheDay
    if (!Array.isArray(ids) || ids.length !== 7) return DEFAULT_AGENT

    const todayId = ids[new Date().getDay()]
    if (!todayId || !supabase) return DEFAULT_AGENT

    const { data } = await supabase
      .from('agents')
      .select('name, specialization, phone')
      .eq('id', todayId)
      .eq('status', 'Active')
      .single()

    if (!data) return DEFAULT_AGENT
    return {
      name: data.name,
      title: data.specialization || 'Agent',
      phone: data.phone || '',
    }
  } catch {
    return DEFAULT_AGENT
  }
}

export default function BookingCTASection() {
  const [messengerUrl, setMessengerUrl] = useState<string | null>(null)
  const [agent, setAgent] = useState<AgentEntry>(DEFAULT_AGENT)

  useEffect(() => {
    fetchTodayAgent().then(setAgent)

    // Read Messenger URL from localStorage (set by admin in settings)
    const links = getSocialLinksFromStorage()
    const messenger = links.find(l => l.platform === 'messenger')
    // Fall back to Facebook page if no dedicated Messenger URL
    const facebook  = links.find(l => l.platform === 'facebook')
    setMessengerUrl(messenger?.url ?? facebook?.url ?? null)
  }, [])

  return (
    <section
      className="py-20 px-4"
      style={{ background: 'var(--est-bg)', borderTop: '1px solid var(--est-border)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
            Ready to Move?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--est-text)' }}>
            Book a Viewing
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--est-muted)' }}>
            Fill in your details and we'll arrange a property visit — or reach out directly to today's available agent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1 — Book / Inquiry form */}
          <div
            className="rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
            >
              <CalendarCheck className="w-5 h-5" style={{ color: 'var(--est-purple)' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--est-text)' }}>
                Schedule a Viewing
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--est-muted)' }}>
                Tell us which property you're interested in and your preferred schedule. We'll confirm within 24 hours.
              </p>
            </div>
            <Link
              href="/book"
              className="mt-auto flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--est-purple)', color: '#fff' }}
            >
              Book Now
            </Link>
          </div>

          {/* Card 2 — Agent of the day */}
          <div
            className="rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
            >
              <UserCheck className="w-5 h-5" style={{ color: 'var(--est-purple)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--est-muted)' }}>
                Agent of the Day
              </p>
              <h3 className="text-base font-semibold mb-0.5" style={{ color: 'var(--est-text)' }}>
                {agent.name}
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--est-muted)' }}>{agent.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--est-muted)' }}>
                Available today to answer your questions and arrange viewings.
              </p>
            </div>
            <a
              href={`tel:${agent.phone}`}
              className="mt-auto flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)', color: 'var(--est-text)' }}
            >
              Call {agent.phone}
            </a>
          </div>

          {/* Card 3 — Messenger */}
          <div
            className="rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: 'var(--est-purple)' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--est-text)' }}>
                Chat on Messenger
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--est-muted)' }}>
                Prefer to chat? Send us a message on Facebook Messenger and we'll reply as soon as possible.
              </p>
            </div>
            {messengerUrl ? (
              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#0084FF', color: '#fff' }}
              >
                {/* Messenger logo */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.906 1.378 5.504 3.538 7.24V22l3.28-1.8c.875.242 1.803.372 2.762.372 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.006 12.44l-2.548-2.72-4.97 2.72 5.467-5.8 2.61 2.72 4.908-2.72-5.467 5.8z" />
                </svg>
                Message Us
              </a>
            ) : (
              <Link
                href="/contact"
                className="mt-auto flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)', color: 'var(--est-text)' }}
              >
                Send Inquiry
              </Link>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
