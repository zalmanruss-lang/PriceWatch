import { useState } from 'react';

const STORES = [
  'Amazon MX',
  'Amazon USA',
  'Mercado Libre',
  'Liverpool',
  'Walmart MX',
  'Walmart USA',
];

const PLANS = {
  free: { name: 'Free', price: 'Gratis', items: 2, color: '#888780' },
  pro: { name: 'Pro', price: '$249 MXN/año', items: 30, color: '#1D9E75' },
  biz: {
    name: 'Business',
    price: '$999 MXN/año',
    items: 200,
    color: '#185FA5',
  },
};

const sampleItems = [
  {
    id: 1,
    name: 'Apple AirPods Pro (2da gen)',
    store: 'Amazon MX',
    current: 4199,
    prev: 4599,
    currency: 'MXN',
    history: [4599, 4599, 4499, 4350, 4199],
    alert: true,
  },
  {
    id: 2,
    name: 'Sony WH-1000XM5',
    store: 'Mercado Libre',
    current: 7999,
    prev: 7999,
    currency: 'MXN',
    history: [8499, 8299, 8099, 7999, 7999],
    alert: false,
  },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const range = max - min || 1;
  const w = 80,
    h = 32,
    pad = 4;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const last = pts.split(' ').pop()!.split(',');
  return (
    <svg width={w} height={h}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

function PriceBadge({
  current,
  prev,
  currency,
}: {
  current: number;
  prev: number;
  currency: string;
}) {
  const pct = (((current - prev) / prev) * 100).toFixed(1);
  const down = current < prev;
  const same = current === prev;
  const bg = same ? '#f0f0f0' : down ? '#EAF3DE' : '#FCEBEB';
  const clr = same ? '#888' : down ? '#3B6D11' : '#A32D2D';
  const sym = currency === 'MXN' ? '$' : 'US$';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 18, fontWeight: 500 }}>
        {sym}
        {current.toLocaleString()}
      </span>
      {!same && (
        <span
          style={{
            fontSize: 12,
            padding: '2px 7px',
            borderRadius: 99,
            background: bg,
            color: clr,
          }}
        >
          {down ? '▼' : '▲'} {Math.abs(Number(pct))}%
        </span>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [plan] = useState<'free' | 'pro' | 'biz'>('free');
  const [items, setItems] = useState(sampleItems);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ url: '', store: STORES[0] });
  const [alerts, setAlerts] = useState<Record<number, boolean>>({
    1: true,
    2: false,
  });

  const maxItems = PLANS[plan].items;

  function toggleAlert(id: number) {
    setAlerts((a) => ({ ...a, [id]: !a[id] }));
  }
  function removeItem(id: number) {
    setItems((i) => i.filter((x) => x.id !== id));
  }
  function addItem() {
    if (!form.url) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: 'Nuevo artículo (sin precio aún)',
        store: form.store,
        current: 0,
        prev: 0,
        currency: 'MXN',
        history: [0],
        alert: true,
      },
    ]);
    setForm({ url: '', store: STORES[0] });
    setAddOpen(false);
  }

  const tabs = ['dashboard', 'historial', 'planes'];

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 680,
        margin: '0 auto',
        padding: '1.5rem 1rem',
        color: '#1a1a1a',
      }}
    >
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500 }}>
        PriceWatch MX
      </h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <span
          style={{
            fontSize: 12,
            padding: '3px 10px',
            borderRadius: 99,
            background: '#f0f0f0',
            color: '#555',
            border: '0.5px solid #ddd',
          }}
        >
          Plan {PLANS[plan].name} — {items.length}/{maxItems} artículos
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid #eee',
          marginBottom: '1.5rem',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 14px',
              fontSize: 14,
              textTransform: 'capitalize',
              color: tab === t ? '#1a1a1a' : '#888',
              borderBottom:
                tab === t ? '2px solid #1a1a1a' : '2px solid transparent',
              fontWeight: tab === t ? 500 : 400,
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14, color: '#888' }}>
              {items.length} artículo{items.length !== 1 ? 's' : ''} rastreado
              {items.length !== 1 ? 's' : ''}
            </span>
            {items.length < maxItems ? (
              <button
                onClick={() => setAddOpen((o) => !o)}
                style={{
                  fontSize: 13,
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 500,
                }}
              >
                + Agregar
              </button>
            ) : (
              <button
                onClick={() => setTab('planes')}
                style={{
                  fontSize: 13,
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: '#E1F5EE',
                  color: '#0F6E56',
                  border: '0.5px solid #9FE1CB',
                  fontWeight: 500,
                }}
              >
                Mejorar plan ↗
              </button>
            )}
          </div>

          {addOpen && (
            <div
              style={{
                background: '#f9f9f9',
                borderRadius: 12,
                border: '0.5px solid #eee',
                padding: '1rem',
                marginBottom: 16,
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 500 }}>
                Agregar artículo
              </p>
              <input
                placeholder="Pega la URL del producto..."
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                style={{
                  width: '100%',
                  marginBottom: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
              <select
                value={form.store}
                onChange={(e) =>
                  setForm((f) => ({ ...f, store: e.target.value }))
                }
                style={{
                  width: '100%',
                  marginBottom: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 14,
                }}
              >
                {STORES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={addItem}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Rastrear
                </button>
                <button
                  onClick={() => setAddOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: '1px solid #ddd',
                    background: 'none',
                    color: '#888',
                    fontSize: 13,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#fff',
                border: '0.5px solid #eee',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: '0 0 2px',
                      fontWeight: 500,
                      fontSize: 15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                    {item.store}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ccc',
                    fontSize: 16,
                    paddingLeft: 12,
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '10px 0',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <PriceBadge
                  current={item.current}
                  prev={item.prev}
                  currency={item.currency}
                />
                <Sparkline
                  data={item.history}
                  color={item.current < item.prev ? '#3B6D11' : '#aaa'}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '0.5px solid #eee',
                  paddingTop: 10,
                }}
              >
                <span style={{ fontSize: 12, color: '#888' }}>
                  Precio anterior: ${item.prev.toLocaleString()} {item.currency}
                </span>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: alerts[item.id] ? '#0F6E56' : '#aaa',
                  }}
                >
                  <span
                    onClick={() => toggleAlert(item.id)}
                    style={{
                      width: 28,
                      height: 16,
                      borderRadius: 99,
                      position: 'relative',
                      background: alerts[item.id] ? '#1D9E75' : '#ddd',
                      display: 'inline-block',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: alerts[item.id] ? 14 : 2,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left .2s',
                      }}
                    />
                  </span>
                  Alerta
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'historial' && (
        <div>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#fff',
                border: '0.5px solid #eee',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                marginBottom: 10,
              }}
            >
              <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: 14 }}>
                {item.name}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#888' }}>
                {item.store}
              </p>
              <div style={{ display: 'flex', gap: 4 }}>
                {item.history.map((price, i) => {
                  const isLow = price === Math.min(...item.history);
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div
                        style={{
                          height: `${Math.round(
                            20 + (price / Math.max(...item.history)) * 50
                          )}px`,
                          background: isLow ? '#1D9E75' : '#e5e5e5',
                          borderRadius: 4,
                          margin: '0 2px',
                        }}
                      />
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 11,
                          color: '#888',
                        }}
                      >
                        ${price.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: '#bbb' }}>
                Verde = precio más bajo registrado
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'planes' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {(Object.entries(PLANS) as [string, typeof PLANS.free][]).map(
            ([key, p]) => (
              <div
                key={key}
                style={{
                  background: '#fff',
                  border:
                    key === 'pro' ? '2px solid #378ADD' : '0.5px solid #eee',
                  borderRadius: 12,
                  padding: '1.25rem 1rem',
                  position: 'relative',
                }}
              >
                {key === 'pro' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -1,
                      left: '50%',
                      transform: 'translateX(-50%) translateY(-50%)',
                      background: '#E6F1FB',
                      color: '#185FA5',
                      fontSize: 11,
                      padding: '3px 10px',
                      borderRadius: 99,
                      border: '0.5px solid #B5D4F4',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Más popular
                  </div>
                )}
                <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: 16 }}>
                  {p.name}
                </p>
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: 18,
                    fontWeight: 500,
                    color: p.color,
                  }}
                >
                  {p.price}
                </p>
                <div
                  style={{
                    fontSize: 13,
                    color: '#666',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span>✓ {p.items === 200 ? '200+' : p.items} artículos</span>
                  <span>✓ Alertas de precio</span>
                  <span>✓ Historial de precios</span>
                  {key !== 'free' && <span>✓ Múltiples tiendas</span>}
                  {key === 'biz' && <span>✓ Exportar datos</span>}
                  {key === 'biz' && <span>✓ API access</span>}
                </div>
                <button
                  style={{
                    marginTop: 16,
                    width: '100%',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: key === plan ? '#f0f0f0' : '#1a1a1a',
                    color: key === plan ? '#888' : '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {key === plan ? 'Plan actual' : 'Elegir plan'}
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
