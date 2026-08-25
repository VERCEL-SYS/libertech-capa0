import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// MÓDULO SEG — Seguridad estándar (PIN gate + log de accesos)
// Patrón reutilizable · v1.0 · Ago 2026
// ═══════════════════════════════════════════════════════════════
const CORRECT_PIN = "2741";
const MAX_ATTEMPTS = 5;
const STORAGE_KEY = "capa0-access-log";
const CASE_STORAGE = "capa0-cases";
const DOC_TITLE = "Validación Capa 0";
const DOC_SUBTITLE = "LIBERTECH · Módulo de Admisibilidad";

async function logAccess(type, details) {
  try {
    const now = new Date().toISOString();
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    const platform = typeof navigator !== "undefined" ? navigator.platform : "unknown";
    const screen = typeof window !== "undefined" && window.screen ? window.screen.width + "x" + window.screen.height : "unknown";
    const entry = { time: now, type, details, ua, platform, screen };
    let existing = [];
    try { const result = await window.storage.get(STORAGE_KEY); if (result && result.value) existing = JSON.parse(result.value); } catch(e) {}
    existing.push(entry);
    if (existing.length > 200) existing = existing.slice(-200);
    await window.storage.set(STORAGE_KEY, JSON.stringify(existing));
  } catch(e) {}
}

async function getAccessLog() {
  try { const result = await window.storage.get(STORAGE_KEY); if (result && result.value) return JSON.parse(result.value); } catch(e) {}
  return [];
}

