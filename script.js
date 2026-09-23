/* ==========================================================================
   JEMX OPTIMIZE — data + rendering + interactions
   Organized in sections: DATA, RENDER, INTERACTIONS, INIT
   ========================================================================== */

/* ============================== DATA ==================================== */

const OPT_CATEGORIES = [
  {
    id: "windows", label: "Windows",
    type: "info",
    items: [
      { title: "Ajustes básicos de Windows", risk: "low", text: "Revisión general de configuración recomendada para gaming: notificaciones, efectos visuales y plan de energía." },
      { title: "Game Mode", risk: "low", text: "Prioriza recursos para el juego en primer plano y reduce interrupciones del sistema durante la partida." },
      { title: "HAGS (Hardware-Accelerated GPU Scheduling)", risk: "mid", text: "Deja que la GPU administre su propia cola de trabajo. El impacto varía según el juego y el driver." },
      { title: "Configuración de energía", risk: "low", text: "Plan 'Alto rendimiento' o 'Rendimiento máximo' evita que Windows reduzca frecuencias de CPU en reposo." },
      { title: "Aplicaciones en segundo plano", risk: "low", text: "Desactiva apps que se ejecutan sin necesidad y consumen CPU, RAM o ancho de banda." },
      { title: "Servicios innecesarios", risk: "mid", text: "Algunos servicios de Windows pueden pausarse seguros; otros son necesarios para el sistema. Investiga antes de desactivar." },
      { title: "Startup (inicio de sesión)", risk: "low", text: "Reduce programas que arrancan con Windows para liberar RAM y acelerar el arranque." },
      { title: "Limpieza de archivos temporales", risk: "low", text: "Libera espacio en disco eliminando cachés y temporales que no afectan al sistema." },
    ]
  },
  {
    id: "nvidia", label: "NVIDIA",
    type: "info",
    items: [
      { title: "NVIDIA Control Panel", risk: "low", text: "Ajustes de renderizado, filtrado de texturas y sincronización vertical por juego o global." },
      { title: "NVIDIA App", risk: "low", text: "Panel moderno con optimización automática y estadísticas de rendimiento en overlay." },
      { title: "Low Latency Mode", risk: "low", text: "Reduce la cola de fotogramas pre-renderizados para disminuir el input lag." },
      { title: "NVIDIA Reflex", risk: "low", text: "Sincroniza CPU y GPU en juegos compatibles para minimizar la latencia sistema-a-pantalla." },
      { title: "Shader Cache", risk: "low", text: "Tamaño y ubicación de la caché de shaders; afecta a los stutters de compilación." },
      { title: "Power Management Mode", risk: "low", text: "'Preferir máximo rendimiento' evita que la GPU baje de reloj entre fotogramas en juegos con CPU-bound." },
      { title: "Configuraciones específicas para gaming", risk: "mid", text: "Perfiles por juego para balancear calidad visual y FPS según el título." },
    ]
  },
  {
    id: "cmd", label: "CMD",
    type: "code",
    items: [
      { title: "Vaciar caché DNS", risk: "low", code: "ipconfig /flushdns", text: "Limpia entradas DNS obsoletas que pueden causar demoras al conectar a servidores." },
      { title: "Verificar archivos de sistema", risk: "low", code: "sfc /scannow", text: "Detecta y repara archivos de sistema corruptos que pueden causar inestabilidad." },
      { title: "Ver configuración TCP global", risk: "low", code: "netsh int tcp show global", text: "Muestra el estado actual de parámetros TCP como autotuning y escalado de ventana." },
      { title: "Renovar IP", risk: "low", code: "ipconfig /release && ipconfig /renew", text: "Fuerza una nueva asignación de IP; útil ante problemas de conexión intermitentes." },
      { title: "Ver procesos activos", risk: "low", code: "tasklist", text: "Lista los procesos en ejecución para identificar consumo innecesario de recursos." },
    ]
  },
  {
    id: "powershell", label: "PowerShell",
    type: "code",
    items: [
      { title: "Listar adaptadores de red", risk: "low", code: "Get-NetAdapter | Format-Table -AutoSize", text: "Muestra tus interfaces de red y su estado, útil antes de aplicar tweaks de red." },
      { title: "Desactivar QoS Packet Scheduler", risk: "mid", code: "Disable-NetAdapterQos -Name \"*\"", text: "Puede reducir la reserva de ancho de banda del sistema. Revisa si tu adaptador depende de QoS para otras funciones." },
      { title: "Ver configuración TCP por adaptador", risk: "low", code: "Get-NetTCPSetting | Format-Table", text: "Muestra parámetros TCP como el algoritmo de control de congestión activo." },
      { title: "Plan de energía por script", risk: "mid", code: "powercfg /setactive SCHEME_MIN", text: "Activa el plan de alto rendimiento vía PowerShell. Aumenta consumo/calor en portátiles." },
    ]
  },
  {
    id: "registry", label: "Registry",
    type: "registry",
    items: [
      {
        title: "MouseDataQueueSize", risk: "mid",
        modifies: "HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouclass\\Parameters",
        benefit: "Aumenta el buffer de eventos del mouse, útil en sensibilidades muy altas o polling rate alto.",
        riskText: "Un valor mal ajustado puede introducir micro-stutters en el movimiento del cursor.",
        steps: ["Crea un punto de restauración.", "Exporta la clave actual antes de modificar.", "Ajusta el valor DWORD según tu polling rate.", "Reinicia y prueba en el juego antes de dar por buena la configuración."]
      },
      {
        title: "KeyboardDataQueueSize", risk: "high",
        modifies: "HKLM\\SYSTEM\\CurrentControlSet\\Services\\kbdclass\\Parameters",
        benefit: "En teoría reduce la latencia de entrada del teclado en ráfagas de pulsaciones.",
        riskText: "Bajarlo agresivamente puede hacer que el teclado USB deje de responder por completo. Si esto ocurre, vuelve al valor predeterminado (100).",
        steps: ["Crea un punto de restauración antes de tocar esta clave.", "Anota el valor original (normalmente 100).", "Cambia en incrementos pequeños, no a valores extremos.", "Si el teclado deja de responder, reinicia en modo seguro y restaura el valor original."]
      },
      {
        title: "TcpAckFrequency", risk: "mid",
        modifies: "HKLM\\SYSTEM\\CurrentControlSet\\Interfaces\\{GUID}",
        benefit: "Reduce el retraso antes de enviar confirmaciones TCP, lo que puede bajar la latencia percibida en algunos juegos online.",
        riskText: "En redes con pérdida de paquetes puede aumentar el tráfico de ACKs y empeorar el rendimiento.",
        steps: ["Identifica el GUID de tu adaptador activo.", "Exporta la clave antes de modificar.", "Añade el DWORD TcpAckFrequency con valor 1.", "Reinicia el adaptador de red y monitorea la latencia con una herramienta de ping continuo."]
      },
      {
        title: "SystemResponsiveness", risk: "low",
        modifies: "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile",
        benefit: "Controla cuánta CPU se reserva para tareas multimedia frente al resto del sistema; en 0 prioriza juegos y multimedia.",
        riskText: "En equipos con tareas de fondo pesadas puede causar que otras apps se sientan menos fluidas.",
        steps: ["Crea un punto de restauración.", "Localiza la clave SystemProfile.", "Ajusta SystemResponsiveness a 0 o 10.", "Reinicia y observa el comportamiento general del sistema, no solo el juego."]
      },
    ]
  },
  {
    id: "software", label: "Software",
    type: "software",
    items: [
      { title: "Monitor de temperaturas", risk: "low", text: "Herramientas tipo HWiNFO o HWMonitor para vigilar CPU, GPU y VRM en tiempo real." },
      { title: "Análisis de FPS", risk: "low", text: "Overlays como RivaTuner Statistics Server o el de la NVIDIA App muestran FPS y frametime en vivo." },
      { title: "Análisis de latencia", risk: "low", text: "Utilidades como LatencyMon ayudan a detectar drivers que generan picos de latencia (DPC)." },
      { title: "Administración de procesos", risk: "low", text: "Herramientas como Process Lasso permiten asignar prioridad y afinidad de núcleos a procesos concretos." },
      { title: "Optimización de red", risk: "mid", text: "Utilidades tipo TCP Optimizer ajustan parámetros de red de forma guiada, con opción de restaurar." },
    ]
  },
];

