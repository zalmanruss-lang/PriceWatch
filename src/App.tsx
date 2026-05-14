import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

const SUPA_URL    = "https://wlsgnjccjaevgchujeeg.supabase.co";
const SUPA_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsc2duamNjamFldmdjaHVqZWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODI0MDksImV4cCI6MjA5NDM1ODQwOX0.jPI6SU8Si7NKTq3A5dh1TrUDULpOui357DSCkqrZg0Y";
const APIFY_TOKEN = "apify_api_8JMusSGbh8cFwRV24o2odK4m6RVNkh0xjsGO";
const ACTOR_ID    = "laisidata~amazon-product-data-scraper";

async function supaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const C = {
  bg:      "#0a0f1e",
  surface: "#111827",
  card:    "#151e2d",
  border:  "#1f2937",
  green:   "#00ff88",
  greenDim:"#0d2b1a",
  gold:    "#f5c518",
  goldDim: "#2a2000",
  red:     "#ff4d6a",
  redDim:  "#2b0d14",
  text:    "#ffffff",
  muted:   "#9ca3af",
  dim:     "#4a5568",
};

const STORES = ["Amazon MX","Amazon USA","Mercado Libre","Liverpool","Walmart MX","Walmart USA"];

type PlanKey = "free" | "pro" | "biz";
const PLANS: Record<PlanKey, { name: string; price: string; items: number; color: string }> = {
  free: { name:"Free",     price:"Gratis",       items:2,   color: C.muted },
  pro:  { name:"Pro",      price:"$249 MXN/año", items:30,  color: C.green },
  biz:  { name:"Business", price:"$999 MXN/año", items:200, color: C.gold  },
};

interface Item {
  id: number;
  name: string;
  url: string;
  store: string;
  current_price: number;
  prev_price: number;
  min_price: number;
  currency: string;
  alert_on_drop: boolean;
}

function Logo({ size=32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{flexShrink:0}}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.green}/>
          <stop offset="100%" stopColor="#00cc6a"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="80" rx="20" fill={C.surface}/>
      <text x="10" y="62" fontFamily="Georgia,serif" fontSize="56" fontWeight="bold" fill="url(#lg)">D</text>
      <polyline points="46,26 56,34 66,24" fill="none" stroke={C.gold}  strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="46,36 56,44 66,34" fill="none" stroke={C.green} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  );
}

function Badge({ current, prev, currency }: { current: number; prev: number; currency: string }) {
  const pct  = prev > 0 ? ((current-prev)/prev*100).toFixed(1) : "0";
  const down = current < prev;
  const same = current === prev || prev === 0;
  const sym  = currency==="MXN" ? "$" : "US$";
  return (
    <div style={{display:"flex", alignItems:"baseline", gap:8}}>
      <span style={{fontSize:22, fontWeight:700, letterSpacing:-0.5}}>
        {current > 0 ? `${sym}${current.toLocaleString()}` : "Pendiente..."}
      </span>
      {!same && (
        <span style={{fontSize:12, padding:"2px 8px", borderRadius:99,
          background: down ? C.greenDim : C.redDim,
          color:      down ? C.green    : C.red,
          border:`1px solid ${down?C.green+"33":C.red+"33"}`}}>
          {down?"▼":"▲"} {Math.abs(Number(pct))}%
        </span>
      )}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width:32, height:18, borderRadius:99, cursor:"pointer",
      background: on ? C.green : C.border,
      position:"relative", transition:"background .2s", flexShrink:0,
    }}>
      <div style={{
        position:"absolute", top:3, left: on?15:3,
        width:12, height:12, borderRadius:"50%",
        background: on ? C.bg : C.muted,
        transition:"left .2s",
      }}/>
    </div>
  );
}

