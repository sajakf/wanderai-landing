'use client'

import { useEffect, useState } from 'react'

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected'

export default function QRPage() {
  const [status, setStatus] = useState<Status>('disconnected')
  const [qr, setQr]         = useState<string | null>(null)

  // Auto-connect on mount, then listen for QR via SSE
  useEffect(() => {
    fetch('/api/wa/connect', { method: 'POST' }).catch(() => {})

    const es = new EventSource('/api/wa/qr')
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.status) setStatus(d.status as Status)
        if ('qr' in d) setQr(d.qr)
      } catch {}
    }
    return () => es.close()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      gap: 24,
      padding: 24,
    }}>

      {/* Logo + title */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#517D86', marginBottom: 6 }}>
          WanderAI
        </p>
        <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 300, margin: 0 }}>
          Connect WhatsApp
        </h1>
      </div>

      {/* QR card */}
      <div style={{
        backgroundColor: '#161b22',
        border: '1px solid rgba(200,163,107,0.15)',
        borderRadius: 20,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        minWidth: 280,
      }}>

        {/* Status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor:
              status === 'connected'    ? '#34d399' :
              status === 'qr'           ? '#C8A36B' :
              status === 'connecting'   ? '#fbbf24' : '#f87171',
            boxShadow: status === 'connected' ? '0 0 6px #34d399' : undefined,
          }} />
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
            {{ connected: 'Connected', disconnected: 'Disconnected', qr: 'Scan to connect', connecting: 'Connecting…' }[status]}
          </span>
        </div>

        {/* QR code */}
        {status === 'qr' && qr && (
          <>
            <div style={{ padding: 12, backgroundColor: '#fff', borderRadius: 14 }}>
              <img src={qr} alt="WhatsApp QR Code" width={220} height={220} />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              Open WhatsApp → <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Linked Devices</strong> → Link a Device
            </p>
          </>
        )}

        {/* Connecting spinner */}
        {(status === 'connecting' || status === 'disconnected') && !qr && (
          <div style={{ display: 'flex', gap: 6, padding: '28px 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: '#C8A36B',
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}

        {/* Connected state */}
        {status === 'connected' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <svg viewBox="0 0 24 24" fill="white" width={28} height={28}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <p style={{ color: '#34d399', fontWeight: 500, margin: '0 0 4px', fontSize: '0.9rem' }}>WhatsApp is live</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', margin: 0 }}>AI agent active — ready to reply</p>
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>
        © 2025 WanderAI
      </p>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