const PAYMENT_METHODS = ["Nequi", "Daviplata", "PSE", "Bancolombia", "Tarjeta de crédito/débito", "PayPal"];

const PLANS = [
  {
    name: "FREE", price: "$0", desc: "Optimización básica",
    features: ["Ajustes básicos de Windows","Game Mode","Configuración básica de energía","Limpieza básica","Ajustes básicos de NVIDIA","Comandos básicos de CMD","Guías básicas de Regedit"],
    cta: "Empezar gratis",
    discord: ".jqemg"
  },
  {
    name: "PRO", price: "$5", desc: "Optimización avanzada", featured: true,
    features: ["Todo lo de FREE","Ajustes avanzados de NVIDIA","Optimización avanzada de Windows","Tweaks avanzados de Regedit","PowerShell","Configuración avanzada de CMD","Optimización de procesos","Ajustes para reducir input latency","Guías de diagnóstico de rendimiento"],
    cta: "Obtener PRO"
  },
  {
    name: "PREMIUM", price: "$10", desc: "Control avanzado",
    features: ["Todo lo de PRO","Optimización avanzada de BIOS","Regedit avanzado","PowerShell avanzado","CMD avanzado","Optimización de CPU y GPU","Overclocking/undervolting cuando el hardware lo permita","Ajustes avanzados de RAM","Diagnóstico de temperaturas y estabilidad"],
    cta: "Obtener PREMIUM",
    warning: "El overclocking, undervolting y los ajustes de BIOS no son seguros ni compatibles en todos los equipos. Investiga tu hardware específico antes de aplicarlos."
  },
];