function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);
  useEffect(() => { logAccess("screen_shown", "PIN gate displayed"); }, []);
  function handleSubmit() {
    if (locked) return;
    if (pin === CORRECT_PIN) { logAccess("access_granted", "PIN correct"); onUnlock(); }
    else {
      const n = attempts + 1; setAttempts(n);
      logAccess("access_denied", "Attempt " + n + " PIN: " + pin.slice(0,1) + "***");
      if (n >= MAX_ATTEMPTS) { setLocked(true); setError("Acceso bloqueado."); logAccess("lockout", "Max attempts"); }
      else setError("PIN incorrecto. Intento " + n + "/" + MAX_ATTEMPTS);
      setPin("");
    }
  }
  async function viewLog() { const l = await getAccessLog(); setLog(l); setShowLog(!showLog); }
  const f = "'Inter', system-ui, sans-serif";
  if (showLog) return (
    <div style={{ fontFamily: f, background: "#0A0D12", color: "#E8E9ED", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Registro de accesos ({log.length})</h3>
          <button onClick={() => setShowLog(false)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #333", background: "transparent", color: "#aaa", fontSize: 12, cursor: "pointer", fontFamily: f }}>Cerrar</button>
        </div>
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {log.slice().reverse().map((e, i) => (
            <div key={i} style={{ padding: "8px 12px", borderBottom: "1px solid #1A1E28", fontSize: 11, lineHeight: 1.5 }}>
              <div style={{ color: e.type === "access_granted" ? "#16C79A" : e.type === "access_denied" ? "#E74C3C" : e.type === "lockout" ? "#C45050" : "#8890A0", fontWeight: 600 }}>{e.type.toUpperCase()}</div>
              <div style={{ color: "#8890A0" }}>{e.time}</div>
              <div style={{ color: "#6a7090" }}>{e.details} · {e.platform} · {e.screen}</div>
            </div>
          ))}
          {log.length === 0 && <div style={{ color: "#4A5060", padding: 20, textAlign: "center" }}>Sin registros</div>}
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ fontFamily: f, background: "#0D1B2A", color: "#E8E9ED", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 340, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{DOC_TITLE}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>{DOC_SUBTITLE}</div>
          <div style={{ fontSize: 10, color: "#4A5060", marginTop: 4 }}>Documento protegido · Acceso restringido</div>
        </div>
        {locked ? (
          <div style={{ padding: 20, background: "#E74C3C15", border: "1px solid #E74C3C40", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#E74C3C", fontWeight: 700 }}>Acceso bloqueado</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>Demasiados intentos fallidos.</div>
          </div>
        ) : (
          <>
            <input type="password" inputMode="numeric" maxLength={8} value={pin} onChange={e => { setPin(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Ingrese PIN"
              style={{ width: "100%", padding: "14px 16px", border: "1px solid " + (error ? "#E74C3C" : "#1E293B"), borderRadius: 10, fontSize: 18, fontFamily: f, color: "#fff", textAlign: "center", background: "#1B2A4A", outline: "none", letterSpacing: 8, boxSizing: "border-box" }} />
            {error && <div style={{ fontSize: 12, color: "#E74C3C", textAlign: "center", marginTop: 8 }}>{error}</div>}
            <button onClick={handleSubmit} style={{ width: "100%", padding: "12px 0", marginTop: 16, borderRadius: 10, border: "none", background: "#16C79A", color: "#0D1B2A", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: f }}>Verificar</button>
          </>
        )}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={viewLog} style={{ background: "none", border: "none", color: "#4A5060", fontSize: 10, cursor: "pointer", fontFamily: f, textDecoration: "underline" }}>Ver registro de accesos</button>
        </div>
      </div>
    </div>
  );
}
// ═══ FIN MÓDULO SEG ═══

const T = { dark: "#0D1B2A", navy: "#1B2A4A", accent: "#16C79A", accentDim: "#0F8B6C", warm: "#E8B931", red: "#E74C3C", surface: "#F7F9FC", card: "#FFFFFF", border: "#E2E8F0", textPrimary: "#1A202C", textSecondary: "#64748B", textMuted: "#94A3B8" };
const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function computeScore(data) {
  let score = 0, flags = [];
  if (data.denunciaFormal === "si") score += 30;
  if (data.tiposDocumentos?.length > 0) score += 25;
  score += Math.min(((data.uploadsDenuncia || 0) + (data.uploadsEvidencia || 0)) * 10, 30);
  if (data.areasAfectacion?.length > 0 && !data.areasAfectacion.includes("ninguna") && data.documentoImpacto === "si") score += 20;
  if (["6-12", "1-3", "3+"].includes(data.duracion)) score += 10;
  if (data.casoActivo === "si") score += 5;
  if (data.multiples === "si") score += 10;
  if (data.respuestaInstitucional === "silencio") { score += 5; flags.push("IER/Loop6"); }
  if (data.medicionesPropias === "si" && data.instrumentos?.length > 0) score += 5;
  if (data.disposicionInstrumental === "si") score += 5;
  if (data.preautorizacionNE === "si") score += 5;
  if (data.fechaDocAntiguo && data.fechaDocReciente) { if ((new Date(data.fechaDocReciente) - new Date(data.fechaDocAntiguo)) / (1000*60*60*24) > 365) score += 10; }
  if (data.diagnosticoErroneo === "si") { score += 5; flags.push("DX-ERRONEO"); }
  if (data.tratamientoForzado === "si") { score += 5; flags.push("TX-FORZADO"); }
  if (data.respuestaJudicialTipo === "no_investigacion") { score += 5; flags.push("IER/NoInvestigación"); }
  if (data.respuestaJudicialTipo === "psiquiatria") { score += 5; flags.push("IER/DerivPsiq"); }
  if (data.acosoOrganizado === "si") { score += 5; flags.push("GS"); }
  if (data.danoEconomico === "si") score += 5;
  if (data.disuasionPolicial === "si") { flags.push("IER/DisuasiónPolicial"); }
  let hypothesis = "H7";
  if (data.denunciaFormal === "si" && data.tiposDocumentos?.length > 1 && score >= 60) hypothesis = "H1";
  else if (data.denunciaFormal === "si" && score >= 40) hypothesis = "H2";
  else if (score >= 30 && score < 60) hypothesis = "H3";
  else if (score < 30 && data.documentoVerificable === "no") hypothesis = "H4";
  const band = score >= 80 ? "alta" : score >= 40 ? "condicionada" : "insuficiente";
  return { score, band, flags, hypothesis };
}

function Input({ label, value, onChange, type="text", placeholder, required, hint }) {
  return (<div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: T.textPrimary, marginBottom: 6, fontFamily: font }}>{label} {required && <span style={{ color: T.red }}>*</span>}</label>
    {hint && <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 6px", fontFamily: font }}>{hint}</p>}
    <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", border: "1px solid " + T.border, borderRadius: 8, fontSize: 14, fontFamily: font, color: T.textPrimary, background: T.card, outline: "none", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
  </div>);
}
function Select({ label, value, onChange, options, required, hint }) {
  return (<div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: T.textPrimary, marginBottom: 6, fontFamily: font }}>{label} {required && <span style={{ color: T.red }}>*</span>}</label>
    {hint && <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 6px", fontFamily: font }}>{hint}</p>}
    <select value={value || ""} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", border: "1px solid " + T.border, borderRadius: 8, fontSize: 14, fontFamily: font, color: value ? T.textPrimary : T.textMuted, background: T.card, outline: "none", boxSizing: "border-box", cursor: "pointer" }}>
      <option value="">Seleccionar...</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>);
}
function MultiCheck({ label, options, selected, onChange, hint }) {
  const toggle = (val) => { if (val === "ninguna" || val === "no_se") { onChange([val]); return; } let next = (selected || []).filter(v => v !== "ninguna" && v !== "no_se"); next = next.includes(val) ? next.filter(v => v !== val) : [...next, val]; onChange(next); };
  return (<div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: T.textPrimary, marginBottom: 6, fontFamily: font }}>{label}</label>
    {hint && <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 8px", fontFamily: font }}>{hint}</p>}
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map(o => { const checked = (selected || []).includes(o.value); return (
        <label key={o.value} onClick={() => toggle(o.value)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: checked ? T.accent + "12" : "transparent", border: "1px solid " + (checked ? T.accent : T.border), fontFamily: font, fontSize: 14, color: T.textPrimary }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, border: "2px solid " + (checked ? T.accent : T.border), background: checked ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}</div>
          {o.label}
        </label>); })}
    </div>
  </div>);
}
function Checkbox({ label, checked, onChange, required }) {
  return (<label onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 8, marginBottom: 12, background: checked ? T.accent + "12" : "transparent", border: "1px solid " + (checked ? T.accent : T.border), fontFamily: font, fontSize: 14, color: T.textPrimary }}>
    <div style={{ width: 20, height: 20, borderRadius: 4, marginTop: 1, border: "2px solid " + (checked ? T.accent : T.border), background: checked ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}</div>
    <span>{label} {required && <span style={{ color: T.red }}>*</span>}</span>
  </label>);
}
function InfoBox({ children, type = "info" }) {
  const c = { info: { bg: T.accent + "10", border: T.accent + "30", icon: "ℹ️" }, warn: { bg: T.warm + "18", border: T.warm, icon: "⚠️" } }[type];
  return (<div style={{ padding: "12px 16px", background: c.bg, border: "1px solid " + c.border, borderRadius: 8, marginBottom: 16 }}><p style={{ fontFamily: font, fontSize: 13, color: T.textPrimary, margin: 0, lineHeight: 1.6 }}>{c.icon} {children}</p></div>);
}
function UploadZone({ label, hint }) {
  return (<div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: T.textPrimary, marginBottom: 6, fontFamily: font }}>{label}</label>
    {hint && <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 6px", fontFamily: font }}>{hint}</p>}
    <div style={{ padding: 24, border: "2px dashed " + T.border, borderRadius: 8, textAlign: "center", color: T.textMuted, fontSize: 14, fontFamily: font, cursor: "pointer", background: T.surface }}>📎 Arrastre archivos aquí o haga clic para seleccionar</div>
  </div>);
}

const countries = ["Afganistán","Albania","Alemania","Angola","Argentina","Armenia","Australia","Austria","Bangladesh","Bélgica","Bolivia","Brasil","Bulgaria","Canadá","Chile","China","Colombia","Corea del Sur","Costa Rica","Croacia","Cuba","Dinamarca","Ecuador","Egipto","El Salvador","Emiratos Árabes Unidos","España","Estados Unidos","Estonia","Filipinas","Finlandia","Francia","Ghana","Grecia","Guatemala","Haití","Honduras","Hungría","India","Indonesia","Irak","Irán","Irlanda","Israel","Italia","Jamaica","Japón","Kazajistán","Kenia","Letonia","Líbano","Lituania","Malasia","Marruecos","México","Moldavia","Nepal","Nicaragua","Nigeria","Noruega","Nueva Zelanda","Países Bajos","Pakistán","Panamá","Paraguay","Perú","Polonia","Portugal","Reino Unido","República Checa","República Dominicana","Rumania","Rusia","Senegal","Serbia","Singapur","Sudáfrica","Suecia","Suiza","Tailandia","Taiwán","Tanzania","Turquía","Ucrania","Uganda","Uruguay","Venezuela","Vietnam","Zambia","Zimbabue"].map(c => ({ value: c, label: c }));

