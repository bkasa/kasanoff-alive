'use client';

import { useState, useEffect } from 'react';

const C = {
  cream: '#FDF8F0',
  warmWhite: '#FFFDF9',
  charcoal: '#3D3229',
  charcoalLight: '#6B5D50',
  gold: '#D4A574',
  terracotta: '#C4836A',
};

type Tab = 'orders' | 'daily' | 'emails' | 'sales';

interface Purchase {
  id: number;
  customer_email: string;
  exploration_id: string;
  amount_cents: number;
  created_at: string;
}

interface DailyTotal {
  date: string;
  order_count: number;
  revenue_cents: number;
}

interface DailyTotalByExploration {
  date: string;
  exploration_id: string;
  order_count: number;
  revenue_cents: number;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [logging, setLogging] = useState(false);
  const [tab, setTab] = useState<Tab>('orders');

  const [orders, setOrders] = useState<Purchase[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [dailyByExploration, setDailyByExploration] = useState<DailyTotalByExploration[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Sales Dashboard state
  const [salesMonth, setSalesMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [salesData, setSalesData] = useState<{
    month: string;
    daysInMonth: number;
    explorations: string[];
    data: Record<string, Record<number, number>>;
  } | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
        loadData();
      } else {
        setLoginError('Incorrect password.');
      }
    } catch {
      setLoginError('Something went wrong.');
    } finally {
      setLogging(false);
    }
  }