const COMPARE_ROWS = [
  { label: "Windows básico", tip: "Ajustes generales de Windows para gaming.", free:1, pro:1, premium:1 },
  { label: "NVIDIA básico", tip: "Control Panel y ajustes estándar de GPU.", free:1, pro:1, premium:1 },
  { label: "CMD", tip: "Comandos básicos de diagnóstico y red.", free:1, pro:1, premium:1 },
  { label: "Regedit básico", tip: "Tweaks de registro de bajo riesgo.", free:1, pro:1, premium:1 },
  { label: "NVIDIA avanzado", tip: "Perfiles y ajustes finos por juego.", free:0, pro:1, premium:1 },
  { label: "PowerShell", tip: "Scripts de optimización y diagnóstico.", free:0, pro:1, premium:1 },
  { label: "Regedit avanzado", tip: "Tweaks de red y latencia de mayor impacto.", free:0, pro:1, premium:1 },
  { label: "Input latency", tip: "Ajustes específicos de mouse/teclado.", free:0, pro:1, premium:1 },
  { label: "BIOS", tip: "Configuración avanzada de BIOS/UEFI.", free:0, pro:0, premium:1 },
  { label: "CPU tuning", tip: "Undervolting y ajustes de frecuencia.", free:0, pro:0, premium:1 },
  { label: "GPU tuning", tip: "Overclocking/undervolting de GPU.", free:0, pro:0, premium:1 },
  { label: "Display OC", tip: "Overclocking de tasa de refresco del monitor.", free:0, pro:0, premium:1 },
];

const SAFETY_ITEMS = [
  "Crea un punto de restauración del sistema antes de empezar.",
  "Haz una copia de seguridad del registro antes de modificarlo.",
  "No apliques tweaks sin entender qué hacen.",
  "Una configuración de BIOS incorrecta puede impedir que el equipo arranque.",
  "El overclocking puede aumentar la temperatura y el consumo eléctrico.",
  "No todos los procesadores, GPUs o portátiles permiten overclocking.",
  "Algunas optimizaciones pueden reducir la estabilidad en ciertos sistemas.",
];