const SECTIONS = [
  { id: "code", title: "Acceso", icon: "🔐" },
  { id: "A", title: "Identificación", icon: "👤" },
  { id: "B", title: "Trazabilidad Institucional", icon: "🏛" },
  { id: "B2", title: "Respuesta Institucional", icon: "⚖️" },
  { id: "C", title: "Evidencia Básica", icon: "📄" },
  { id: "D", title: "Voluntad y Disposición", icon: "🤝" },
  { id: "E", title: "Consentimiento", icon: "✍️" },
  { id: "F", title: "Impacto Funcional", icon: "📊" },
  { id: "G", title: "Contexto Tecnológico", icon: "📡" },
  { id: "H", title: "Entorno y Acoso", icon: "🛡" },
  { id: "review", title: "Revisión y Envío", icon: "✅" },
];

function StepCode({ data, set }) { return (<div><div style={{ textAlign: "center", marginBottom: 32 }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div><h2 style={{ fontFamily: font, fontSize: 22, color: T.dark, margin: "0 0 8px", fontWeight: 700 }}>Ingrese su código de acceso</h2><p style={{ fontFamily: font, fontSize: 14, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>Este código fue enviado a su correo electrónico por Fundación LIBERTECH. Es de uso único y tiene fecha de expiración.</p></div><Input label="Código de acceso" value={data.accessCode} onChange={v => set("accessCode", v.toUpperCase())} placeholder="Ej: LBT-2026-A7X9K" required hint="Alfanumérico, enviado por el equipo de LIBERTECH" /></div>); }

function StepA({ data, set }) { return (<div>
  <Input label="Nombre completo" value={data.nombre} onChange={v => set("nombre", v)} required placeholder="Nombre y apellidos" />
  <Select label="Nacionalidad" value={data.nacionalidad} onChange={v => set("nacionalidad", v)} options={countries} required />
  <Select label="País de residencia actual" value={data.paisResidencia} onChange={v => set("paisResidencia", v)} options={countries} required />
  <Input label="Ciudad / Región" value={data.ciudad} onChange={v => set("ciudad", v)} required placeholder="Ciudad o región" hint="Geolocalización general — no se requiere dirección exacta" />
  <Select label="Condición de permanencia" value={data.permanencia} onChange={v => set("permanencia", v)} options={[{value:"nacional",label:"Nacional"},{value:"residente",label:"Residente"},{value:"transitorio",label:"Transitorio"},{value:"refugiado",label:"Refugiado/a"},{value:"otro",label:"Otro"}]} />
  <Input label="Email de contacto seguro" value={data.email} onChange={v => set("email", v)} type="email" required placeholder="correo@ejemplo.com" hint="Para todas las comunicaciones sobre su caso" />
  <Select label="Idioma preferido" value={data.idioma} onChange={v => set("idioma", v)} required options={[{value:"es",label:"Español"},{value:"en",label:"English"},{value:"pt",label:"Português"}]} />
  <Select label="Zona horaria" value={data.zonaHoraria} onChange={v => set("zonaHoraria", v)} required options={[{value:"UTC-8",label:"UTC-8 (US Pacific)"},{value:"UTC-6",label:"UTC-6 (México, Guatemala)"},{value:"UTC-5",label:"UTC-5 (Colombia, Perú, US Eastern)"},{value:"UTC-4",label:"UTC-4 (Chile, Venezuela, Bolivia)"},{value:"UTC-3",label:"UTC-3 (Argentina, Brasil, Uruguay)"},{value:"UTC+0",label:"UTC+0 (UK, Portugal)"},{value:"UTC+1",label:"UTC+1 (España, Francia, Alemania)"},{value:"UTC+8",label:"UTC+8 (Filipinas, Singapur)"},{value:"otro_tz",label:"Otra"}]} />
  <Select label="¿Pertenece a alguna asociación u organización de víctimas?" value={data.asociacion} onChange={v => set("asociacion", v)} hint="Ej: VIACTEC, Targeted Justice, ICATOR, otra" options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} />
  {data.asociacion === "si" && <Input label="Nombre de la organización" value={data.nombreAsociacion} onChange={v => set("nombreAsociacion", v)} placeholder="Ej: VIACTEC España" />}
</div>); }

function StepB({ data, set }) { return (<div>
  <Select label="¿Ha presentado al menos una denuncia formal ante una institución pública?" value={data.denunciaFormal} onChange={v => set("denunciaFormal", v)} required options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"en_proceso",label:"En proceso"}]} />
  {(data.denunciaFormal === "si" || data.denunciaFormal === "en_proceso") && (<>
    <Select label="Tipo de institución" value={data.tipoInstitucion} onChange={v => set("tipoInstitucion", v)} options={[{value:"policia",label:"Policía / Cuerpos de seguridad"},{value:"fiscalia",label:"Fiscalía / Ministerio Público"},{value:"defensoria",label:"Defensoría del Pueblo / Ombudsman"},{value:"regulador",label:"Regulador / Agencia Protección Datos"},{value:"tribunal",label:"Tribunal / Juzgado"},{value:"otro",label:"Otro organismo público"}]} />
    <Input label="Nombre de la institución" value={data.institucion} onChange={v => set("institucion", v)} placeholder="Ej: Guardia Civil, Fiscalía Regional, AEPD..." />
    <Input label="Fecha de la denuncia" value={data.fechaDenuncia} onChange={v => set("fechaDenuncia", v)} type="date" />
    <Input label="Número de expediente o referencia" value={data.numExpediente} onChange={v => set("numExpediente", v)} placeholder="Opcional — valorado en evaluación" />
    <Select label="¿Recibió respuesta institucional?" value={data.respuestaInstitucional} onChange={v => set("respuestaInstitucional", v)} options={[{value:"si",label:"Sí — recibí respuesta"},{value:"no",label:"No — aún en espera"},{value:"silencio",label:"Silencio administrativo"}]} />
    {data.respuestaInstitucional === "silencio" && <InfoBox type="warn">El silencio administrativo ha sido registrado como indicador relevante para su caso.</InfoBox>}
  </>)}
  <Select label="¿Tiene más de una denuncia presentada?" value={data.multiples} onChange={v => set("multiples", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} />
  {data.multiples === "si" && <Input label="¿Cuántas denuncias en total?" value={data.cantidadDenuncias} onChange={v => set("cantidadDenuncias", v)} type="number" placeholder="2" />}
  <UploadZone label="Adjuntar comprobante de denuncia (opcional)" hint="PDF o imagen. Máx. 10 MB. Encriptado en reposo." />
</div>); }

