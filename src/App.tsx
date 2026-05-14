import { useState, CSSProperties } from "react";

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
  store: string;
  current: number;
  prev: number;
  min: number;
  currency: string;
  history: number[];
  alert: boolean;
}

const SAMPLE: Item[] = [
  { id:1, name:"Apple AirPods Pro (2da gen)", store:"Amazon MX",    current:4199, prev:4599, min:3899, currency:"MXN", history:[4599,4499,4350,4250,4199], alert:true  },
  { id:2, name:"Sony WH-1000XM5",             store:"Mercado Libre", current:7999, prev:7999, min:7499, currency:"MXN", history:[8499,8299,8099,7999,7999], alert:false },
];

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

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data), min = Math.min(...data), r = max-min||1;
  const w=72, h=28, p=3;
  const pts = data.map((v: number, i: number) => {
    const x = p+(i/(data.length-1))*(w-p*2);
    const y = p+(1-(v-min)/r)*(h-p*2);
    return `${x},${y}`;
  }).join(" ");
  const lastPt = pts.split(" ").pop() ?? "0,0";
  const [lx, ly] = lastPt.split(",");
  const col = up ? C.red : C.green;
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="3" fill={col}/>
    </svg>
  );
}

function Badge({ current, prev, currency }: { current: number; prev: number; currency: string }) {
  const pct  = ((current-prev)/prev*100).toFixed(1);
  const down = current < prev;
  const same = current === prev;
  const sym  = currency==="MXN" ? "$" : "US$";
  return (
    <div style={{display:"flex", alignItems:"baseline", gap:8}}>
      <span style={{fontSize:22, fontWeight:700, letterSpacing:-0.5}}>{sym}{current.toLocaleString()}</span>
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
  const [items,    setItems]    = useState<Item[]>(SAMPLE);
  const [alerts,   setAlerts]   = useState<Record<number, boolean>>({1:true, 2:false});
  const [addOpen,  setAddOpen]  = useState(false);
  const [form,     setForm]     = useState({url:"", store:STORES[0]});
  const [expanded, setExpanded] = useState<number|null>(null);

  const max = PLANS[plan].items;

  function addItem() {
    if (!form.url) return;
    const newId = Date.now();
    setItems(p=>[...p,{id:newId, name:"Artículo nuevo", store:form.store,
      current:0, prev:0, min:0, currency:"MXN", history:[0], alert:true}]);
    setAlerts(a=>({...a,[newId]:true}));
    setForm({url:"", store:STORES[0]});
    setAddOpen(false);
  }

  const NAV = [
    {id:"dashboard", icon:"⊞", label:"Artículos"},
    {id:"history",   icon:"↗", label:"Historial"},
    {id:"plans",     icon:"✦", label:"Planes"},
  ];

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

      {/* Top bar */}
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

      {/* Dashboard */}
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
                <button style={btnPrimary} onClick={addItem}>Rastrear</button>
                <button style={btnSecondary} onClick={()=>setAddOpen(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {items.map(item=>(
            <div key={item.id} style={card}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:"0 0 3px", fontWeight:600, fontSize:15,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{item.name}</p>
                  <span style={{fontSize:11, color:C.dim, background:C.surface,
                    padding:"2px 8px", borderRadius:99, border:`1px solid ${C.border}`}}>{item.store}</span>
                </div>
                <button onClick={()=>setItems(i=>i.filter(x=>x.id!==item.id))}
                  style={{background:"none", border:"none", cursor:"pointer", color:C.dim, fontSize:16, paddingLeft:10}}>✕</button>
              </div>

              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                flexWrap:"wrap", gap:8, marginBottom:10}}>
                <Badge current={item.current} prev={item.prev} currency={item.currency}/>
                <Spark data={item.history} up={item.current>item.prev}/>
              </div>

              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                background:C.goldDim, borderRadius:10, padding:"6px 12px", marginBottom:10,
                border:`1px solid ${C.gold}22`}}>
                <span style={{fontSize:11, color:C.dim}}>Mínimo histórico</span>
                <span style={{fontSize:13, fontWeight:700, color:C.gold}}>${item.min.toLocaleString()} {item.currency}</span>
              </div>

              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                borderTop:`1px solid ${C.border}`, paddingTop:10}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <Toggle on={!!alerts[item.id]} onChange={()=>setAlerts(a=>({...a,[item.id]:!a[item.id]}))}/>
                  <span style={{fontSize:12, color: alerts[item.id]?C.green:C.dim}}>
                    {alerts[item.id]?"Alerta activa":"Sin alerta"}
                  </span>
                </div>
                <div style={{display:"flex", gap:6}}>
                  <button style={{...btnSecondary, fontSize:11, padding:"4px 10px"}}
                    onClick={()=>setExpanded(expanded===item.id ? null : item.id)}>
                    Historial
                  </button>
                  <button style={{...btnPrimary, fontSize:11, padding:"4px 10px"}}>Compartir</button>
                </div>
              </div>

              {expanded===item.id && (
                <div style={{marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`}}>
                  <div style={{display:"flex", gap:4, alignItems:"flex-end", height:60}}>
                    {item.history.map((price,i)=>{
                      const isMin = price===Math.min(...item.history);
                      const h = Math.round(16+(price/Math.max(...item.history))*40);
                      return (
                        <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
                          <div style={{width:"100%", height:h, borderRadius:4, background:isMin?C.green:C.border}}/>
                          <span style={{fontSize:9, color:C.dim}}>${price.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{margin:"8px 0 0", fontSize:10, color:C.dim}}>Verde = precio más bajo registrado</p>
                </div>
              )}
            </div>
          ))}

          {items.length===0 && (
            <div style={{textAlign:"center", padding:"4rem 0", color:C.dim, fontSize:14}}>
              <div style={{fontSize:32, marginBottom:12}}>📦</div>
              Agrega tu primer artículo para empezar a rastrear.
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab==="history" && (
        <div>
          <div style={sectionTitle}>Historial de precios</div>
          {items.map(item=>(
            <div key={item.id} style={card}>
              <p style={{margin:"0 0 4px", fontWeight:600, fontSize:14}}>{item.name}</p>
              <p style={{margin:"0 0 14px", fontSize:11, color:C.dim}}>{item.store}</p>
              <div style={{display:"flex", gap:4, alignItems:"flex-end", height:70}}>
                {item.history.map((price,i)=>{
                  const isMin = price===Math.min(...item.history);
                  const h = Math.round(16+(price/Math.max(...item.history))*50);
                  return (
                    <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
                      <div style={{width:"100%", height:h, borderRadius:5, background:isMin?C.green:C.border}}/>
                      <span style={{fontSize:9, color:C.dim}}>${price.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              <p style={{margin:"8px 0 0", fontSize:10, color:C.dim}}>Verde = precio más bajo</p>
            </div>
          ))}
          {items.length===0 && (
            <div style={{textAlign:"center", padding:"4rem 0", color:C.dim, fontSize:14}}>Sin historial aún.</div>
          )}
        </div>
      )}

      {/* Plans */}
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

      {/* Bottom nav */}
      <nav style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:600, background:C.surface,
        borderTop:`1px solid ${C.border}`, display:"flex", zIndex:99}}>
        {NAV.map(n=>(
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