const FAQ_ITEMS = [
  { q: "¿Estas optimizaciones aumentan los FPS?", a: "Algunas pueden ayudar, especialmente si tu sistema tenía procesos o servicios consumiendo recursos innecesarios. La ganancia depende del hardware, el juego y la configuración previa — no hay un número garantizado." },
  { q: "¿Reducen el input delay?", a: "Ajustes como Low Latency Mode, Reflex o ciertos tweaks de red apuntan directamente a esto y suelen notarse más que los de FPS puro, pero el resultado varía según el equipo." },
  { q: "¿Funcionan en laptops?", a: "La mayoría de ajustes de Windows y NVIDIA sí. El overclocking y algunos ajustes de BIOS suelen estar limitados o no disponibles en portátiles." },
  { q: "¿Necesito Windows 11?", a: "No. La mayoría de optimizaciones aplican tanto a Windows 10 como a Windows 11, con algunas diferencias menores en menús y nombres de opciones." },
  { q: "¿Puedo revertir los cambios?", a: "Los ajustes de interfaz sí, fácilmente. Los cambios de registro y BIOS requieren guardar el valor original o un backup antes de modificar, por eso lo recomendamos siempre." },
  { q: "¿El overclocking es seguro?", a: "No es inherentemente seguro para todos los componentes. Depende del hardware, la refrigeración y los márgenes del fabricante. Debe hacerse de forma gradual y con monitoreo de temperaturas." },
  { q: "¿Necesito una GPU NVIDIA?", a: "No para los ajustes de Windows y red. Las secciones específicas de NVIDIA Control Panel, Reflex y NVIDIA App sí requieren una GPU NVIDIA." },
  { q: "¿Las optimizaciones garantizan más FPS?", a: "No. Ninguna optimización de software sustituye a un upgrade de hardware cuando el cuello de botella es el hardware. Lo que ofrecemos son ajustes explicados, no promesas." },
];

const DASH_METRICS = [
  { label: "CPU", value: "42%", pct: 42 },
  { label: "GPU", value: "67%", pct: 67 },
  { label: "RAM", value: "58%", pct: 58 },
  { label: "FPS", value: "164", pct: 82 },
  { label: "Latency", value: "8 ms", pct: 15 },
  { label: "Temp GPU", value: "63°C", pct: 63 },
];

const HUD_ROWS = [
  { label: "FPS", value: "164", pct: 82 },
  { label: "Frame time", value: "6.1 ms", pct: 30 },
  { label: "Latencia", value: "8 ms", pct: 18 },
  { label: "Temp. GPU", value: "63°C", pct: 63 },
];

const CHECKLISTS = {
  fps: {
    label: "FPS", items: [
      "Game Mode activado", "Modo de energía en alto rendimiento", "Drivers de GPU actualizados",
      "Aplicaciones en segundo plano cerradas", "Shader cache configurada", "Resolución y escalado revisados",
    ]
  },
  latencia: {
    label: "Latencia", items: [
      "NVIDIA Low Latency Mode activo", "Reflex activado (si el juego lo soporta)", "QoS Packet Scheduler revisado",
      "Polling rate del mouse configurado", "SystemResponsiveness ajustado", "Buffer de teclado en valor estable",
    ]
  },
  gpu: {
    label: "GPU", items: [
      "Power Management en 'Máximo rendimiento'", "Vsync configurado según tu monitor", "Filtrado de texturas ajustado",
      "Perfil por juego creado", "Temperatura monitoreada bajo carga", "Curva de ventiladores revisada",
    ]
  }
};

const HW_RULES = {
  gpu: {
    "nvidia-high": "Con tu GPU puedes usar resoluciones y filtros altos sin sacrificar mucho FPS; prioriza Reflex y Low Latency Mode para competitivo.",
    "nvidia-mid": "Es un buen punto para balancear calidad visual y FPS; revisa el power management y evita cuellos de botella de CPU en fondo.",
    "nvidia-low": "Prioriza ajustes de rendimiento sobre calidad visual y vigila la temperatura si es un equipo compacto o portátil.",
    "amd": "Las secciones de NVIDIA Control Panel/Reflex no aplican; enfócate en Windows, red y el software de tu propia GPU (AMD Software).",
    "other": "Sin saber la GPU exacta, empieza por los ajustes generales de Windows y energía, que aplican a cualquier hardware.",
  },
  windows: {
    "11": "HAGS y Game Mode están integrados de forma nativa; revisa también el nuevo panel de rendimiento en Configuración.",
    "10": "Algunos menús cambian de ubicación respecto a Windows 11, pero los mismos ajustes de Game Mode y energía existen.",
    "other": "Verifica primero la compatibilidad de los ajustes con tu versión antes de aplicarlos.",
  }
};