function StepB2({ data, set }) { return (<div>
  <InfoBox type="info">Esta sección evalúa la calidad de la respuesta institucional recibida. Fundamental para documentar posibles patrones de invisibilización.</InfoBox>
  <Select label="¿Cuál ha sido la respuesta judicial o institucional a sus denuncias?" value={data.respuestaJudicialTipo} onChange={v => set("respuestaJudicialTipo", v)} hint="Seleccione la que mejor describe su experiencia" options={[{value:"investigacion",label:"Se abrió investigación formal"},{value:"derivacion",label:"Fue derivado/a a otro organismo"},{value:"no_investigacion",label:"No se investigó — archivada o desestimada"},{value:"psiquiatria",label:"Fue derivado/a a servicios de salud mental"},{value:"sin_respuesta",label:"No recibió respuesta alguna"},{value:"ns_nc",label:"No sabe / No contesta"}]} />
  {data.respuestaJudicialTipo === "psiquiatria" && <InfoBox type="warn">La derivación a salud mental como respuesta a denuncia formal ha sido registrada como indicador IER.</InfoBox>}
  <Select label="¿Ha recibido un diagnóstico psiquiátrico que considere erróneo o no fundamentado en pruebas clínicas?" value={data.diagnosticoErroneo} onChange={v => set("diagnosticoErroneo", v)} hint="Ej: diagnóstico sin entrevista clínica, sin exámenes neurológicos, o emitido tras una denuncia" options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ns",label:"No sabe / No aplica"}]} />
  {data.diagnosticoErroneo === "si" && (<>
    <Select label="¿Le realizaron pruebas clínicas previas al diagnóstico?" value={data.pruebasPrevias} onChange={v => set("pruebasPrevias", v)} options={[{value:"si",label:"Sí — pruebas formales"},{value:"no",label:"No — diagnóstico sin pruebas"},{value:"parcial",label:"Parcialmente"}]} />
    <Select label="¿El diagnóstico fue emitido antes o después de presentar denuncia?" value={data.dxTiming} onChange={v => set("dxTiming", v)} options={[{value:"antes",label:"Antes de denunciar"},{value:"despues",label:"Después de denunciar"},{value:"sin_relacion",label:"Sin relación con denuncia"},{value:"ns",label:"No sabe"}]} />
  </>)}
  <Select label="¿Ha sido sometido/a a tratamiento psiquiátrico forzado?" value={data.tratamientoForzado} onChange={v => set("tratamientoForzado", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"pasado",label:"En el pasado"}]} />
  <Select label="¿Cuando ha denunciado, algún miembro de las fuerzas de seguridad ha intentado disuadirle o ha cuestionado su testimonio?" value={data.disuasionPolicial} onChange={v => set("disuasionPolicial", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ns",label:"No sabe / No aplica"}]} />
  <Select label="¿Cree que el diagnóstico o tratamiento recibido le resta credibilidad para denunciar?" value={data.credibilidadAfectada} onChange={v => set("credibilidadAfectada", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ns",label:"No sabe"}]} />
  <Select label="¿Tendría temor de denunciar abiertamente por posibles repercusiones?" value={data.miedoDenunciar} onChange={v => set("miedoDenunciar", v)} hint="Esta información es confidencial" options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"parcial",label:"Parcialmente"}]} />
</div>); }

function StepC({ data, set }) { return (<div>
  <Select label="¿Cuenta con al menos un documento verificable que respalde los hechos?" value={data.documentoVerificable} onChange={v => set("documentoVerificable", v)} required options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"en_proceso",label:"En proceso de obtenerlo"}]} />
  {data.documentoVerificable === "no" && <InfoBox type="warn">Su caso será derivado a orientación institucional general. Podrá re-enviar cuando disponga de documentación.</InfoBox>}
  {(data.documentoVerificable === "si" || data.documentoVerificable === "en_proceso") && (<>
    <MultiCheck label="Tipo de documentos disponibles" hint="Marque todos los que apliquen" selected={data.tiposDocumentos} onChange={v => set("tiposDocumentos", v)} options={[{value:"constancia_policial",label:"Constancia policial / parte de denuncia"},{value:"informe_medico",label:"Informe médico"},{value:"informe_psicologico",label:"Informe psicológico o psiquiátrico"},{value:"correo_institucional",label:"Correo o comunicación institucional"},{value:"registro_bancario",label:"Registro bancario / comprobante financiero"},{value:"captura_pantalla",label:"Captura de pantalla"},{value:"grabacion",label:"Grabación de audio/video"},{value:"resolucion_judicial",label:"Resolución judicial / auto"},{value:"diagnostico_medico",label:"Diagnóstico médico formal"},{value:"otro_doc",label:"Otro"}]} />
    <Input label="Fecha del documento más antiguo" value={data.fechaDocAntiguo} onChange={v => set("fechaDocAntiguo", v)} type="date" hint="Inicio de la línea temporal" />
    <Input label="Fecha del documento más reciente" value={data.fechaDocReciente} onChange={v => set("fechaDocReciente", v)} type="date" hint="Fin de la línea temporal" />
    {data.fechaDocAntiguo && data.fechaDocReciente && (() => { const d = Math.round((new Date(data.fechaDocReciente) - new Date(data.fechaDocAntiguo)) / (1000*60*60*24)); return <InfoBox>Ventana temporal: {d} días ({(d/365).toFixed(1)} años)</InfoBox>; })()}
    <UploadZone label="Adjuntar documentos (hasta 5)" hint="PDF, JPG, PNG. Máx. 10 MB c/u." />
  </>)}
</div>); }

function StepD({ data, set }) { return (<div>
  <Select label="¿Está dispuesto/a a denunciar formalmente si recibe orientación?" value={data.disposicionDenuncia} onChange={v => set("disposicionDenuncia", v)} required options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ya_hice",label:"Ya lo hice"}]} />
  <Select label="¿Estaría dispuesto/a a participar en documentación instrumental (mediciones técnicas)?" value={data.disposicionInstrumental} onChange={v => set("disposicionInstrumental", v)} required hint="Protocolo SA-09 — mediciones con instrumentos especializados" options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"mas_info",label:"Necesito más información"}]} />
  <Select label="¿Autoriza contacto por parte de NeuroEthics Research Lab para evaluación técnica?" value={data.preautorizacionNE} onChange={v => set("preautorizacionNE", v)} required hint="Derivación voluntaria" options={[{value:"si",label:"Sí, autorizo"},{value:"no",label:"No por ahora"},{value:"mas_adelante",label:"Más adelante"}]} />
  <Select label="¿Estaría a favor de participar en una acción legal colectiva si se organizara?" value={data.accionColectiva} onChange={v => set("accionColectiva", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"mas_info",label:"Necesito más información"}]} />