  async function loadData() {
    setDataLoading(true);
    try {
      const [ordersRes, dailyRes, emailsRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/daily-totals'),
        fetch('/api/admin/customers'),
      ]);
      const ordersData = await ordersRes.json();
      const dailyData = await dailyRes.json();
      const emailsData = await emailsRes.json();
      setOrders(ordersData.purchases || []);
      setDailyTotals(dailyData.totals || []);
      setDailyByExploration(dailyData.byExploration || []);
      setEmails(emailsData.emails || []);
    } catch {
      // silently fail — data will just be empty
    } finally {
      setDataLoading(false);
    }
  }

  async function loadSalesData(month: string) {
    setSalesLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-dashboard?month=${month}`);
      const json = await res.json();
      setSalesData(json);
    } catch {
      // silently fail
    } finally {
      setSalesLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'sales' && authed) {
      loadSalesData(salesMonth);
    }
  }, [tab, salesMonth, authed]);

  function downloadEmailsCSV() {
    const csv = 'email\n' + emails.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'explorations-customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  function formatCents(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.cream,
    fontFamily: "'Source Sans 3', sans-serif",
    padding: 'clamp(32px,5vw,64px) clamp(20px,5vw,48px)',
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(22px,3vw,30px)',
    fontWeight: 400,
    color: C.charcoal,
    margin: '0 0 32px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    color: C.charcoal,
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 14px',
    fontWeight: 500,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.charcoalLight,
    borderBottom: `1px solid rgba(212,165,116,0.2)`,
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: `1px solid rgba(61,50,41,0.06)`,
    fontFamily: "'Source Sans 3', sans-serif",
  };

  // ─── Login ───────────────────────────────────────────────

  if (!authed) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            maxWidth: '360px',
            width: '100%',
            background: C.warmWhite,
            borderRadius: '10px',
            padding: '40px 36px',
            boxShadow: '0 4px 30px rgba(61,50,41,0.08)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ ...headingStyle, margin: '0 0 24px' }}>Admin</h1>
          <form onSubmit={login}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '15px',
                color: C.charcoal,
                background: C.cream,
                border: `1px solid rgba(212,165,116,0.3)`,
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '14px',
              }}
            />
            {loginError && (
              <p style={{ color: C.terracotta, fontSize: '13px', marginBottom: '10px' }}>{loginError}</p>
            )}
            <button
              type="submit"
              disabled={logging}
              style={{
                width: '100%',
                padding: '12px',
                background: C.gold,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {logging ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────

  const tabs: { key: Tab; label: string }[] = [
    { key: 'orders', label: 'Orders' },
    { key: 'daily', label: 'Daily Totals' },
    { key: 'emails', label: 'Customer Emails' },
    { key: 'sales', label: 'Sales Dashboard' },
  ];

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 style={headingStyle}>Explorations Admin</h1>
          <a href="/" style={{ fontSize: '13px', color: C.charcoalLight, textDecoration: 'none' }}>← Hub</a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: `1px solid rgba(212,165,116,0.2)` }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: tab === t.key ? `2px solid ${C.gold}` : '2px solid transparent',
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '14px',
                fontWeight: tab === t.key ? 500 : 400,
                color: tab === t.key ? C.charcoal : C.charcoalLight,
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dataLoading && (
          <p style={{ color: C.charcoalLight, fontSize: '14px' }}>Loading…</p>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && !dataLoading && (
          <div style={{ overflowX: 'auto' }}>
            <p style={{ fontSize: '13px', color: C.charcoalLight, marginBottom: '16px' }}>
              {orders.length} total orders
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Exploration</th>
                  <th style={thStyle}>Customer Email</th>
                  <th style={thStyle}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={tdStyle}>{formatDate(o.created_at)}</td>
                    <td style={tdStyle}>{o.exploration_id}</td>
                    <td style={tdStyle}>{o.customer_email}</td>
                    <td style={tdStyle}>{formatCents(o.amount_cents)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={4} style={{ ...tdStyle, color: C.charcoalLight }}>No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Daily Totals Tab */}
        {tab === 'daily' && !dataLoading && (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Exploration</th>
                  <th style={thStyle}>Orders</th>
                  <th style={thStyle}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dailyTotals.map((d) => {
                  const rows = dailyByExploration.filter((r) => r.date === d.date);
                  return (
                    <>
                      {rows.map((r) => (
                        <tr key={`${d.date}-${r.exploration_id}`}>
                          <td style={{ ...tdStyle, color: C.charcoalLight, fontSize: '13px' }}>{r.date}</td>
                          <td style={{ ...tdStyle, color: C.charcoalLight, fontSize: '13px', paddingLeft: '24px' }}>{r.exploration_id}</td>
                          <td style={{ ...tdStyle, color: C.charcoalLight, fontSize: '13px' }}>{Number(r.order_count)}</td>
                          <td style={{ ...tdStyle, color: C.charcoalLight, fontSize: '13px' }}>{formatCents(Number(r.revenue_cents))}</td>
                        </tr>
                      ))}
                      <tr key={d.date}>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{d.date}</td>
                        <td style={{ ...tdStyle, fontWeight: 500, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: C.charcoalLight }}>Total</td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{Number(d.order_count)}</td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{formatCents(Number(d.revenue_cents))}</td>
                      </tr>
                    </>
                  );
                })}
                {dailyTotals.length === 0 && (
                  <tr><td colSpan={4} style={{ ...tdStyle, color: C.charcoalLight }}>No data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Emails Tab */}
        {tab === 'emails' && !dataLoading && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: C.charcoalLight, margin: 0 }}>
                {emails.length} customer{emails.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={downloadEmailsCSV}
                style={{
                  padding: '8px 18px',
                  background: C.gold,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.terracotta)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
              >
                Download CSV
              </button>
            </div>
            <div
              style={{
                background: C.warmWhite,
                borderRadius: '8px',
                padding: '20px 24px',
                boxShadow: '0 2px 12px rgba(61,50,41,0.05)',
                fontSize: '14px',
                lineHeight: 2,
                color: C.charcoal,
              }}
            >
              {emails.length === 0 ? (
                <span style={{ color: C.charcoalLight }}>No customers yet.</span>
              ) : (
                emails.map((email, i) => <div key={i}>{email}</div>)
              )}
            </div>
          </div>
        )}
        {/* Sales Dashboard Tab */}
        {tab === 'sales' && (
          <div>
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <button
                onClick={() => {
                  const [y, m] = salesMonth.split('-').map(Number);
                  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                  setSalesMonth(prev);
                }}
                style={{
                  padding: '6px 14px', background: 'none', border: `1px solid rgba(212,165,116,0.4)`,
                  borderRadius: '6px', fontFamily: "'Source Sans 3', sans-serif", fontSize: '13px',
                  color: C.charcoalLight, cursor: 'pointer',
                }}
              >
                ← Prev
              </button>
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '18px', color: C.charcoal }}>
                {salesMonth
                  ? new Date(`${salesMonth}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                  : ''}
              </span>
              <button
                onClick={() => {
                  const [y, m] = salesMonth.split('-').map(Number);
                  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
                  setSalesMonth(next);
                }}
                style={{
                  padding: '6px 14px', background: 'none', border: `1px solid rgba(212,165,116,0.4)`,
                  borderRadius: '6px', fontFamily: "'Source Sans 3', sans-serif", fontSize: '13px',
                  color: C.charcoalLight, cursor: 'pointer',
                }}
              >
                Next →
              </button>
            </div>

            {salesLoading && (
              <p style={{ color: C.charcoalLight, fontSize: '14px' }}>Loading…</p>
            )}

            {!salesLoading && salesData && (() => {
              const { daysInMonth, explorations, data } = salesData;
              const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

              // Units grid
              const unitsDailyTotals: Record<number, number> = {};
              for (const d of days) {
                unitsDailyTotals[d] = explorations.reduce((sum, exp) => sum + (data[exp]?.[d] ?? 0), 0);
              }
              const unitsMtdByExp: Record<string, number> = {};
              for (const exp of explorations) {
                unitsMtdByExp[exp] = days.reduce((sum, d) => sum + (data[exp]?.[d] ?? 0), 0);
              }
              const unitsMtdTotal = explorations.reduce((sum, exp) => sum + unitsMtdByExp[exp], 0);

              const gridTableStyle: React.CSSProperties = {
                width: '100%', borderCollapse: 'collapse', fontSize: '12px',
                color: C.charcoal, marginBottom: '40px',
              };
              const gridThStyle: React.CSSProperties = {
                padding: '6px 8px', fontWeight: 500, fontSize: '10px',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: C.charcoalLight, borderBottom: `1px solid rgba(212,165,116,0.2)`,
                textAlign: 'center', whiteSpace: 'nowrap',
              };
              const gridTdStyle: React.CSSProperties = {
                padding: '6px 8px', borderBottom: `1px solid rgba(61,50,41,0.05)`,
                textAlign: 'center', fontFamily: "'Source Sans 3', sans-serif",
              };
              const gridTdZero: React.CSSProperties = { ...gridTdStyle, color: 'rgba(107,93,80,0.3)' };
              const labelTdStyle: React.CSSProperties = {
                ...gridTdStyle, textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap',
                paddingRight: '16px',
              };
              const totalColStyle: React.CSSProperties = {
                ...gridTdStyle, fontWeight: 600,
                borderLeft: `1px solid rgba(212,165,116,0.2)`,
              };
              const totalRowStyle: React.CSSProperties = {
                ...gridTdStyle, fontWeight: 600,
                borderTop: `1px solid rgba(212,165,116,0.2)`,
                background: 'rgba(253,248,240,0.6)',
              };

              return (
                <>
                  {/* Units section */}
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '16px',
                    fontWeight: 400, color: C.charcoal, margin: '0 0 12px',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    Units
                  </h3>
                  <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
                    <table style={gridTableStyle}>
                      <thead>
                        <tr>
                          <th style={{ ...gridThStyle, textAlign: 'left' }}>Exploration</th>
                          {days.map(d => <th key={d} style={gridThStyle}>{d}</th>)}
                          <th style={{ ...gridThStyle, borderLeft: `1px solid rgba(212,165,116,0.2)` }}>MTD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {explorations.map(exp => (
                          <tr key={exp}>
                            <td style={labelTdStyle}>{exp}</td>
                            {days.map(d => {
                              const v = data[exp]?.[d] ?? 0;
                              return <td key={d} style={v === 0 ? gridTdZero : gridTdStyle}>{v === 0 ? '–' : v}</td>;
                            })}
                            <td style={totalColStyle}>{unitsMtdByExp[exp]}</td>
                          </tr>
                        ))}
                        {explorations.length === 0 && (
                          <tr>
                            <td colSpan={days.length + 2} style={{ ...gridTdStyle, color: C.charcoalLight }}>
                              No purchases this month.
                            </td>
                          </tr>
                        )}
                        {explorations.length > 0 && (
                          <tr>
                            <td style={{ ...labelTdStyle, ...totalRowStyle, textAlign: 'left' }}>Daily Total</td>
                            {days.map(d => (
                              <td key={d} style={unitsDailyTotals[d] === 0
                                ? { ...gridTdZero, ...totalRowStyle }
                                : totalRowStyle}>
                                {unitsDailyTotals[d] === 0 ? '–' : unitsDailyTotals[d]}
                              </td>
                            ))}
                            <td style={{ ...totalColStyle, ...totalRowStyle }}>{unitsMtdTotal}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Revenue section */}
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '16px',
                    fontWeight: 400, color: C.charcoal, margin: '0 0 12px',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    Revenue
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={gridTableStyle}>
                      <thead>
                        <tr>
                          <th style={{ ...gridThStyle, textAlign: 'left' }}>Exploration</th>
                          {days.map(d => <th key={d} style={gridThStyle}>{d}</th>)}
                          <th style={{ ...gridThStyle, borderLeft: `1px solid rgba(212,165,116,0.2)` }}>MTD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {explorations.map(exp => (
                          <tr key={exp}>
                            <td style={labelTdStyle}>{exp}</td>
                            {days.map(d => {
                              const v = data[exp]?.[d] ?? 0;
                              const rev = v * 18;
                              return <td key={d} style={v === 0 ? gridTdZero : gridTdStyle}>
                                {v === 0 ? '–' : `$${rev}`}
                              </td>;
                            })}
                            <td style={totalColStyle}>${unitsMtdByExp[exp] * 18}</td>
                          </tr>
                        ))}
                        {explorations.length === 0 && (
                          <tr>
                            <td colSpan={days.length + 2} style={{ ...gridTdStyle, color: C.charcoalLight }}>
                              No purchases this month.
                            </td>
                          </tr>
                        )}
                        {explorations.length > 0 && (
                          <tr>
                            <td style={{ ...labelTdStyle, ...totalRowStyle, textAlign: 'left' }}>Daily Total</td>
                            {days.map(d => (
                              <td key={d} style={unitsDailyTotals[d] === 0
                                ? { ...gridTdZero, ...totalRowStyle }
                                : totalRowStyle}>
                                {unitsDailyTotals[d] === 0 ? '–' : `$${unitsDailyTotals[d] * 18}`}
                              </td>
                            ))}
                            <td style={{ ...totalColStyle, ...totalRowStyle }}>${unitsMtdTotal * 18}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