/* ============================== RENDER =================================== */

function iconFor(risk){
  return risk === "high" ? "Alto riesgo" : risk === "mid" ? "Riesgo medio" : "Bajo riesgo";
}
function badgeClass(risk){
  return risk === "high" ? "badge--high" : risk === "mid" ? "badge--mid" : "badge--low";
}

function renderTabs(){
  const tabsEl = document.getElementById("optTabs");
  const panelsEl = document.getElementById("optPanels");

  OPT_CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (i === 0 ? " is-active" : "");
    btn.textContent = cat.label;
    btn.dataset.tab = cat.id;
    btn.setAttribute("role", "tab");
    btn.addEventListener("click", () => activateTab(cat.id));
    tabsEl.appendChild(btn);

    const panel = document.createElement("div");
    panel.className = "tab-panel" + (i === 0 ? " is-active" : "");
    panel.id = "panel-" + cat.id;
    panel.appendChild(renderCardGrid(cat));
    panelsEl.appendChild(panel);
  });
}

function activateTab(id){
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("is-active", b.dataset.tab === id));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("is-active", p.id === "panel-" + id));
}

function renderCardGrid(cat){
  const grid = document.createElement("div");
  grid.className = "card-grid";

  cat.items.forEach(item => {
    let card;
    if (cat.type === "code") card = renderCodeCard(item);
    else if (cat.type === "registry") card = renderRegistryCard(item);
    else card = renderInfoCard(item);
    grid.appendChild(card);
  });
  return grid;
}

function renderInfoCard(item){
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card__top">
      <h4>${item.title}</h4>
      <span class="badge ${badgeClass(item.risk)}">${iconFor(item.risk)}</span>
    </div>
    <p>${item.text}</p>`;
  return card;
}

function renderCodeCard(item){
  const card = document.createElement("div");
  card.className = "card code-card";
  card.innerHTML = `
    <div class="code-card__head">
      <div class="card__top">
        <h4>${item.title}</h4>
        <span class="badge ${badgeClass(item.risk)}">${iconFor(item.risk)}</span>
      </div>
      <p>${item.text}</p>
    </div>
    <div class="code-card__body">
      <pre><code>${item.code}</code></pre>
      <button class="copy-btn" data-code="${encodeURIComponent(item.code)}">Copiar</button>
    </div>`;
  return card;
}

function renderRegistryCard(item){
  const card = document.createElement("div");
  card.className = "card reg-card";
  card.innerHTML = `
    <div class="card__top">
      <h4>${item.title}</h4>
      <span class="badge ${badgeClass(item.risk)}">${iconFor(item.risk)}</span>
    </div>
    <dl>
      <div><dt>Modifica</dt><dd>${item.modifies}</dd></div>
      <div><dt>Beneficio</dt><dd>${item.benefit}</dd></div>
    </dl>
    <button class="btn btn--outline btn--sm btn--full js-reg-detail">Ver instrucciones</button>`;
  card.querySelector(".js-reg-detail").addEventListener("click", () => openRegistryModal(item));
  return card;
}

function openRegistryModal(item){
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <h3>${item.title}</h3>
    <dl>
      <div><dt>Modifica</dt><dd>${item.modifies}</dd></div>
      <div><dt>Beneficio</dt><dd>${item.benefit}</dd></div>
      <div><dt>Riesgo</dt><dd>${item.riskText}</dd></div>
    </dl>
    <ol class="modal__steps">${item.steps.map(s => `<li>${s}</li>`).join("")}</ol>`;
  openModal();
}