</div>); }

function StepE({ data, set }) { return (<div>
  <div style={{ padding: "16px 20px", background: T.navy + "08", border: "1px solid " + T.navy + "22", borderRadius: 10, marginBottom: 24 }}><p style={{ fontFamily: font, fontSize: 14, color: T.textPrimary, margin: 0, lineHeight: 1.7 }}>Los siguientes consentimientos son fundamentales. Lea cada uno cuidadosamente.</p></div>
  <Checkbox label="Autorizo que Fundación LIBERTECH evalúe únicamente información documental verificable, excluyendo interpretaciones personales." checked={data.consentimientoDocumental} onChange={v => set("consentimientoDocumental", v)} required />
  <Checkbox label="Autorizo el uso judicial del informe que resulte del análisis." checked={data.usoJudicial} onChange={v => set("usoJudicial", v)} />
  <Checkbox label="Autorizo el uso académico anonimizado de los datos estructurales de mi caso." checked={data.usoAcademico} onChange={v => set("usoAcademico", v)} />
  <Checkbox label="Declaro que la información proporcionada es veraz y completa según mi conocimiento." checked={data.veracidad} onChange={v => set("veracidad", v)} required />
  <Checkbox label="He leído y acepto la Política de Privacidad de Fundación LIBERTECH." checked={data.privacidad} onChange={v => set("privacidad", v)} required />
  <Checkbox label="Comprendo que este formulario no constituye inicio de análisis pericial ni implica validación automática del caso." checked={data.comprension} onChange={v => set("comprension", v)} required />

  {/* ── Declaración formal ── */}
  <div style={{ marginTop: 28, padding: "20px 24px", background: T.dark, borderRadius: 12, color: "#fff" }}>
    <div style={{ fontSize: 11, color: T.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, fontFamily: font, fontWeight: 700 }}>Declaración formal</div>
    <p style={{ fontFamily: font, fontSize: 13, color: "#C8CCD4", lineHeight: 1.8, margin: "0 0 16px" }}>
      Yo, <strong style={{ color: "#fff" }}>{data.nombre || "[nombre]"}</strong>, con residencia en <strong style={{ color: "#fff" }}>{data.paisResidencia || "[país]"}</strong>, declaro que soy víctima de vulneración de mis derechos fundamentales, incluyendo mi identidad y dignidad humana, en el contexto de los hechos descritos en el presente formulario.
    </p>
    <p style={{ fontFamily: font, fontSize: 13, color: "#C8CCD4", lineHeight: 1.8, margin: "0 0 16px" }}>
      Que tales hechos afectan a mi integridad física, cognitiva y/o emocional, y que formulo la presente declaración de manera libre, voluntaria e informada ante Fundación LIBERTECH, en el marco de su Protocolo de Contactos Sensibles y conforme a los principios establecidos por el Informe A/HRC/43/49 del Relator Especial de Naciones Unidas.
    </p>
    <p style={{ fontFamily: font, fontSize: 13, color: "#C8CCD4", lineHeight: 1.8, margin: "0 0 20px" }}>
      Solicito que mis antecedentes sean evaluados conforme a los criterios de admisibilidad de LIBERTECH, con el fin de acceder a orientación, documentación instrumental y/o derivación pericial según corresponda.
    </p>

    <Checkbox label="Confirmo esta declaración y acepto que constituye una manifestación formal de voluntad con valor de firma electrónica simple."
      checked={data.declaracionFormal} onChange={v => set("declaracionFormal", v)} required />

    <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
      <div style={{ flex: 1 }}>
        <label style={{ display: "block", fontSize: 11, color: T.textMuted, marginBottom: 6, fontFamily: font }}>Firma digital (escriba su nombre completo) *</label>
        <input type="text" value={data.firmaDigital || ""} onChange={e => set("firmaDigital", e.target.value)} placeholder="Nombre completo como firma"
          style={{ width: "100%", padding: "10px 14px", border: "1px solid #2A3A5A", borderRadius: 8, fontSize: 16, fontFamily: "'Caveat', cursive, " + font, color: "#fff", background: "#1B2A4A", outline: "none", boxSizing: "border-box", fontStyle: "italic" }} />
      </div>
      <div style={{ width: 140 }}>
        <label style={{ display: "block", fontSize: 11, color: T.textMuted, marginBottom: 6, fontFamily: font }}>Fecha *</label>
        <input type="date" value={data.fechaFirma || ""} onChange={e => set("fechaFirma", e.target.value)}
          style={{ width: "100%", padding: "10px 14px", border: "1px solid #2A3A5A", borderRadius: 8, fontSize: 14, fontFamily: font, color: "#fff", background: "#1B2A4A", outline: "none", boxSizing: "border-box" }} />
      </div>
    </div>
    {data.firmaDigital && data.fechaFirma && data.declaracionFormal && (
      <div style={{ marginTop: 16, padding: "10px 14px", background: T.accent + "18", border: "1px solid " + T.accent + "40", borderRadius: 8 }}>
        <p style={{ fontFamily: font, fontSize: 12, color: T.accent, margin: 0 }}>✓ Declaración firmada por <strong>{data.firmaDigital}</strong> el {data.fechaFirma}</p>
      </div>
    )}
  </div>
</div>); }