export default function App() {
  const [tab,      setTab]      = useState("dashboard");
  const [plan]                  = useState<PlanKey>("free");
  const [items,    setItems]    = useState<Item[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [addOpen,  setAddOpen]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [fetching, setFetching] = useState<number|null>(null);
  const [form,     setForm]     = useState({ url:"", store:STORES[0], name:"" });
  const [error,    setError]    = useState("");

  const max = PLANS[plan].items;

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await supaFetch(`/items?order=created_at.desc`);
      setItems(data || []);
    } catch {
      setError("No se pudieron cargar los artículos.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrice(itemId: number, url: string) {
    setFetching(itemId);
    setError("");
    try {
      // 1. Disparar el actor en Apify
      const runRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: [{ url }], maxItems: 1 }),
        }
      );
      const runData = await runRes.json();
      const runId = runData?.data?.id;
      if (!runId) throw new Error("No se pudo iniciar Apify");

      // 2. Esperar resultado (polling cada 5s, máx 90s)
      let price: number | null = null;
      for (let i = 0; i < 18; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes  = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
        const statusData = await statusRes.json();
        const status     = statusData?.data?.status;

        if (status === "SUCCEEDED") {
          const datasetId = statusData?.data?.defaultDatasetId;
          const itemsRes  = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
          const products  = await itemsRes.json();
          const product   = products?.[0];
          const rawPrice  = product?.price ?? product?.currentPrice ?? product?.salePrice ?? null;
          price = typeof rawPrice === "number"
            ? rawPrice
            : parseFloat(String(rawPrice ?? "").replace(/[^0-9.]/g, "")) || null;
          break;
        }
        if (status === "FAILED" || status === "ABORTED") break;
      }

      if (!price) throw new Error("No se pudo obtener el precio. Intenta con otra URL.");

      // 3. Guardar en Supabase
      const itemData = await supaFetch(`/items?id=eq.${itemId}`);
      const current  = itemData?.[0]?.current_price ?? 0;
      const minPrice = itemData?.[0]?.min_price ?? 0;
      const newMin   = minPrice === 0 ? price : Math.min(minPrice, price);

      await supaFetch(`/items?id=eq.${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ prev_price: current, current_price: price, min_price: newMin }),
      });
      await supaFetch("/price_history", {
        method: "POST",
        body: JSON.stringify({ item_id: itemId, price }),
      });

      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setFetching(null);
    }
  }

  async function addItem() {
    if (!form.url || !form.name) return;
    setSaving(true);
    setError("");
    try {
      const data = await supaFetch("/items", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          store: form.store,
          current_price: 0,
          prev_price: 0,
          min_price: 0,
          currency: "MXN",
          alert_on_drop: true,
        }),
      });
      const newItem = data[0];
      setItems(prev => [newItem, ...prev]);
      setForm({ url:"", store:STORES[0], name:"" });
      setAddOpen(false);
      // Obtener precio automáticamente
      await fetchPrice(newItem.id, newItem.url);
    } catch {
      setError("Error al guardar el artículo.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: number) {
    try {
      await supaFetch(`/items?id=eq.${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(x => x.id !== id));
    } catch {
      setError("Error al eliminar.");
    }
  }

  async function toggleAlert(item: Item) {
    try {
      await supaFetch(`/items?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ alert_on_drop: !item.alert_on_drop }),
      });
      setItems(prev => prev.map(x => x.id===item.id ? {...x, alert_on_drop:!x.alert_on_drop} : x));
    } catch {
      setError("Error al actualizar alerta.");
    }
  }

  const card: CSSProperties = {
    background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
    margin:"0 1rem 10px", padding:"1rem 1.25rem",
  };
  const btnPrimary: CSSProperties = {
    fontSize:13, padding:"8px 16px", borderRadius:10, cursor:"pointer",
    background:C.green, color:C.bg, border:"none", fontWeight:700,
  };
  const btnSecondary: CSSProperties = {
    fontSize:13, padding:"8px 14px", borderRadius:10, cursor:"pointer",
    background:"none", color:C.muted, border:`1px solid ${C.border}`,
  };
  const sectionTitle: CSSProperties = {
    fontSize:11, letterSpacing:3, color:C.dim, textTransform:"uppercase",
    padding:"1.25rem 1.25rem 0.75rem",
  };

  return (
    <div style={{background:C.bg, minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif",
      color:C.text, maxWidth:600, margin:"0 auto", paddingBottom:80}}>

      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 1.25rem 0"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <Logo size={36}/>
          <span style={{fontSize:20, fontWeight:700, letterSpacing:-0.5}}>
            Dropp<span style={{color:C.green}}>d</span>
          </span>
        </div>
        <span style={{fontSize:11, padding:"3px 10px", borderRadius:99,
          border:`1px solid ${C.border}`, background:C.surface, color:C.muted}}>
          {PLANS[plan].name} · {items.length}/{max}
        </span>
      </div>

      {error && (
        <div style={{margin:"1rem", padding:"10px 14px", borderRadius:10,
          background:C.redDim, border:`1px solid ${C.red}44`, color:C.red, fontSize:13}}>
          {error}
        </div>
      )}

      {tab==="dashboard" && (
        <div>
          <div style={{...sectionTitle, display:"flex", justifyContent:"space-between",
            alignItems:"center", paddingRight:"1.25rem"}}>
            <span>{items.length} artículo{items.length!==1?"s":""} rastreado{items.length!==1?"s":""}</span>
            {items.length < max
              ? <button style={btnPrimary} onClick={()=>setAddOpen(o=>!o)}>+ Agregar</button>
              : <button style={{...btnPrimary, background:C.gold}} onClick={()=>setTab("plans")}>Mejorar plan ↗</button>
            }
          </div>

          {addOpen && (
            <div style={{...card, border:`1px solid ${C.green}33`}}>
              <p style={{margin:"0 0 10px", fontSize:14, fontWeight:600, color:C.green}}>Nuevo artículo</p>
              <input placeholder="Nombre del artículo..." value={form.name}
                onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                style={{width:"100%", marginBottom:8, padding:"9px 12px", borderRadius:10,
                  border:`1px solid ${C.border}`, background:C.surface, color:C.text,
                  fontSize:13, boxSizing:"border-box", outline:"none"}}/>
              <input placeholder="Pega la URL del producto..." value={form.url}
                onChange={e=>setForm(f=>({...f,url:e.target.value}))}
                style={{width:"100%", marginBottom:8, padding:"9px 12px", borderRadius:10,
                  border:`1px solid ${C.border}`, background:C.surface, color:C.text,
                  fontSize:13, boxSizing:"border-box", outline:"none"}}/>
              <select value={form.store} onChange={e=>setForm(f=>({...f,store:e.target.value}))}
                style={{width:"100%", marginBottom:12, padding:"9px 12px", borderRadius:10,
                  border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:13}}>
                {STORES.map(s=><option key={s}>{s}</option>)}
              </select>
              <div style={{display:"flex", gap:8}}>
                <button style={btnPrimary} onClick={addItem} disabled={saving}>
                  {saving ? "Guardando..." : "Rastrear"}
                </button>
                <button style={btnSecondary} onClick={()=>setAddOpen(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{textAlign:"center", padding:"4rem 0", color:C.dim, fontSize:14}}>
              Cargando artículos...
            </div>
          ) : items.length===0 ? (
            <div style={{textAlign:"center", padding:"4rem 0", color:C.dim, fontSize:14}}>
              <div style={{fontSize:32, marginBottom:12}}>📦</div>
              Agrega tu primer artículo para empezar a rastrear.
            </div>
          ) : items.map(item=>(
            <div key={item.id} style={card}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:"0 0 3px", fontWeight:600, fontSize:15,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{item.name}</p>
                  <span style={{fontSize:11, color:C.dim, background:C.surface,
                    padding:"2px 8px", borderRadius:99, border:`1px solid ${C.border}`}}>{item.store}</span>
                </div>
                <button onClick={()=>removeItem(item.id)}
                  style={{background:"none", border:"none", cursor:"pointer", color:C.dim, fontSize:16, paddingLeft:10}}>✕</button>
              </div>

              <div style={{marginBottom:10}}>
                {fetching===item.id ? (
                  <div style={{color:C.green, fontSize:14}}>⟳ Obteniendo precio real... (hasta 60 seg)</div>
                ) : (
                  <Badge current={item.current_price} prev={item.prev_price} currency={item.currency}/>
                )}
              </div>

              {item.min_price > 0 && (
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                  background:C.goldDim, borderRadius:10, padding:"6px 12px", marginBottom:10,
                  border:`1px solid ${C.gold}22`}}>
                  <span style={{fontSize:11, color:C.dim}}>Mínimo histórico</span>
                  <span style={{fontSize:13, fontWeight:700, color:C.gold}}>${item.min_price.toLocaleString()} {item.currency}</span>
                </div>
              )}

              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                borderTop:`1px solid ${C.border}`, paddingTop:10}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <Toggle on={item.alert_on_drop} onChange={()=>toggleAlert(item)}/>
                  <span style={{fontSize:12, color: item.alert_on_drop?C.green:C.dim}}>
                    {item.alert_on_drop?"Alerta activa":"Sin alerta"}
                  </span>
                </div>
                <div style={{display:"flex", gap:6}}>
                  <button onClick={()=>fetchPrice(item.id, item.url)}
                    disabled={fetching===item.id}
                    style={{...btnSecondary, fontSize:11, padding:"4px 10px"}}>
                    {fetching===item.id ? "..." : "↻ Actualizar"}
                  </button>
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:11, padding:"4px 10px", borderRadius:8,
                      border:`1px solid ${C.border}`, color:C.muted, textDecoration:"none"}}>
                    Ver ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="plans" && (
        <div>
          <div style={sectionTitle}>Elige tu plan</div>
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS.free][]).map(([key,p])=>(
            <div key={key} style={{...card, border:`1px solid ${key===plan?p.color+"66":C.border}`, position:"relative"}}>
              {key==="pro" && (
                <div style={{position:"absolute", top:-1, left:"50%",
                  transform:"translateX(-50%) translateY(-50%)",
                  background:C.greenDim, color:C.green, fontSize:10,
                  padding:"3px 12px", borderRadius:99,
                  border:`1px solid ${C.green}44`, whiteSpace:"nowrap"}}>
                  ⭐ Más popular
                </div>
              )}
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
                <div>
                  <div style={{fontSize:16, fontWeight:700, marginBottom:2}}>{p.name}</div>
                  <div style={{fontSize:20, fontWeight:700, color:p.color}}>{p.price}</div>
                </div>
                {key===plan && (
                  <span style={{fontSize:11, padding:"3px 10px", borderRadius:99,
                    background:C.surface, color:C.muted, border:`1px solid ${C.border}`}}>Plan actual</span>
                )}
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:6, marginBottom:14}}>
                {[
                  `${p.items===200?"200+":p.items} artículos rastreados`,
                  "Alertas de precio personalizadas",
                  "Historial de precios",
                  ...(key!=="free" ? ["Múltiples tiendas","Compartir artículos"] : []),
                  ...(key==="biz"  ? ["Exportar datos CSV","API access"] : []),
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.muted}}>
                    <span style={{color:p.color, fontSize:12}}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button style={{width:"100%", padding:"10px 0", borderRadius:10, cursor:"pointer",
                fontSize:13, fontWeight:700,
                background: key===plan ? C.surface : p.color,
                color:      key===plan ? C.dim     : C.bg,
                border:     key===plan ? `1px solid ${C.border}` : "none"}}>
                {key===plan ? "Plan actual" : `Elegir ${p.name}`}
              </button>
            </div>
          ))}
        </div>
      )}

      <nav style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:600, background:C.surface,
        borderTop:`1px solid ${C.border}`, display:"flex", zIndex:99}}>
        {[
          {id:"dashboard", icon:"⊞", label:"Artículos"},
          {id:"plans",     icon:"✦", label:"Planes"},
        ].map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{
            flex:1, background:"none", border:"none", cursor:"pointer",
            padding:"12px 0 10px", display:"flex", flexDirection:"column" as const,
            alignItems:"center", gap:4,
            color: tab===n.id ? C.green : C.dim,
          }}>
            <span style={{fontSize:18, lineHeight:1}}>{n.icon}</span>
            <span style={{fontSize:10, fontWeight: tab===n.id?600:400, letterSpacing:0.3}}>{n.label}</span>
            {tab===n.id && <div style={{width:16, height:2, borderRadius:99, background:C.green, marginTop:2}}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}