function renderPricing(){
  const grid = document.getElementById("pricingGrid");
  PLANS.forEach(plan => {
    const el = document.createElement("div");
    el.className = "plan" + (plan.featured ? " plan--featured" : "");
    el.innerHTML = `
      ${plan.featured ? '<span class="plan__tag">Más elegido</span>' : ""}
      <div class="plan__name">${plan.name}</div>
      <div class="plan__price">${plan.price}</div>
      <div class="plan__desc">${plan.desc}</div>
      ${plan.warning ? `<div class="plan__warning">${plan.warning}</div>` : ""}
      <ul class="plan__features">${plan.features.map(f => `<li>${f}</li>`).join("")}</ul>
      ${plan.discord ? `<div class="plan__discord">Agrégame en Discord: <strong>${plan.discord}</strong> para que te dé acceso.</div>` : ""}
      <button class="btn ${plan.featured ? "btn--primary" : "btn--ghost"} btn--full">${plan.cta}</button>`;
    grid.appendChild(el);
  });
}

function renderPaymentMethods(){
  const wrap = document.getElementById("paymentMethods");
  if (!wrap) return;
  wrap.innerHTML = `<span class="payment-methods__label">Métodos de pago aceptados</span>` +
    PAYMENT_METHODS.map(m => `<span class="payment-badge">${m}</span>`).join("");
}

function renderCompareTable(){
  const table = document.getElementById("compareTable");
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr><th>Función</th><th>FREE</th><th>PRO</th><th>PREMIUM</th></tr>`;
  const tbody = document.createElement("tbody");
  COMPARE_ROWS.forEach(row => {
    const tr = document.createElement("tr");
    const mark = v => v ? '<span class="tick">✓</span>' : '<span class="cross">—</span>';
    tr.innerHTML = `<td title="${row.tip}">${row.label}</td><td>${mark(row.free)}</td><td>${mark(row.pro)}</td><td>${mark(row.premium)}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
}