function StepF({ data, set }) { return (<div>
  <Input label="¿Cuánto tiempo hace que es consciente de la situación que describe?" value={data.tiempoConsciente} onChange={v => set("tiempoConsciente", v)} placeholder="Ej: 3 años" hint="Desde que usted identificó la situación" />
  <MultiCheck label="¿Los hechos han generado afectación verificable en alguna de estas áreas?" hint="Marque todas" selected={data.areasAfectacion} onChange={v => set("areasAfectacion", v)} options={[{value:"comunicaciones",label:"Comunicaciones (bloqueos, alteraciones, pérdida acceso)"},{value:"digital",label:"Entorno digital (modificación no autorizada archivos, dispositivos)"},{value:"profesional",label:"Profesional o económica (pérdida empleo, ingresos)"},{value:"salud",label:"Salud (informes médicos, hospitalizaciones)"},{value:"legal",label:"Legal/institucional (obstaculización denuncias)"},{value:"familiar",label:"Relaciones familiares o de pareja"},{value:"psicoemocional",label:"Bienestar psicoemocional"},{value:"ninguna",label:"Ninguna de las anteriores"}]} />
  {data.areasAfectacion?.length > 0 && !data.areasAfectacion.includes("ninguna") && <Select label="¿Cuenta con documento verificable para al menos una de las áreas?" value={data.documentoImpacto} onChange={v => set("documentoImpacto", v)} required options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"en_proceso",label:"En proceso"}]} />}
  <Select label="¿Ha cambiado su situación económica como consecuencia?" value={data.danoEconomico} onChange={v => set("danoEconomico", v)} options={[{value:"si",label:"Sí, ha empeorado"},{value:"no",label:"No"},{value:"mejorado",label:"Ha mejorado"}]} />
  <Select label="Duración estimada de la afectación" value={data.duracion} onChange={v => set("duracion", v)} required options={[{value:"<1",label:"Menos de 1 mes"},{value:"1-6",label:"1 a 6 meses"},{value:"6-12",label:"6 a 12 meses"},{value:"1-3",label:"1 a 3 años"},{value:"3+",label:"Más de 3 años"}]} />
  <Select label="¿La afectación continúa actualmente?" value={data.casoActivo} onChange={v => set("casoActivo", v)} required options={[{value:"si",label:"Sí"},{value:"no",label:"No — cesó"}]} />
  <Select label="¿Ha recibido atención profesional (médica, psicológica, legal)?" value={data.atencionProfesional} onChange={v => set("atencionProfesional", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"en_proceso",label:"En proceso"}]} />
  <Select label="¿Solo usted es afectado/a, o hay otras personas?" value={data.otrosAfectados} onChange={v => set("otrosAfectados", v)} options={[{value:"solo_yo",label:"Solo yo"},{value:"familia",label:"También mi familia"},{value:"otros",label:"Otras personas afectadas"},{value:"ns",label:"No sabe"}]} />
</div>); }

function StepG({ data, set }) { return (<div>
  <InfoBox>Esta sección es opcional. "No lo sé" es perfectamente válido.</InfoBox>
  <MultiCheck label="¿Qué tipo de tecnología cree involucrada?" selected={data.tipoTecnologia} onChange={v => set("tipoTecnologia", v)} options={[{value:"comunicaciones",label:"Interferencia en comunicaciones"},{value:"acceso_dispositivos",label:"Acceso no autorizado a dispositivos"},{value:"vigilancia",label:"Vigilancia / seguimiento"},{value:"rf_emf",label:"Señales RF / EMF / microondas"},{value:"acustica",label:"Acústica / sonidos / frecuencias"},{value:"neurotech",label:"Neurotecnología / estimulación remota"},{value:"redes_sociales",label:"Redes sociales / cyberbullying"},{value:"hackeo",label:"Hackeo de dispositivos"},{value:"no_se",label:"No lo sé"},{value:"otro_tech",label:"Otro"}]} />
  <Select label="¿Ha realizado mediciones técnicas propias?" value={data.medicionesPropias} onChange={v => set("medicionesPropias", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} />
  {data.medicionesPropias === "si" && (<>
    <MultiCheck label="Instrumentos utilizados" selected={data.instrumentos} onChange={v => set("instrumentos", v)} options={[{value:"tinysa",label:"TinySA / TinySA Ultra"},{value:"emf",label:"Medidor EMF"},{value:"dosimetro",label:"Dosímetro"},{value:"app",label:"Aplicación móvil"},{value:"otro_inst",label:"Otro"}]} />
    <Select label="¿Tiene registros de esas mediciones?" value={data.registrosMediciones} onChange={v => set("registrosMediciones", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} />
  </>)}
  <Select label="¿Ha identificado un posible origen o fuente?" value={data.origenIdentificado} onChange={v => set("origenIdentificado", v)} hint="'Prefiero no responder' es válido" options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"sospecha",label:"Tengo sospechas"},{value:"prefiero_no",label:"Prefiero no responder"}]} />
  <MultiCheck label="Entorno predominante" selected={data.entorno} onChange={v => set("entorno", v)} options={[{value:"domicilio",label:"Domicilio"},{value:"trabajo",label:"Trabajo"},{value:"transporte",label:"Transporte"},{value:"publico",label:"Espacio público"},{value:"multiple",label:"Múltiple / todos"}]} />
</div>); }

function StepH({ data, set }) { return (<div>
  <InfoBox>Esta sección es opcional y ayuda a documentar el contexto situacional. No implica validación de las alegaciones.</InfoBox>
  <Select label="¿Ha notado que le hayan seguido o vigilado de manera coordinada?" value={data.acosoOrganizado} onChange={v => set("acosoOrganizado", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ns",label:"No está seguro"}]} />
  <Select label="¿Tiene indicios de acceso no autorizado a su domicilio?" value={data.intrusionDomicilio} onChange={v => set("intrusionDomicilio", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ns",label:"No está seguro"}]} />
  <Select label="¿Ha experimentado daños reiterados e inexplicables en equipos electrónicos?" value={data.danosEquipos} onChange={v => set("danosEquipos", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ns",label:"No está seguro"}]} />
  <Select label="¿Ha sido difamado/a en su ambiente laboral, vecinal o familiar?" value={data.difamacion} onChange={v => set("difamacion", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"ns",label:"No está seguro"}]} />
  <Select label="¿Su familia y personas cercanas le creen?" value={data.familiaCreencia} onChange={v => set("familiaCreencia", v)} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"parcial",label:"Parcialmente"},{value:"no_saben",label:"No les he contado"}]} />
  <Select label="¿Conoce o tiene indicios del motivo por el cual ocurren los hechos?" value={data.motivoConocido} onChange={v => set("motivoConocido", v)} hint="'Prefiero no responder' es válido" options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"sospecha",label:"Tengo sospechas"},{value:"prefiero_no",label:"Prefiero no responder"}]} />
</div>); }