function renderSafety(){
  const list = document.getElementById("safetyList");
  SAFETY_ITEMS.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

function renderFaq(){
  const wrap = document.getElementById("faqList");
  FAQ_ITEMS.forEach(item => {
    const el = document.createElement("div");
    el.className = "faq-item";
    el.innerHTML = `
      <button class="faq-q">${item.q}<span class="faq-q__icon">+</span></button>
      <div class="faq-a"><p>${item.a}</p></div>`;
    const btn = el.querySelector(".faq-q");
    const answer = el.querySelector(".faq-a");
    btn.addEventListener("click", () => {
      const isOpen = el.classList.toggle("is-open");
      answer.style.maxHeight = isOpen ? answer.scrollHeight + "px" : "0px";
    });
    wrap.appendChild(el);
  });
}

function renderDashboard(){
  const grid = document.getElementById("dashGrid");
  DASH_METRICS.forEach(m => {
    const el = document.createElement("div");
    el.className = "dash__card";
    el.innerHTML = `
      <div class="dash__label"><span>${m.label}</span><span>demo</span></div>
      <div class="dash__value">${m.value}</div>
      <div class="dash__bar"><div class="dash__bar-fill" data-pct="${m.pct}"></div></div>`;
    grid.appendChild(el);
  });
}

function renderHud(){
  const wrap = document.getElementById("hudRows");
  HUD_ROWS.forEach(row => {
    const el = document.createElement("div");
    el.className = "hud__row";
    el.innerHTML = `
      <div class="hud__row-top"><span>${row.label}</span><span>${row.value}</span></div>
      <div class="hud__bar"><div class="hud__bar-fill" data-pct="${row.pct}"></div></div>`;
    wrap.appendChild(el);
  });
}

/* ---- Checklists ---- */
let activeChecklist = "fps";

function renderChecklistTabs(){
  const wrap = document.getElementById("checklistTabs");
  Object.entries(CHECKLISTS).forEach(([key, data]) => {
    const btn = document.createElement("button");
    btn.textContent = data.label;
    btn.className = key === activeChecklist ? "is-active" : "";
    btn.addEventListener("click", () => {
      activeChecklist = key;
      document.querySelectorAll("#checklistTabs button").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderChecklistBody();
    });
    wrap.appendChild(btn);
  });
}

function renderChecklistBody(){
  const body = document.getElementById("checklistBody");
  body.innerHTML = "";
  CHECKLISTS[activeChecklist].items.forEach((text, i) => {
    const row = document.createElement("label");
    row.className = "check-item";
    row.innerHTML = `<input type="checkbox" data-checklist="${activeChecklist}" data-idx="${i}"> <span>${text}</span>`;
    body.appendChild(row);
  });
  body.querySelectorAll("input[type=checkbox]").forEach(cb => cb.addEventListener("change", updateScore));
  updateScore();
}

function updateScore(){
  const boxes = document.querySelectorAll("#checklistBody input[type=checkbox]");
  const total = boxes.length;
  const checked = Array.from(boxes).filter(b => b.checked).length;
  const pct = total ? Math.round((checked / total) * 100) : 0;
  const scoreEl = document.getElementById("checklistScore");
  scoreEl.innerHTML = `
    <div class="score__bar"><div class="score__fill" style="width:${pct}%"></div></div>
    <div class="score__label">${checked}/${total} · ${pct}%</div>`;
}

/* ---- Hardware form ---- */
function handleHwSubmit(e){
  e.preventDefault();
  const form = e.target;
  const gpu = form.gpu.value;
  const windows = form.windows.value;
  const hz = form.hz.value;
  const genre = form.genre.value;

  const recs = [];
  recs.push(HW_RULES.gpu[gpu]);
  recs.push(HW_RULES.windows[windows]);

  if (Number(hz) >= 144) recs.push("Con un monitor de alta tasa de refresco, revisa que el juego no esté limitado por Vsync o un límite de FPS manual por debajo de tu Hz.");
  else recs.push("En 60 Hz priorizar más FPS de los que tu monitor muestra no aporta suavidad visual; puedes usar ese margen para subir calidad gráfica en su lugar.");

  if (genre === "competitive") recs.push("Para juegos competitivos, Low Latency Mode, Reflex (si aplica) y un plan de energía de alto rendimiento suelen notarse más que los ajustes visuales.");
  else if (genre === "open-world") recs.push("En mundo abierto, vigila temperaturas y memoria RAM/VRAM — estos títulos suelen ser más exigentes en el tiempo, no solo en picos.");
  else recs.push("En juegos casuales o indie el hardware rara vez es el cuello de botella; los ajustes básicos de Windows suelen ser suficientes.");

  const result = document.getElementById("hwResult");
  result.hidden = false;
  result.innerHTML = `<h4>Recomendaciones generales</h4><ul>${recs.map(r => `<li>${r}</li>`).join("")}</ul>
    <p style="margin-top:10px;font-size:12px;color:var(--text-faint)">Orientativo, no sustituye pruebas en tu propio sistema.</p>`;
}

/* ---- Copy to clipboard ---- */
function handleCopyClick(e){
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  const code = decodeURIComponent(btn.dataset.code);
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = "Copiado";
    btn.classList.add("is-copied");
    showToast("Comando copiado al portapapeles");
    setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("is-copied"); }, 1800);
  }).catch(() => showToast("No se pudo copiar automáticamente"));
}

/* ---- Modal ---- */
function openModal(){
  document.getElementById("modal").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal(){
  document.getElementById("modal").hidden = true;
  document.body.style.overflow = "";
}

/* ---- Toast ---- */
let toastTimer;
function showToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

/* ---- Animate bars on scroll into view ---- */
function initBarObserver(){
  const bars = document.querySelectorAll(".dash__bar-fill, .hud__bar-fill");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const el = entry.target;
        el.style.width = el.dataset.pct + "%";
        io.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => io.observe(b));
}

/* ---- Navbar mobile toggle ---- */
function initNav(){
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("is-open");
    toggle.classList.remove("is-open");
  }));
}

/* ============================== INIT ==================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderHud();
  renderTabs();
  renderPricing();
  renderPaymentMethods();
  renderCompareTable();
  renderSafety();
  renderFaq();
  renderDashboard();
  renderChecklistTabs();
  renderChecklistBody();

  initNav();
  initBarObserver();

  document.getElementById("hwForm").addEventListener("submit", handleHwSubmit);
  document.getElementById("optPanels").addEventListener("click", handleCopyClick);
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
});