function StepReview({ data }) {
  const { score, band, flags, hypothesis } = computeScore(data);
  const bandColors = { alta: T.accent, condicionada: T.warm, insuficiente: T.red };
  const bandLabels = { alta: "Alta admisibilidad", condicionada: "Admisibilidad condicionada", insuficiente: "Admisibilidad insuficiente" };
  const hLabels = { H1:"Alegación genuina + fenómeno tecnológico", H2:"Alegación genuina + causa diferente", H3:"Combinación de factores", H4:"Interpretación causal errónea", H5:"Relato fabricado", H6:"Caso adversarial", H7:"Indeterminado" };
  const summary = [
    { label:"Nombre", value:data.nombre }, { label:"País", value:data.paisResidencia },
    { label:"Asociación", value:data.asociacion==="si"?data.nombreAsociacion||"Sí":"No" },
    { label:"Denuncia formal", value:{si:"Sí",no:"No",en_proceso:"En proceso"}[data.denunciaFormal]||"—" },
    { label:"Respuesta institucional", value:{investigacion:"Investigación",derivacion:"Derivado",no_investigacion:"No investigado",psiquiatria:"Derivado salud mental",sin_respuesta:"Sin respuesta",ns_nc:"NS/NC"}[data.respuestaJudicialTipo]||"—" },
    { label:"Dx erróneo", value:{si:"Sí",no:"No",ns:"NS"}[data.diagnosticoErroneo]||"—" },
    { label:"Evidencia", value:data.tiposDocumentos?.length?data.tiposDocumentos.length+" tipo(s)":"—" },
    { label:"Áreas afectación", value:data.areasAfectacion?.filter(a=>a!=="ninguna").length?data.areasAfectacion.filter(a=>a!=="ninguna").length+" área(s)":"—" },
    { label:"Duración", value:{"<1":"< 1 mes","1-6":"1-6 meses","6-12":"6-12 meses","1-3":"1-3 años","3+":"> 3 años"}[data.duracion]||"—" },
    { label:"Caso activo", value:data.casoActivo==="si"?"Sí":"No" },
    { label:"Consentimiento documental", value:data.consentimientoDocumental?"✓":"✗" },
    { label:"Pre-autorización NeuroEthics", value:{si:"Sí",no:"No",mas_adelante:"Más adelante"}[data.preautorizacionNE]||"—" },
    { label:"Declaración formal", value:data.declaracionFormal?"✓ Firmada ("+data.firmaDigital+", "+data.fechaFirma+")":"✗ Pendiente" },
  ];
  return (<div>
    <div style={{ textAlign:"center", marginBottom:28 }}><h2 style={{ fontFamily:font, fontSize:20, color:T.dark, margin:"0 0 8px", fontWeight:700 }}>Revisión de su formulario</h2><p style={{ fontFamily:font, fontSize:14, color:T.textSecondary, margin:0 }}>Verifique que la información sea correcta antes de enviar.</p></div>
    <div style={{ background:T.surface, borderRadius:10, padding:20, marginBottom:24 }}>
      {summary.map((s,i) => (<div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<summary.length-1?"1px solid "+T.border:"none" }}><span style={{ fontFamily:font, fontSize:13, color:T.textSecondary }}>{s.label}</span><span style={{ fontFamily:font, fontSize:13, color:T.textPrimary, fontWeight:600, textAlign:"right", maxWidth:"55%" }}>{s.value||"—"}</span></div>))}
    </div>
    <div style={{ background:T.dark, borderRadius:12, padding:24, color:"#fff" }}>
      <p style={{ fontFamily:font, fontSize:10, color:T.textMuted, margin:"0 0 16px", textTransform:"uppercase", letterSpacing:1.5 }}>Panel interno — no visible para el solicitante</p>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
        <div style={{ width:64, height:64, borderRadius:"50%", border:"3px solid "+bandColors[band], display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, fontFamily:font, color:bandColors[band] }}>{score}</div>
        <div><div style={{ fontFamily:font, fontSize:16, fontWeight:700, color:bandColors[band] }}>{bandLabels[band]}</div><div style={{ fontFamily:font, fontSize:12, color:T.textMuted }}>Score Capa 0 — máx. ~185</div></div>
      </div>
      {flags.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>{flags.map(f => <span key={f} style={{ padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:700, background:T.warm+"30", color:T.warm, fontFamily:font }}>{f}</span>)}</div>}
      <div style={{ padding:"12px 16px", background:"#1B2A4A", borderRadius:8, marginBottom:12 }}>
        <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontFamily:font }}>Hipótesis (Pre-Informales)</div>
        <div style={{ fontSize:14, fontWeight:700, color:T.accent, fontFamily:font }}>{hypothesis}</div>
        <div style={{ fontSize:11, color:"#8890A0", fontFamily:font }}>{hLabels[hypothesis]}</div>
      </div>
      <div style={{ padding:"12px 16px", background:"#1B2A4A", borderRadius:8, marginBottom:12 }}>
        <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontFamily:font }}>Fase temporal</div>
        <div style={{ fontSize:12, fontWeight:600, color:"#8890A0", fontFamily:font }}>T0 — Pre-investigation / Spontaneous claimant intake</div>
      </div>
      <div style={{ padding:"12px 16px", background:"#1B2A4A", borderRadius:8 }}>
        <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontFamily:font }}>Tipo de declaración</div>
        <div style={{ fontSize:12, fontWeight:600, color:"#8890A0", fontFamily:font }}>Elicited — Post-protocol (formulario estructurado con código de acceso)</div>
      </div>
    </div>
  </div>);
}

function Capa0Module() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const set = useCallback((key, val) => { setData(prev => ({ ...prev, [key]: val })); }, []);
  const canAdvance = () => {
    if (step === 0) return data.accessCode?.length >= 5;
    if (step === 1) return data.nombre && data.nacionalidad && data.paisResidencia && data.ciudad && data.email && data.idioma && data.zonaHoraria;
    if (step === 2) return data.denunciaFormal;
    if (step === 3) return true;
    if (step === 4) return data.documentoVerificable;
    if (step === 5) return data.disposicionDenuncia && data.disposicionInstrumental && data.preautorizacionNE;
    if (step === 6) return data.consentimientoDocumental && data.veracidad && data.privacidad && data.comprension && data.declaracionFormal && data.firmaDigital && data.fechaFirma;
    if (step === 7) return data.duracion && data.casoActivo;
    if (step === 8) return true;
    if (step === 9) return true;
    return true;
  };
  const handleNext = () => { if (step === 0 && !codeVerified) { setCodeVerified(true); setStep(1); return; } if (step < SECTIONS.length - 1) setStep(step + 1); };
  const handleSubmit = async () => {
    setSubmitted(true);
    const { score, band, flags, hypothesis } = computeScore(data);
    const caseRef = "RC-2026-" + String(Math.floor(Math.random() * 900) + 100);
    try {
      let cases = [];
      try { const r = await window.storage.get(CASE_STORAGE); if (r?.value) cases = JSON.parse(r.value); } catch(e) {}
      cases.push({ ref: caseRef, time: new Date().toISOString(), score, band, flags, hypothesis, nombre: data.nombre, pais: data.paisResidencia, email: data.email });
      if (cases.length > 100) cases = cases.slice(-100);
      await window.storage.set(CASE_STORAGE, JSON.stringify(cases));
    } catch(e) {}
    logAccess("case_submitted", "Case " + caseRef + " score=" + score + " band=" + band + " hyp=" + hypothesis);
    set("caseRef", caseRef);
  };
  if (submitted) return (
    <div style={{ minHeight:"100vh", background:T.surface, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:font }}>
      <div style={{ maxWidth:520, width:"100%", background:T.card, borderRadius:16, padding:48, textAlign:"center", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:56, marginBottom:20 }}>✅</div>
        <h2 style={{ fontSize:22, color:T.dark, margin:"0 0 12px", fontWeight:700 }}>Formulario enviado correctamente</h2>
        <p style={{ fontSize:15, color:T.textSecondary, lineHeight:1.7, margin:"0 0 24px" }}>Su caso ha sido recibido por Fundación LIBERTECH. Recibirá notificación a <strong>{data.email}</strong>.</p>
        <div style={{ background:T.surface, borderRadius:10, padding:16, marginBottom:24 }}><p style={{ fontSize:13, color:T.textMuted, margin:"0 0 4px" }}>Referencia de caso</p><p style={{ fontSize:20, color:T.dark, fontWeight:800, margin:0, letterSpacing:1 }}>{data.caseRef}</p></div>
        <p style={{ fontSize:12, color:T.textMuted, lineHeight:1.6 }}>El envío no implica validación del caso ni inicio de análisis pericial. LIBERTECH evaluará conforme al Protocolo de Contactos Sensibles v1.0.</p>
      </div>
    </div>
  );
  const progress = (step / (SECTIONS.length - 1)) * 100;
  const cur = SECTIONS[step];
  return (
    <div style={{ minHeight:"100vh", background:T.surface, fontFamily:font }}>
      <div style={{ background:T.dark, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:T.dark }}>L</div>
          <div><div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>LIBERTECH</div><div style={{ fontSize:11, color:T.textMuted, letterSpacing:0.5 }}>Validación Capa 0</div></div>
        </div>
        {codeVerified && <div style={{ fontSize:12, color:T.textMuted }}>Código: <span style={{ color:T.accent, fontWeight:600 }}>{data.accessCode}</span></div>}
      </div>
      {codeVerified && <div style={{ height:3, background:T.accent+"20" }}><div style={{ height:"100%", background:T.accent, width:progress+"%", transition:"width 0.4s ease" }} /></div>}
      {codeVerified && <div style={{ padding:"12px 24px", background:T.card, borderBottom:"1px solid "+T.border, overflowX:"auto", whiteSpace:"nowrap" }}><div style={{ display:"flex", gap:4 }}>
        {SECTIONS.filter(s=>s.id!=="code").map((s,i) => { const idx=i+1; const isActive=step===idx; const isDone=step>idx; return (
          <button key={s.id} onClick={() => idx<=step && setStep(idx)} style={{ padding:"6px 10px", borderRadius:20, border:"none", fontSize:11, fontFamily:font, cursor:idx<=step?"pointer":"default", fontWeight:isActive?700:500, background:isActive?T.accent:isDone?T.accent+"18":"transparent", color:isActive?"#fff":isDone?T.accentDim:T.textMuted, flexShrink:0 }}>{s.icon} {s.title}</button>
        ); })}
      </div></div>}
      <div style={{ maxWidth:640, margin:"0 auto", padding:"32px 20px 120px" }}>
        <div style={{ marginBottom:28 }}>
          {!["code","review"].includes(cur.id) && <div style={{ display:"inline-block", padding:"4px 12px", borderRadius:20, background:T.accent+"14", fontSize:12, fontWeight:600, color:T.accentDim, marginBottom:12, fontFamily:font }}>Sección {cur.id}</div>}
          <h2 style={{ fontSize:20, fontWeight:700, color:T.dark, margin:"0 0 4px" }}>{cur.icon} {cur.title}</h2>
        </div>
        <div style={{ background:T.card, borderRadius:14, padding:"28px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.04)", border:"1px solid "+T.border }}>
          {step===0 && <StepCode data={data} set={set} />}
          {step===1 && <StepA data={data} set={set} />}
          {step===2 && <StepB data={data} set={set} />}
          {step===3 && <StepB2 data={data} set={set} />}
          {step===4 && <StepC data={data} set={set} />}
          {step===5 && <StepD data={data} set={set} />}
          {step===6 && <StepE data={data} set={set} />}
          {step===7 && <StepF data={data} set={set} />}
          {step===8 && <StepG data={data} set={set} />}
          {step===9 && <StepH data={data} set={set} />}
          {step===10 && <StepReview data={data} />}
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:T.card, borderTop:"1px solid "+T.border, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <button onClick={() => step>0 && setStep(step-1)} disabled={step===0} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid "+T.border, background:"transparent", fontSize:14, fontFamily:font, fontWeight:600, color:step===0?T.textMuted:T.textPrimary, cursor:step===0?"default":"pointer", opacity:step===0?0.4:1 }}>← Anterior</button>
        <span style={{ fontSize:12, color:T.textMuted, fontFamily:font }}>{step+1} / {SECTIONS.length}</span>
        {step < SECTIONS.length-1 ? (
          <button onClick={handleNext} disabled={!canAdvance()} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:canAdvance()?T.accent:T.border, color:canAdvance()?"#fff":T.textMuted, fontSize:14, fontFamily:font, fontWeight:700, cursor:canAdvance()?"pointer":"default" }}>Siguiente →</button>
        ) : (
          <button onClick={handleSubmit} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:T.accent, color:"#fff", fontSize:14, fontFamily:font, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px "+T.accent+"40" }}>Enviar formulario ✓</button>
        )}
      </div>
    </div>
  );
}

// ═══ WRAPPER SEG ═══
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  return <Capa0Module />;
}
