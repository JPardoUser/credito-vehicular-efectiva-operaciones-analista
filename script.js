const defaultCases=[
{solicitud:'EFE001',cliente:'Pérez Salazar Juan Carlos',documento:'12345678',concesionario:'TOYOTA',tienda:'PURUCHUCO',usuario:'jgonzalesf',carretera:'Full',fecha:'2026-05-20T15:30:00',estado:'Pendiente',sla:'02h 20m',estadoCivil:'Casado',analistaOperaciones:null,fechaToma:null,historialOperaciones:[]},
{solicitud:'EFE002',cliente:'Melgar Salazar José Carlos',documento:'12345678',concesionario:'HYUNDAI',tienda:'SAN MIGUEL',usuario:'tramirezp',carretera:'Full',fecha:'2026-05-20T15:30:00',estado:'Pendiente',sla:'01h 10m',estadoCivil:'Soltero',subsanado:true,analistaOperaciones:null,fechaToma:null,historialOperaciones:[{rol:'Ejecutivo Financiero',usuario:'TRAMIREZP',fecha:'17/06/2026 11:35',comentario:'Se subsanaron los documentos observados y se reenvía a Operaciones para validación.'}]},
{solicitud:'EFE003',cliente:'Pérez García Pedro Juan',documento:'12345678',concesionario:'TOYOTA',tienda:'LA MOLINA',usuario:'jgonzalesf',carretera:'Semi Full',fecha:'2026-05-20T15:30:00',estado:'Activado',sla:'00h 35m',estadoCivil:'Soltero',analistaOperaciones:'AUGCHA',fechaToma:'16/06/2026 10:20',historialOperaciones:[{rol:'Analista de Operaciones',usuario:'AUGCHA',fecha:'16/06/2026 10:42',comentario:'Solicitud aprobada y activada en Bantotal.'}]},
{solicitud:'POP001',cliente:'Pérez Salazar Felipe Carlos',documento:'12345678',concesionario:'HYUNDAI',tienda:'PURUCHUCO',usuario:'jpardol',carretera:'Express',fecha:'2026-05-20T15:30:00',estado:'Observado',sla:'06h 05m',estadoCivil:'Divorciado',analistaOperaciones:'AUGCHA',fechaToma:'16/06/2026 14:10',motivoObservacion:'OM001 – Documentación contractual incompleta.',comentarioObservacion:'Falta adjuntar copia legible de los documentos firmados para formalización.',fechaObservacion:'16/06/2026 14:58',analistaObservacion:'AUGCHA',historialOperaciones:[{rol:'Analista de Operaciones',usuario:'AUGCHA',fecha:'16/06/2026 14:58',comentario:'Solicitud observada por documentación contractual incompleta.'}]},
{solicitud:'POP002',cliente:'Toledo Salazar Rafael Carlos',documento:'12345678',concesionario:'TOYOTA',tienda:'SAN MIGUEL',usuario:'jpardol',carretera:'Full',fecha:'2026-05-20T15:30:00',estado:'Pendiente',sla:'08h 40m',estadoCivil:'Soltero',subsanado:true,analistaOperaciones:null,fechaToma:null,historialOperaciones:[{rol:'Ejecutivo Financiero',usuario:'JPARDOL',fecha:'17/06/2026 16:25',comentario:'Caso subsanado por el ejecutivo y reenviado a la bandeja general de Operaciones.'}]}
];

const OPERACIONES_STORAGE_KEY = 'efe_operaciones_cases';
let cases = JSON.parse(localStorage.getItem(OPERACIONES_STORAGE_KEY) || 'null') || defaultCases.map(item => ({ ...item }));
function saveCases(){
  localStorage.setItem(OPERACIONES_STORAGE_KEY, JSON.stringify(cases));
}
function mergeDefaultCases(){
  let changed = false;
  defaultCases.forEach(def => {
    if (!cases.some(item => item.solicitud === def.solicitud)) {
      cases.push({ ...def });
      changed = true;
    }
  });
  if (changed) saveCases();
}
mergeDefaultCases();
const $=id=>document.getElementById(id);const gridBody=$('gridBody'),summary=$('summary'),resultCount=$('resultCount'),totalCases=$('totalCases');
const bandejaView=$('bandejaView'),detailView=$('detailView'),opsTabContent=$('opsTabContent'),checklistBody=$('checklistBody'),trackingList=$('trackingList');
const modal=$('modal'),modalTitle=$('modalTitle'),modalContent=$('modalContent');let currentCase=null;let checklistStatuses=[];
let mostrarConfirmacionRegresoCasoTomado = false;
const usuarioOperacionesSesion = 'AUGCHA';

// --- Lógica del Splash Screen ---
(function() {
  const splash = $('splashScreen');
  const p1 = $('splashPhase1');
  const p2 = $('splashPhase2');
  
  if (p1 && p2) {
    // Fase 1 a Fase 2 a los 1000ms
    setTimeout(() => {
      p1.style.opacity = '0';
      setTimeout(() => {
        p1.style.display = 'none';
        p2.style.display = 'flex';
        p2.offsetHeight; // force reflow
        p2.style.opacity = '1';
      }, 300);
    }, 1000);
  }
  
  // Ocultar splash screen a los 2000ms y mostrar login
  setTimeout(() => {
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.remove();
        const loginView = $('loginView');
        if (loginView) loginView.classList.remove('hidden');
      }, 500);
    }
  }, 2000);
})();

// --- Lógica de Login ---
let loginAttempts = 0;
const MAX_ATTEMPTS = 3;

function showLoginAlert(message, title = "Error") {
  const modalAlert = $('loginAlertModal');
  const msgEl = $('loginAlertMessage');
  const titleEl = $('loginAlertTitle');
  const iconEl = $('loginAlertIcon');
  if (modalAlert && msgEl && titleEl) {
    titleEl.textContent = title;
    msgEl.textContent = message;
    if (iconEl) {
      if (title === "Error" || title === "Bloqueado") {
        iconEl.style.background = "#fee2e2";
        iconEl.style.color = "#ef4444";
        iconEl.textContent = "⚠";
      } else {
        iconEl.style.background = "#e0f2fe";
        iconEl.style.color = "#0284c7";
        iconEl.textContent = "ℹ";
      }
    }
    modalAlert.classList.remove('hidden');
  } else {
    alert(message);
  }
}

function closeLoginAlert() {
  const modalAlert = $('loginAlertModal');
  if (modalAlert) modalAlert.classList.add('hidden');
}

function handleLogin() {
  const userEl = $('loginUser');
  const passEl = $('loginPass');
  if (!userEl || !passEl) return;

  const username = userEl.value.trim();
  const password = passEl.value;

  if (loginAttempts >= MAX_ATTEMPTS + 1) {
    showLoginAlert("El usuario ha sido bloqueado, comunicarse con soporte", "Bloqueado");
    return;
  }

  if (username.toUpperCase() === 'AUGCHA' && password === '123456') {
    // Éxito
    const loginView = $('loginView');
    if (loginView) loginView.classList.add('hidden');
    
    // Actualizar saludo del usuario
    const greetingEl = document.querySelector('.hello');
    if (greetingEl) {
      greetingEl.textContent = `Hola ${username.toUpperCase()}!`;
    }
    
    // Mostrar la aplicación principal
    document.querySelectorAll('.topbar, .layout').forEach(el => {
      el.classList.remove('hidden');
    });
  } else {
    loginAttempts++;
    if (loginAttempts >= 4) {
      showLoginAlert("El usuario ha sido bloqueado, comunicarse con soporte", "Bloqueado");
    } else {
      showLoginAlert("Usuario o contraseña mal ingresados o no existen", "Error");
    }
  }
}

function clearLogin() {
  const userEl = $('loginUser');
  const passEl = $('loginPass');
  if (userEl) userEl.value = '';
  if (passEl) passEl.value = '';
}

// Event Listeners para Login
$('btnLoginSubmit')?.addEventListener('click', handleLogin);
$('btnLoginClear')?.addEventListener('click', clearLogin);
$('closeLoginAlertModal')?.addEventListener('click', closeLoginAlert);
$('loginAlertModal')?.addEventListener('click', e => { if (e.target.id === 'loginAlertModal') closeLoginAlert(); });
$('forgotPasswordBtn')?.addEventListener('click', e => {
  e.preventDefault();
  showLoginAlert("Por favor, comuníquese con soporte para restablecer su contraseña.", "Información");
});
$('loginUser')?.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
$('loginPass')?.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });

function normalize(t){return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}
function formatDate(iso){return new Date(iso).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','')}
function slaMinutes(s){const m=s.match(/(\d+)h\s*(\d+)?m?/i);return m?(+m[1]*60)+ +(m[2]||0):0}function expired(s){return slaMinutes(s)>240}
function slaClass(item){if(item.estado==='Rechazado')return 'locked';return expired(item.sla)?'danger':'ok'}function slaLabel(item){if(item.estado==='Rechazado')return item.sla;return expired(item.sla)?'Caducado':item.sla}
function unique(f){return [...new Set(cases.map(x=>x[f]).filter(v=>v!==null&&v!==undefined&&String(v).trim()!==''))].sort()}
function fillSelect(id,f){const el=$(id); if(!el) return; unique(f).forEach(v=>el.insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`))}
function fillEstado(){const el=$('filterEstado'); if(!el) return; ['Pendiente','Activado','Observado'].forEach(v=>el.insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`)); el.value='Pendiente'}
function estadoOperaciones(item){return item.estado === 'Subsanado' ? 'Pendiente' : item.estado}
function getAnalistaLabel(item){return item.analistaOperaciones || 'Sin asignar'}
function puedeTomarCaso(item){return estadoOperaciones(item) === 'Pendiente' && !item.analistaOperaciones}
function render(data=cases){gridBody.innerHTML=data.map(item=>{const estado=estadoOperaciones(item);const canTake=puedeTomarCaso(item);const actionLabel=canTake?'Tomar caso':'Revisar';const analista=getAnalistaLabel(item);return `<tr><td>${item.solicitud}</td><td>${item.cliente}</td><td>${item.documento}</td><td>${item.concesionario}</td><td><strong>${item.usuario}</strong></td><td><span class="analyst-pill ${item.analistaOperaciones?'assigned':'unassigned'}">${analista}</span></td><td>${formatDate(item.fecha)}</td><td><span class="status ${normalize(estado)}">${estado}</span></td><td><button class="open-btn" type="button" data-id="${item.solicitud}" data-action="${canTake?'tomar':'ver'}">${actionLabel}</button></td></tr>`}).join('');
resultCount.textContent=`${data.length} resultado${data.length===1?'':'s'}`;totalCases.textContent=data.length;summary.innerHTML=['Pendiente','Activado','Observado'].map(s=>`<span><i class="dot ${normalize(s)}"></i>${s} <strong>${data.filter(x=>estadoOperaciones(x)===s).length}</strong></span>`).join('');document.querySelectorAll('.open-btn').forEach(b=>b.addEventListener('click',()=>handleCaseAction(b.dataset.id,b.dataset.action)))}
function getFilters(){return{solicitud:$('filterSolicitud').value.trim().toUpperCase(),documento:$('filterDocumento').value.trim(),concesionario:$('filterConcesionario').value,usuario:$('filterUsuario').value.trim().toLowerCase(),analista:$('filterAnalista').value,estado:$('filterEstado').value||'Pendiente',desde:$('filterFechaDesde').value,hasta:$('filterFechaHasta').value}}
function applyFilters(){const f=getFilters();render(cases.filter(i=>{const d=i.fecha.slice(0,10);const estado=estadoOperaciones(i);const analista=getAnalistaLabel(i);return(!f.solicitud||i.solicitud.includes(f.solicitud))&&(!f.documento||i.documento.includes(f.documento))&&(!f.concesionario||i.concesionario===f.concesionario)&&(!f.usuario||i.usuario.toLowerCase().includes(f.usuario))&&(!f.analista||analista===f.analista)&&(!f.estado||estado===f.estado)&&(!f.desde||d>=f.desde)&&(!f.hasta||d<=f.hasta)}))}
function clearFilters(){['filterSolicitud','filterDocumento','filterConcesionario','filterUsuario','filterAnalista','filterFechaDesde','filterFechaHasta'].forEach(id=>{const el=$(id);if(el)el.value=''});if($('filterEstado'))$('filterEstado').value='Pendiente';applyFilters()}
function regresarABandeja(){
  saveCases();
  fillAnalistaFilter();
  applyFilters();
  detailView.classList.add('hidden');
  bandejaView.classList.remove('hidden');
}
function intentarRegresarABandeja(){
  if (mostrarConfirmacionRegresoCasoTomado && currentCase && currentCase.analistaOperaciones === usuarioOperacionesSesion) {
    showModal(
      'Confirmar regreso',
      `¿Esta seguro de regresar? El caso ya fué designado a ${usuarioOperacionesSesion}`,
      'confirm',
      true,
      () => {
        mostrarConfirmacionRegresoCasoTomado = false;
        regresarABandeja();
      }
    );
    return;
  }
  regresarABandeja();
}
function handleCaseAction(id,action){
  const selected=cases.find(x=>x.solicitud===id);
  if(!selected)return;
  if(action==='tomar'){
    showModal('Tomar caso', `¿Está seguro de tomar la solicitud ${selected.solicitud}? El caso quedará asignado a ${usuarioOperacionesSesion}.`, 'confirm', true, () => {
      selected.analistaOperaciones = usuarioOperacionesSesion;
      selected.fechaToma = getFormattedNow();
      selected.historialOperaciones = selected.historialOperaciones || [];
      selected.historialOperaciones.push({rol:'Analista de Operaciones',usuario:usuarioOperacionesSesion,fecha:selected.fechaToma,comentario:'Caso tomado desde la bandeja general de Operaciones.'});
      saveCases();
      fillAnalistaFilter();
      mostrarConfirmacionRegresoCasoTomado = true;
      openDetail(id);
    });
  } else {
    mostrarConfirmacionRegresoCasoTomado = false;
    openDetail(id);
  }
}
function renderDatosGarantia() {
  let vehMarca = 'Toyota';
  let vehModelo = 'Corolla Cross';
  let vehAnio = '2026';
  let vehColor = 'Plata Metálico';
  let vehValorUsd = '42133.00';
  let vehValorPen = 'S/ 158,000.00';
  let vehMotor = '2ZR-458796321';
  let vehVin = 'BAIDAA3G512345678';
  
  if (currentCase) {
    if (currentCase.solicitud === 'EFE001') {
      vehMarca = 'Chevrolet';
      vehModelo = 'Tracker';
      vehAnio = '2024';
      vehColor = 'Rojo';
      vehValorUsd = '18000.00';
      vehValorPen = 'S/ 67,500.00';
      vehMotor = '2GD-FTV-987654';
      vehVin = 'BAIDAA3G512345678';
    } else if (currentCase.concesionario === 'HYUNDAI') {
      vehMarca = 'Hyundai';
      vehModelo = 'Tucson';
      vehAnio = '2026';
      vehColor = 'Gris Oscuro';
      vehValorUsd = '36800.00';
      vehValorPen = 'S/ 138,000.00';
      vehMotor = 'G4FD-887462';
      vehVin = 'KMHHD81D9HU123456';
    } else if (currentCase.concesionario === 'TOYOTA') {
      vehMarca = 'Toyota';
      vehModelo = 'Corolla Cross';
      vehAnio = '2026';
      vehColor = 'Plata Metálico';
      vehValorUsd = '42133.00';
      vehValorPen = 'S/ 158,000.00';
      vehMotor = '2ZR-458796321';
      vehVin = 'BAIDAA3G512345678';
    }
  }

  const container = $('opsDatosGarantiaContent');
  if (container) {
    container.innerHTML = `
      <div class="ops-readonly-field">
        <label>Estado del vehículo</label>
        <input type="text" readonly value="Nuevo" />
      </div>
      <div class="ops-readonly-field">
        <label>Marca</label>
        <input type="text" readonly value="${vehMarca}" />
      </div>
      <div class="ops-readonly-field">
        <label>Modelo</label>
        <input type="text" readonly value="${vehModelo}" />
      </div>
      <div class="ops-readonly-field">
        <label>Año modelo</label>
        <input type="text" readonly value="${vehAnio}" />
      </div>
      <div class="ops-readonly-field">
        <label>Tipo de vehículo</label>
        <input type="text" readonly value="Camioneta SUV" />
      </div>
      <div class="ops-readonly-field">
        <label>Color</label>
        <input type="text" readonly value="${vehColor}" />
      </div>
      <div class="ops-readonly-field">
        <label>VIN</label>
        <input type="text" readonly value="${vehVin}" />
      </div>
      <div class="ops-readonly-field">
        <label>N° de motor</label>
        <input type="text" readonly value="${vehMotor}" />
      </div>
      <div class="ops-readonly-field">
        <label>Tarjeta de propiedad a nombre de</label>
        <input type="text" readonly value="TITULAR" />
      </div>
      <div class="ops-readonly-field">
        <label>Compra para tercero</label>
        <input type="text" readonly value="No aplica" />
      </div>
    `;
  }
}

function getFormattedNow() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function renderObservationBox() {
  const container = $('opsObservationDisplayContainer');
  if (!container) return;

  const btnAprobar = $('btnAprobarActivarBantotal');
  const btnObservar = $('btnObservarOperaciones');

  if (currentCase && currentCase.estado === 'Observado') {
    // Hide buttons
    if (btnAprobar) btnAprobar.classList.add('hidden');
    if (btnObservar) btnObservar.classList.add('hidden');

    // Setup details
    const motivo = currentCase.motivoObservacion || 'OM001 – Documentación contractual incompleta.';
    const detalle = currentCase.comentarioObservacion || 'Falta adjuntar copia legible de los sustentos de ingresos del solicitante y cónyuge.';
    const fecha = currentCase.fechaObservacion || '16/06/2026 14:58';
    const analista = currentCase.analistaObservacion || usuarioOperacionesSesion;

    container.innerHTML = `
      <div class="observation-alert-box" style="background-color: #fffaf0; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 16px; font-family: inherit; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.02); margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; color: #475569; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="font-weight: 800; color: #0f172a;">Analista de Operaciones - ${analista}</span>
            <span style="color: #64748b; margin-left: 8px;">${fecha}</span>
          </div>
          <span style="background-color: #ffedd5; color: #ea580c; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; border: 1px solid #fed7aa;">OBSERVACIÓN OPERACIONES</span>
        </div>
        <div style="font-size: 14px; color: #334155; line-height: 1.5;">
          <p style="margin: 0 0 6px 0;"><strong>Motivo:</strong> ${motivo}</p>
          <p style="margin: 0;"><strong>Detalle:</strong> ${detalle}</p>
        </div>
      </div>
    `;
  } else {
    // Show buttons if not approved/activated
    const isApprovedOrActive = currentCase && currentCase.estado === 'Activado';
    if (btnAprobar) {
      if (isApprovedOrActive) {
        btnAprobar.classList.add('hidden');
      } else {
        btnAprobar.classList.remove('hidden');
        btnAprobar.disabled = false;
      }
    }
    if (btnObservar) {
      if (isApprovedOrActive) {
        btnObservar.classList.add('hidden');
      } else {
        btnObservar.classList.remove('hidden');
        btnObservar.disabled = false;
      }
    }

    container.innerHTML = `
      <p style="color: #64748b; font-size: 0.95rem; margin-top: 10px; font-style: italic;">Sin observaciones registradas por operaciones.</p>
    `;
  }
}

function buildOpsTabSection(tab) {
  const numDoc = currentCase ? currentCase.documento : '12345678';
  const nameCli = currentCase ? currentCase.cliente : 'Pérez Salazar Juan Carlos';
  const codSol = currentCase ? currentCase.solicitud : 'EFE001';
  const concessionaire = currentCase ? currentCase.concesionario : 'TOYOTA';
  const tienda = currentCase ? currentCase.tienda : 'PURUCHUCO';
  const usuario = currentCase ? currentCase.usuario : 'jgonzalesf';
  const carretera = currentCase ? currentCase.carretera : 'Full';
  const estadoCivil = currentCase ? (currentCase.estadoCivil || 'Soltero') : 'Soltero';

  let html = '';
  if (tab === 'comerciales') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Datos Comerciales</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Detalles del concesionario, tienda, ejecutivo de ventas y campaña comercial.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Concesionario</label>
          <input type="text" readonly value="${concessionaire}" />
        </div>
        <div class="ops-readonly-field">
          <label>Tienda / Sucursal</label>
          <input type="text" readonly value="${tienda}" />
        </div>
        <div class="ops-readonly-field">
          <label>Vendedor</label>
          <input type="text" readonly value="${usuario.toUpperCase()}" />
        </div>
        <div class="ops-readonly-field">
          <label>Producto</label>
          <input type="text" readonly value="Crédito vehicular PN" />
        </div>
        <div class="ops-readonly-field">
          <label>Campaña seleccionada</label>
          <input type="text" readonly value="SUV Mayo 2026" />
        </div>
        <div class="ops-readonly-field">
          <label>Beneficio de campaña</label>
          <input type="text" readonly value="Bono de equipamiento de USD 1,000" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha inicio campaña</label>
          <input type="text" readonly value="01/05/2026" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha fin campaña</label>
          <input type="text" readonly value="31/05/2026" />
        </div>
      </div>
    `;
  } else if (tab === 'credito') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Crédito y Simulación</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Condiciones financieras aprobadas y estructuración de la deuda.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Precio del vehículo</label>
          <input type="text" readonly value="S/ ${concessionaire === 'TOYOTA' ? '158,000.00' : '138,000.00'}" />
        </div>
        <div class="ops-readonly-field">
          <label>Monto inicial</label>
          <input type="text" readonly value="S/ 20,000.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Total financiamiento</label>
          <input type="text" readonly value="S/ 138,000.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Moneda financiamiento</label>
          <input type="text" readonly value="Soles (S/)" />
        </div>
        <div class="ops-readonly-field">
          <label>Tipo de cambio</label>
          <input type="text" readonly value="3.75" />
        </div>
        <div class="ops-readonly-field">
          <label>TEA</label>
          <input type="text" readonly value="14.90%" />
        </div>
        <div class="ops-readonly-field">
          <label>Plazo</label>
          <input type="text" readonly value="36 cuotas" />
        </div>
        <div class="ops-readonly-field">
          <label>Día de pago</label>
          <input type="text" readonly value="22 de cada mes" />
        </div>
        <div class="ops-readonly-field">
          <label>Cuota estimada</label>
          <input type="text" readonly value="S/ 4,123.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Total financiado con gastos</label>
          <input type="text" readonly value="S/ 141,400.00" />
        </div>
      </div>
    `;
  } else if (tab === 'gastos') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Gastos y GPS</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Costos registrales, notariales, portes y financiamiento del GPS.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Gastos notariales</label>
          <input type="text" readonly value="S/ 350.00 (Aplicado)" />
        </div>
        <div class="ops-readonly-field">
          <label>Gastos registrales</label>
          <input type="text" readonly value="S/ 800.00 (Aplicado)" />
        </div>
        <div class="ops-readonly-field">
          <label>Gastos delivery firmas</label>
          <input type="text" readonly value="S/ 150.00 (Aplicado)" />
        </div>
        <div class="ops-readonly-field">
          <label>Plan GPS</label>
          <input type="text" readonly value="Premium 3 Años" />
        </div>
        <div class="ops-readonly-field">
          <label>Gastos inclusión GPS</label>
          <input type="text" readonly value="S/ 950.00 (Financiado)" />
        </div>
        <div class="ops-readonly-field">
          <label>Kit mantenimiento prepagado</label>
          <input type="text" readonly value="No aplica" />
        </div>
        <div class="ops-readonly-field">
          <label>Portes</label>
          <input type="text" readonly value="S/ 15.00 (Mensual)" />
        </div>
        <div class="ops-readonly-field">
          <label>Otros conceptos financieros</label>
          <input type="text" readonly value="Seguro de Neumáticos (S/ 350.00)" />
        </div>
        <div class="ops-readonly-field">
          <label>Indicador de aplicación</label>
          <input type="text" readonly value="Sí" />
        </div>
        <div class="ops-readonly-field">
          <label>Importe aplicable</label>
          <input type="text" readonly value="S/ 350.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Indicador de financiamiento</label>
          <input type="text" readonly value="Sí (Financiado)" />
        </div>
      </div>
    `;
  } else if (tab === 'seguros') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Seguros</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Detalles de las pólizas de seguro vehicular y desgravamen.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Seguro vehicular</label>
          <input type="text" readonly value="Endosado (Rimac Seguros)" />
        </div>
        <div class="ops-readonly-field">
          <label>Costo seguro vehicular</label>
          <input type="text" readonly value="USD 1,200.00 (Anual)" />
        </div>
        <div class="ops-readonly-field">
          <label>Seguro desgravamen</label>
          <input type="text" readonly value="Sí (Aplicado)" />
        </div>
        <div class="ops-readonly-field">
          <label>Producto desgravamen</label>
          <input type="text" readonly value="Individual" />
        </div>
        <div class="ops-readonly-field">
          <label>Costo seguro desgravamen</label>
          <input type="text" readonly value="S/ 45.00 (Mensual)" />
        </div>
        <div class="ops-readonly-field">
          <label>Seguro optativo</label>
          <input type="text" readonly value="No" />
        </div>
        <div class="ops-readonly-field">
          <label>Costo seguro optativo</label>
          <input type="text" readonly value="S/ 0.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Tipo seguro optativo</label>
          <input type="text" readonly value="No aplica" />
        </div>
      </div>
    `;
  } else if (tab === 'domicilio') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Verificación Domiciliaria</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Informe del proveedor Verifed y estado de conformidad de la residencia.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Tipo de verificación</label>
          <input type="text" readonly value="Física (Visita de campo)" />
        </div>
        <div class="ops-readonly-field">
          <label>Proveedor</label>
          <input type="text" readonly value="Verifed S.A.C." />
        </div>
        <div class="ops-readonly-field">
          <label>Resultado</label>
          <input type="text" readonly value="Conforme / Verificado" />
        </div>
        <div class="ops-readonly-field">
          <label>Estado</label>
          <input type="text" readonly value="Completado" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha de verificación</label>
          <input type="text" readonly value="16/05/2026 14:30" />
        </div>
        <div class="ops-readonly-field">
          <label>Responsable</label>
          <input type="text" readonly value="Carlos Silva (Inspector)" />
        </div>
        <div class="ops-readonly-field span-2">
          <label>Dirección validada</label>
          <input type="text" readonly value="Av. Javier Prado Este 2450 - San Borja" />
        </div>
        <div class="ops-readonly-field">
          <label>Coordenadas</label>
          <input type="text" readonly value="-12.0847, -77.0123" />
        </div>
        <div class="ops-readonly-field">
          <label>Evidencia</label>
          <input type="text" readonly value="Fotografía fachada e interiores" />
        </div>
        <div class="ops-readonly-field span-2">
          <label>Observaciones de campo</label>
          <textarea readonly rows="3">Domicilio verificado plenamente. Se confirmó que el cliente reside en la dirección declarada, coincidiendo con el DNI and recibos de servicios presentados.</textarea>
        </div>
      </div>
    `;
  } else if (tab === 'cliente') {
    const parts = nameCli.split(' ');
    const emailVal = parts.length >= 2 
      ? `${normalize(parts[0])}.${normalize(parts[1])}@email.com`
      : 'carlos.perez@email.com';

    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Datos de Cliente</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Información personal e identificación del solicitante.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Tipo de documento</label>
          <input type="text" readonly value="DNI" />
        </div>
        <div class="ops-readonly-field">
          <label>Número de documento</label>
          <input type="text" readonly value="${numDoc}" />
        </div>
        <div class="ops-readonly-field">
          <label>Nombres</label>
          <input type="text" readonly value="${parts[0]} ${parts[1] || ''}" />
        </div>
        <div class="ops-readonly-field">
          <label>Apellido paterno</label>
          <input type="text" readonly value="${parts.slice(-2)[0] || ''}" />
        </div>
        <div class="ops-readonly-field">
          <label>Apellido materno</label>
          <input type="text" readonly value="${parts.slice(-1)[0] || ''}" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha de nacimiento</label>
          <input type="text" readonly value="15/05/1995" />
        </div>
        <div class="ops-readonly-field">
          <label>Sexo</label>
          <input type="text" readonly value="Masculino" />
        </div>
        <div class="ops-readonly-field">
          <label>Número de celular</label>
          <input type="text" readonly value="987654321" />
        </div>
        <div class="ops-readonly-field">
          <label>Correo electrónico</label>
          <input type="text" readonly value="${emailVal}" />
        </div>
        <div class="ops-readonly-field">
          <label>Nacionalidad</label>
          <input type="text" readonly value="Peruana" />
        </div>
        <div class="ops-readonly-field">
          <label>Residencia</label>
          <input type="text" readonly value="Perú" />
        </div>
        <div class="ops-readonly-field span-2">
          <label>Dirección de domicilio</label>
          <input type="text" readonly value="Av. Javier Prado Este 2450 - San Borja" />
        </div>
        <div class="ops-readonly-field">
          <label>Departamento</label>
          <input type="text" readonly value="Lima" />
        </div>
        <div class="ops-readonly-field">
          <label>Provincia</label>
          <input type="text" readonly value="Lima" />
        </div>
        <div class="ops-readonly-field">
          <label>Distrito</label>
          <input type="text" readonly value="San Borja" />
        </div>
        <div class="ops-readonly-field">
          <label>Estado civil</label>
          <input type="text" readonly value="${estadoCivil}" />
        </div>
        <div class="ops-readonly-field">
          <label>Separación de bienes</label>
          <input type="text" readonly value="No" />
        </div>
      </div>
    `;
  } else if (tab === 'laborales') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Datos Laborales</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Actividad económica, ingresos declarados y empleador del titular.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Perfil</label>
          <input type="text" readonly value="Formal" />
        </div>
        <div class="ops-readonly-field">
          <label>Situación laboral</label>
          <input type="text" readonly value="Dependiente" />
        </div>
        <div class="ops-readonly-field">
          <label>Tipo de ingreso</label>
          <input type="text" readonly value="Quinta Categoría" />
        </div>
        <div class="ops-readonly-field">
          <label>Oficio / profesión</label>
          <input type="text" readonly value="Supervisor de Operaciones" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha ingreso laboral</label>
          <input type="text" readonly value="12/03/2018" />
        </div>
        <div class="ops-readonly-field">
          <label>RUC empleador</label>
          <input type="text" readonly value="20123456789" />
        </div>
        <div class="ops-readonly-field">
          <label>Tipo moneda ingreso</label>
          <input type="text" readonly value="Soles" />
        </div>
        <div class="ops-readonly-field">
          <label>Ingresos netos mensuales</label>
          <input type="text" readonly value="S/ 6,500.00" />
        </div>
        <div class="ops-readonly-field span-2">
          <label>Empleador / empresa</label>
          <input type="text" readonly value="Servicios Generales SAC" />
        </div>
        <div class="ops-readonly-field">
          <label>Cargo laboral</label>
          <input type="text" readonly value="Supervisor de Operaciones" />
        </div>
        <div class="ops-readonly-field">
          <label>Capacidad de pago</label>
          <input type="text" readonly value="S/ 4,500.00" />
        </div>
      </div>
    `;
  } else if (tab === 'conyuge') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Datos de Cónyuge</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Información personal de la pareja.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Tipo documento cónyuge</label>
          <input type="text" readonly value="DNI" />
        </div>
        <div class="ops-readonly-field">
          <label>N° documento cónyuge</label>
          <input type="text" readonly value="45879812" />
        </div>
        <div class="ops-readonly-field">
          <label>Nombres cónyuge</label>
          <input type="text" readonly value="María Fernanda" />
        </div>
        <div class="ops-readonly-field">
          <label>Apellido paterno cónyuge</label>
          <input type="text" readonly value="López" />
        </div>
        <div class="ops-readonly-field">
          <label>Apellido materno cónyuge</label>
          <input type="text" readonly value="Torres" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha de nacimiento</label>
          <input type="text" readonly value="20/11/1988" />
        </div>
        <div class="ops-readonly-field">
          <label>Sexo cónyuge</label>
          <input type="text" readonly value="Femenino" />
        </div>
        <div class="ops-readonly-field">
          <label>Nacionalidad cónyuge</label>
          <input type="text" readonly value="Peruana" />
        </div>
      </div>
    `;
  } else if (tab === 'riesgos') {
    html = `
      <div class="tab-title-container" style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #002d72; font-size: 1.4rem; font-weight: 800;">Resultado de Riesgos</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">Condiciones de la preaprobación y políticas de PLAFT de la evaluación de Riesgos.</p>
      </div>
      <div class="ops-tab-grid">
        <div class="ops-readonly-field">
          <label>Resultado</label>
          <input type="text" readonly value="Aprobado" style="font-weight: 800; color: #16a34a;" />
        </div>
        <div class="ops-readonly-field">
          <label>Carretera asignada</label>
          <input type="text" readonly value="${carretera}" />
        </div>
        <div class="ops-readonly-field">
          <label>Score</label>
          <input type="text" readonly value="780 (A+)" />
        </div>
        <div class="ops-readonly-field">
          <label>Segmento</label>
          <input type="text" readonly value="Banca Persona" />
        </div>
        <div class="ops-readonly-field">
          <label>Monto preaprobado</label>
          <input type="text" readonly value="S/ 150,000.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Capacidad máxima</label>
          <input type="text" readonly value="S/ 5,000.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Cuota inicial mínima</label>
          <input type="text" readonly value="10%" />
        </div>
        <div class="ops-readonly-field">
          <label>Marca PEP</label>
          <input type="text" readonly value="No" />
        </div>
        <div class="ops-readonly-field">
          <label>PLAFT</label>
          <input type="text" readonly value="Conforme" />
        </div>
        <div class="ops-readonly-field">
          <label>CMA</label>
          <input type="text" readonly value="Aprobado" />
        </div>
        <div class="ops-readonly-field">
          <label>Estado de evaluación</label>
          <input type="text" readonly value="Completado" />
        </div>
        <div class="ops-readonly-field">
          <label>Analista</label>
          <input type="text" readonly value="mfloresz" />
        </div>
        <div class="ops-readonly-field span-2">
          <label>Fecha evaluación</label>
          <input type="text" readonly value="16/05/2026 10:15" />
        </div>
        <div class="ops-readonly-field span-2">
          <label>Comentarios</label>
          <textarea readonly rows="3">Aprobado sin excepciones en el comité de créditos. Cuenta con buen comportamiento de pago y ratios financieros óptimos.</textarea>
        </div>
      </div>
    `;
  }
  
  return html;
}

function renderOpsTab(tab) {
  let html = '';

  if (tab === 'comerciales') {
    html = [
      buildOpsTabSection('comerciales'),
      buildOpsTabSection('credito'),
      buildOpsTabSection('gastos'),
      buildOpsTabSection('seguros')
    ].join('<div class="ops-group-divider"></div>');
  } else if (tab === 'cliente') {
    const bloquesCliente = [
      buildOpsTabSection('cliente'),
      buildOpsTabSection('laborales')
    ];
    if (!currentCase || currentCase.estadoCivil === 'Casado') {
      bloquesCliente.push(buildOpsTabSection('conyuge'));
    }
    html = bloquesCliente.join('<div class="ops-group-divider"></div>');
  } else {
    html = buildOpsTabSection(tab);
  }

  opsTabContent.innerHTML = html;
  
  document.querySelectorAll('.ops-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.opsTab === tab);
  });
}

function renderTracking(){
  const dateSim = '15/05/2026 09:20';
  const dateSol = '15/05/2026 09:45';
  const dateRie = '16/05/2026 10:15';
  const dateApr = '16/05/2026 12:00';
  const datePost = '17/05/2026 11:30';
  const dateFirma = '22/05/2026 17:30';
  const dateCheck = '23/05/2026 16:00';
  const dateAct = '23/05/2026 18:00';

  const commonHeader = `
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Simulación</strong>
          <small>${dateSim}</small>
        </div>
      </div>
  
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Solicitud recibida</strong>
          <small>${dateSol}</small>
        </div>
      </div>
  
      <div class="track-item done risk-track has-detail">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <button class="track-toggle" type="button" aria-expanded="false">
            <span>
              <strong>Revisión Riesgos</strong>
              <small>${dateRie}</small>
            </span>
            <i class="toggle-chevron" aria-hidden="true"></i>
          </button>
  
          <div class="risk-history" hidden>
            <div class="risk-item observed">
              <h4>Observado por documentación borrosa</h4>
              <p><b>Comentario:</b> El DNI no se visualiza si es soltero, borroso.</p>
            </div>
            <div class="risk-item fixed">
              <h4>Subsanado</h4>
              <p><b>Comentario:</b> Se adjuntó el DNI con mejor calidad.</p>
            </div>
          </div>
        </div>
      </div>
  
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Aprobación</strong>
          <small>${dateApr}</small>
        </div>
      </div>
  
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Post Aprobación</strong>
          <small>${datePost}</small>
        </div>
      </div>
  
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Firma</strong>
          <small>${dateFirma}</small>
        </div>
      </div>
  `;

  if (currentCase && currentCase.estado === 'Aprobado') {
    trackingList.innerHTML = commonHeader + `
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Check List 2</strong>
          <small>${dateCheck}</small>
        </div>
      </div>
  
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Activación Bantotal</strong>
          <small>${dateAct}</small>
        </div>
      </div>
  
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Orden de pago</strong>
          <small>Generado exitosamente</small>
        </div>
      </div>`;
  } else if (currentCase && currentCase.estado === 'Activado') {
    trackingList.innerHTML = commonHeader + `
      <div class="track-item done">
        <div class="track-icon">✓</div>
        <div class="track-content">
          <strong>Check List 2</strong>
          <small>${dateCheck}</small>
        </div>
      </div>
  
      <div class="track-item current-stage-card">
        <div class="track-icon-num">8</div>
        <div class="track-content">
          <strong>Activación Bantotal</strong>
          <small>Etapa actual</small>
          <span class="badge-actual">ETAPA ACTUAL</span>
        </div>
      </div>
  
      <div class="track-item pending">
        <div class="track-icon-num">9</div>
        <div class="track-content">
          <strong>Orden de pago</strong>
          <small>Pendiente</small>
        </div>
      </div>`;
  } else {
    trackingList.innerHTML = commonHeader + `
      <div class="track-item current-stage-card">
        <div class="track-icon-num">7</div>
        <div class="track-content">
          <strong>Check List 2</strong>
          <small>Etapa actual</small>
          <span class="badge-actual">ETAPA ACTUAL</span>
        </div>
      </div>
  
      <div class="track-item pending">
        <div class="track-icon-num">8</div>
        <div class="track-content">
          <strong>Activación Bantotal</strong>
          <small>Pendiente</small>
        </div>
      </div>
  
      <div class="track-item pending">
        <div class="track-icon-num">9</div>
        <div class="track-content">
          <strong>Orden de pago</strong>
          <small>Pendiente</small>
        </div>
      </div>`;
  }
  bindTrackingAccordion();
}

function bindTrackingAccordion(){
  document.querySelectorAll('.track-item.has-detail .track-toggle').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const item=btn.closest('.track-item');
      const detail=item.querySelector('.risk-history');
      const isOpen=item.classList.toggle('open');
      btn.setAttribute('aria-expanded',isOpen?'true':'false');
      if(detail) detail.hidden=!isOpen;
    });
  });
}

function renderChecklist(){
  const docs = [
    { name: 'Carta características del vehículo *', origin: 'Manual' },
    { name: 'Comprobante de cuota inicial *', origin: 'Manual' },
    { name: 'Cotización del vehículo *', origin: 'Manual' },
    { name: 'Documento de identidad *', origin: 'Manual' },
    { name: 'Vigencia de poderes', origin: 'Manual' },
    { name: 'Partida de matrimonio con bienes separados', origin: 'Manual' },
    { name: 'Contrato de crédito firmado *', origin: 'Automático IBR/Keynua' },
    { name: 'Pagaré *', origin: 'Automático IBR/Keynua' },
    { name: 'Hoja resumen *', origin: 'Automático IBR/Keynua' },
    { name: 'Cronograma preliminar *', origin: 'Automático IBR/Keynua' },
    { name: 'Contrato de garantía *', origin: 'Automático IBR/Keynua' }
  ];
  
  const isEditable = currentCase && (currentCase.estado === 'Pendiente' || currentCase.estado === 'Subsanado');
  
  checklistBody.innerHTML = docs.map((d, i) => {
    const statusBadge = `<span class="status-badge" style="background: #e0f2fe; color: #0369a1; text-transform: none; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">Cargado</span>`;

    return `
      <tr data-index="${i}">
        <td>${i+1}</td>
        <td><strong>${d.name}</strong></td>
        <td>${statusBadge}</td>
        <td>
          <button class="icon-btn" onclick="openDocumentPreview('${d.name}', ${i+1})" type="button">👁 Ver</button>
        </td>
      </tr>`;
  }).join('');

  updateGuaranteeVisibility();
}

function updateGuaranteeVisibility(){
  const badge=$('checklistStatusBadge');
  if(badge && currentCase){
    if (currentCase.estado === 'Activado') {
      badge.className='check-badge ok';
      badge.textContent='Documentos conformes';
    } else if (currentCase.estado === 'Observado') {
      badge.className='check-badge observed';
      badge.textContent='Documentos observados';
    } else {
      badge.className='check-badge pending';
      badge.textContent='Pendiente de revisión';
    }
  }
}

function populateStageB() {
  if (!currentCase) return;
  const sol = currentCase.solicitud;
  const concessionaire = currentCase.concesionario;
  const brand = concessionaire === 'TOYOTA' ? 'Toyota' : 'Hyundai';
  const model = concessionaire === 'TOYOTA' ? 'Fortuner SRX' : 'Tucson';
  const vehName = brand === 'Toyota' ? 'Toyota Fortuner SRX 2024' : 'Hyundai Tucson 2024';
  
  const opNum = `OP-${sol}-123456`;
  const nowStr = '23/05/2026 18:00';
  const montoVal = 'S/ 138,000.00';
  const tasaVal = '14.90%';
  const plazoVal = '36 cuotas';
  const cuotaVal = 'S/ 4,123.00';

  if ($('btSolicitud')) $('btSolicitud').value = sol;
  if ($('btTipoDoc')) $('btTipoDoc').value = 'DNI';
  if ($('btNumDoc')) $('btNumDoc').value = currentCase.documento;
  if ($('btCliente')) $('btCliente').value = currentCase.cliente;
  if ($('btProducto')) $('btProducto').value = 'Crédito vehicular PN';
  if ($('btMonto')) $('btMonto').value = montoVal;
  if ($('btPlazo')) $('btPlazo').value = plazoVal;
  if ($('btCuota')) $('btCuota').value = cuotaVal;
  if ($('btTasa')) $('btTasa').value = tasaVal;
  if ($('btMoneda')) $('btMoneda').value = 'Soles (S/)';
  if ($('btVehiculo')) $('btVehiculo').value = vehName;
  if ($('btEstado')) $('btEstado').value = 'Nuevo';
  if ($('btMarca')) $('btMarca').value = brand;
  if ($('btModelo')) $('btModelo').value = model;
  if ($('btAnioModelo')) $('btAnioModelo').value = '2024';
  if ($('btTipoVehiculo')) $('btTipoVehiculo').value = 'Camioneta SUV';
  if ($('btNumMotor')) $('btNumMotor').value = '2GD-FTV-987654';
  if ($('btVin')) $('btVin').value = 'BAIDAA3G512345678';

  if ($('arOperacion')) $('arOperacion').value = opNum;
  if ($('arFechaHora')) $('arFechaHora').value = nowStr;
  if ($('arMonto')) $('arMonto').value = montoVal;
  if ($('arTasa')) $('arTasa').value = tasaVal;

  generateCronograma(montoVal, plazoVal, cuotaVal, tasaVal);

  let bank = 'Banco de Crédito (BCP)';
  let account = '191-98765432-0-12';
  if (concessionaire === 'HYUNDAI') {
    bank = 'BBVA Continental';
    account = '0011-0123-45678901-23';
  }

  if ($('poConcesionario')) $('poConcesionario').value = concessionaire;
  if ($('poCliente')) $('poCliente').value = currentCase.cliente;
  if ($('poDocumento')) $('poDocumento').value = `DNI — ${currentCase.documento}`;
  if ($('poSolicitud')) $('poSolicitud').value = sol;
  if ($('poPrecioVehiculo')) $('poPrecioVehiculo').value = 'S/ 158,000.00';
  if ($('poCuotaInicial')) $('poCuotaInicial').value = 'S/ 20,000.00';
  if ($('poMontoDesembolsar')) $('poMontoDesembolsar').value = montoVal;
  if ($('poNumCuenta')) $('poNumCuenta').value = account;
  if ($('poBanco')) $('poBanco').value = bank;

  if ($('bantotalSection')) $('bantotalSection').classList.remove('hidden');
  if ($('activationResultSection')) $('activationResultSection').classList.remove('hidden');
  if ($('paymentOrderSection')) $('paymentOrderSection').classList.remove('hidden');
}
function updateRegisterGuaranteeButton(){
  const guarantee=$('guaranteeSection');
  const registerButton=$('btnRegisterGuarantee');
  if(!guarantee || !registerButton) return;
  const visible=!guarantee.classList.contains('hidden');
  const fields=[...guarantee.querySelectorAll('input,select')];
  const completed=visible && fields.length>0 && fields.every(field=>String(field.value || '').trim() !== '');
  registerButton.disabled=!completed;
}
function bindGuaranteeFormValidation(){
  const guarantee=$('guaranteeSection');
  if(!guarantee) return;
  guarantee.querySelectorAll('input,select').forEach(field=>{
    field.addEventListener('input',updateRegisterGuaranteeButton);
    field.addEventListener('change',updateRegisterGuaranteeButton);
  });
}
function closeOptionMenus(){
  document.querySelectorAll('.options-menu').forEach(m=>m.classList.add('hidden'));
  document.querySelectorAll('.options-btn').forEach(b=>b.setAttribute('aria-expanded','false'));
}
function downloadDocumentPdf(documentName,number){
  const content=`Solicitud: ${currentCase?.solicitud || '-'}\nDocumento ${number}: ${documentName}\nEstado: Archivo descargado para revisión documental.`;
  const blob=new Blob([content],{type:'application/pdf'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download=`${String(number).padStart(2,'0')}_${normalize(documentName)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function generateCronograma(monto, plazo, cuotaVal, tea) {
  const tbody = $('cronogramaBody');
  if (!tbody) return;
  
  const cuota = parseFloat(cuotaVal.replace(/[^0-9.]/g, '')) || 4123.00;
  const totalAmort = parseFloat(monto.replace(/[^0-9.]/g, '')) || 138000.00;
  const numCuotas = parseInt(plazo) || 36;
  
  const segMensual = (totalAmort * 0.00067).toFixed(2);
  const totalSeguro = (parseFloat(segMensual) * numCuotas).toFixed(2);
  const totalInteres = (cuota * numCuotas - totalAmort - parseFloat(totalSeguro)).toFixed(2);
  
  $('cronAmortizacion').textContent = `S/ ${totalAmort.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  $('cronInteres').textContent = `S/ ${parseFloat(totalInteres).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  $('cronSeguro').textContent = `S/ ${parseFloat(totalSeguro).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  $('cronMontoFinanciado').textContent = `S/ ${totalAmort.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  $('cronTotalPagar').textContent = `S/ ${(cuota * numCuotas).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  $('cronCuotasCount').textContent = numCuotas;
  
  let html = '';
  let saldo = totalAmort;
  
  const formatCur = (v) => v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const getRowHtml = (n) => {
    const date = new Date(2026, 5 + n, 22);
    const dateStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const factor = (numCuotas - n) / numCuotas;
    const intCuota = parseFloat((totalInteres / numCuotas) * (factor * 1.5 + 0.25));
    const segCuota = parseFloat(segMensual);
    const amortCuota = cuota - intCuota - segCuota;
    
    saldo -= amortCuota;
    const dispSaldo = saldo < 0 || n === numCuotas ? 0 : saldo;
    
    return `
      <tr>
        <td>${n}</td>
        <td>${dateStr}</td>
        <td>${formatCur(cuota)}</td>
        <td>${formatCur(amortCuota)}</td>
        <td>${formatCur(intCuota)}</td>
        <td>${formatCur(segCuota)}</td>
        <td>${formatCur(cuota)}</td>
        <td class="bold-capital">S/ ${formatCur(dispSaldo)}</td>
      </tr>
    `;
  };
  
  let row1 = '', row2 = '', row3 = '', row4 = '', row5 = '', rowLast = '';
  saldo = totalAmort;
  for (let i = 1; i <= numCuotas; i++) {
    const rowHtml = getRowHtml(i);
    if (i === 1) row1 = rowHtml;
    if (i === 2) row2 = rowHtml;
    if (i === 3) row3 = rowHtml;
    if (i === 4) row4 = rowHtml;
    if (i === 5) row5 = rowHtml;
    if (i === numCuotas) rowLast = rowHtml;
  }
  
  html = row1 + row2 + row3 + row4 + row5 + `
    <tr>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
  ` + rowLast;
  
  tbody.innerHTML = html;
  if ($('cronogramaSummaryText')) {
    $('cronogramaSummaryText').textContent = `${numCuotas} cuotas — S/ ${formatCur(cuota)} / mes — Primer vencimiento: 22/06/2026`;
  }
}

function downloadCronogramaPdf() {
  const sol = currentCase ? currentCase.solicitud : 'EFE001';
  const cli = currentCase ? currentCase.cliente : 'Juan Carlos Pérez Rojas';
  const doc = currentCase ? currentCase.documento : '71865887';
  
  let content = `==================================================\n`;
  content += `           CRONOGRAMA DE PAGOS FINAL\n`;
  content += `==================================================\n`;
  content += `Solicitud: ${sol}\n`;
  content += `Cliente: ${cli}\n`;
  content += `Documento: ${doc}\n`;
  content += `Producto: Crédito vehicular PN\n`;
  content += `Fecha de activación: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}\n`;
  content += `==================================================\n\n`;
  content += `N° Cuota | Fecha Pago | Cuota (S/) | Amort. (S/) | Interes (S/) | Seguro (S/) | Saldo (S/)\n`;
  content += `---------------------------------------------------------------------------------------\n`;
  
  const rows = document.querySelectorAll('#cronogramaBody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 8 && cells[0].textContent !== '...') {
      content += `${cells[0].textContent.trim().padEnd(8)} | ${cells[1].textContent.trim().padEnd(10)} | ${cells[2].textContent.trim().padEnd(10)} | ${cells[3].textContent.trim().padEnd(11)} | ${cells[4].textContent.trim().padEnd(12)} | ${cells[5].textContent.trim().padEnd(11)} | ${cells[7].textContent.trim()}\n`;
    } else if (cells.length >= 8) {
      content += `...      | ...        | ...        | ...         | ...          | ...         | ...\n`;
    }
  });
  
  content += `\n==================================================\n`;
  content += `RESUMEN DE CRONOGRAMA\n`;
  content += `Total amortizacion: ${$('cronAmortizacion').textContent}\n`;
  content += `Total interes: ${$('cronInteres').textContent}\n`;
  content += `Total seguro: ${$('cronSeguro').textContent}\n`;
  content += `Monto financiado: ${$('cronMontoFinanciado').textContent}\n`;
  content += `Total a pagar: ${$('cronTotalPagar').textContent}\n`;
  content += `==================================================\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Cronograma_Final_${sol}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function openDetail(id){
  currentCase=cases.find(x=>x.solicitud===id);
  if(!currentCase)return;

  // Toggle Spouse tab visibility depending on Civil Status
  const isCasado = currentCase.estadoCivil === 'Casado';
  const tabBtnConyuge = $('tabBtnConyuge');
  if (tabBtnConyuge) {
    if (isCasado) {
      tabBtnConyuge.classList.remove('hidden');
    } else {
      tabBtnConyuge.classList.add('hidden');
    }
  }

  // Reset inputs and sections
  
  if($('btnAprobarActivarBantotal')) $('btnAprobarActivarBantotal').disabled = false;
  if($('btnObservarOperaciones')) $('btnObservarOperaciones').disabled = false;
  if($('btnGenerarOrdenPago')) $('btnGenerarOrdenPago').disabled = false;

  $('detailSolicitud').textContent=currentCase.solicitud;
  if($('detailCarretera'))$('detailCarretera').textContent=currentCase.carretera;
  if($('detailSLA')){
    const isExpired=expired(currentCase.sla);
    $('detailSLA').textContent=isExpired?'Caducado':currentCase.sla;
    $('detailSLA').style.color=isExpired?'#dc2626':'#16a34a';
  }
  $('detailSubtitle').textContent=`${currentCase.cliente} · ${currentCase.documento}`;
  
  bandejaView.classList.add('hidden');
  detailView.classList.remove('hidden');
  
  if ($('executiveCommentLabel') && currentCase) {
    $('executiveCommentLabel').textContent = `Comentarios del Ejecutivo Financiero [${currentCase.usuario.toUpperCase()}]`;
  }

  // Populate client details
  if ($('opsClienteNombre')) $('opsClienteNombre').value = currentCase.cliente;
  if ($('opsClienteDoc')) $('opsClienteDoc').value = currentCase.documento;
  if ($('opsClienteCelular')) $('opsClienteCelular').value = '987654321';
  if ($('opsClienteEmail')) {
    const parts = currentCase.cliente.split(' ');
    $('opsClienteEmail').value = parts.length >= 2 ? `${normalize(parts[0])}.${normalize(parts[1])}@email.com` : 'carlos.perez@email.com';
  }
  if ($('opsClienteEmpleador')) $('opsClienteEmpleador').value = 'Servicios Generales SAC';
  if ($('opsClienteCargo')) $('opsClienteCargo').value = 'Supervisor';
  if ($('opsClienteSueldo')) $('opsClienteSueldo').value = 'S/ 6,500.00';
  if ($('opsClienteCapacidad')) $('opsClienteCapacidad').value = 'S/ 4,500.00';

  // Populate vehicle details
  const concessionaire = currentCase.concesionario;
  const brand = concessionaire === 'TOYOTA' ? 'Toyota' : 'Hyundai';
  const model = concessionaire === 'TOYOTA' ? 'Corolla Cross' : 'Tucson';
  if ($('opsVehiculoMarca')) $('opsVehiculoMarca').value = brand;
  if ($('opsVehiculoModelo')) $('opsVehiculoModelo').value = model;
  if ($('opsVehiculoAnio')) $('opsVehiculoAnio').value = '2026';
  if ($('opsVehiculoTipo')) $('opsVehiculoTipo').value = 'SUV';
  if ($('opsVehiculoMotor')) $('opsVehiculoMotor').value = '2ZR-458796321';
  if ($('opsVehiculoVin')) $('opsVehiculoVin').value = 'BAIDAA3G512345678';
  if ($('opsVehiculoColor')) $('opsVehiculoColor').value = 'Plata Metálico';
  if ($('opsVehiculoPlaca')) $('opsVehiculoPlaca').value = 'T4A-458';
  if ($('opsVehiculoValor')) $('opsVehiculoValor').value = 'S/ 158,000.00';
  if ($('opsVehiculoConcesionario')) $('opsVehiculoConcesionario').value = concessionaire;
  if ($('opsVehiculoTienda')) $('opsVehiculoTienda').value = currentCase.tienda;
  if ($('opsVehiculoEjecutivo')) $('opsVehiculoEjecutivo').value = currentCase.usuario;

  // Render proper screen layout and timelines
  if (currentCase.estado === 'Activado') {
    if($('btnAprobarActivarBantotal')) $('btnAprobarActivarBantotal').disabled = true;
    if($('btnObservarOperaciones')) $('btnObservarOperaciones').disabled = true;
    
    $('stageAPanel').classList.add('hidden');
    $('stageBPanel').classList.remove('hidden');
    $('detailHeaderTitle').textContent = "Activación Bantotal";
    
    populateStageB();
    if ($('btnGenerarOrdenPago')) {
      $('btnGenerarOrdenPago').disabled = (currentCase.estado === 'Aprobado');
    }
  } else {
    $('stageAPanel').classList.remove('hidden');
    $('stageBPanel').classList.add('hidden');
    $('detailHeaderTitle').textContent = "Validación de solicitud";
    
    renderChecklist();
    renderDatosGarantia();
    renderOpsTab('domicilio');
  }

  renderObservationBox();
  renderTracking();
  window.scrollTo({top:0,behavior:'smooth'})
}
function showModal(title, msg, type = 'info', showCancel = false, onAccept = null) {
  $('modalTitle').textContent = title;
  $('modalContent').innerHTML = `<p>${msg}</p>`;
  
  const iconEl = $('modalIcon');
  if (iconEl) {
    if (type === 'success') {
      iconEl.style.background = '#dcfce7';
      iconEl.style.color = '#15803d';
      iconEl.textContent = '✓';
    } else if (type === 'error') {
      iconEl.style.background = '#fee2e2';
      iconEl.style.color = '#ef4444';
      iconEl.textContent = '⚠';
    } else if (type === 'confirm') {
      iconEl.style.background = '#eff6ff';
      iconEl.style.color = '#1d4ed8';
      iconEl.textContent = '?';
    } else {
      iconEl.style.background = '#f1f5f9';
      iconEl.style.color = '#475569';
      iconEl.textContent = 'i';
    }
  }

  const btnCancel = $('cancelModal');
  if (btnCancel) {
    if (showCancel) {
      btnCancel.classList.remove('hidden');
    } else {
      btnCancel.classList.add('hidden');
    }
    btnCancel.onclick = () => {
      modal.classList.add('hidden');
    };
  }

  const btnAccept = $('acceptModal');
  if (btnAccept) {
    btnAccept.onclick = () => {
      modal.classList.add('hidden');
      if (onAccept) onAccept();
    };
  }

  const btnClose = $('closeModal');
  if (btnClose) {
    btnClose.onclick = () => {
      modal.classList.add('hidden');
    };
  }

  modal.classList.remove('hidden');
}
function fillAnalistaFilter(){
  const el=$('filterAnalista');
  if(!el) return;
  const current=el.value;
  el.innerHTML='<option value="">Seleccionar</option>';
  ['Sin asignar', ...unique('analistaOperaciones')].forEach(v=>el.insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
  el.value=[...el.options].some(o=>o.value===current)?current:'';
}
fillSelect('filterConcesionario','concesionario');fillAnalistaFilter();fillEstado();applyFilters();
$('btnLimpiar').addEventListener('click',clearFilters);
$('filterDocumento').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'');applyFilters();});
['filterSolicitud','filterUsuario'].forEach(id=>$(id).addEventListener('input',applyFilters));
['filterConcesionario','filterAnalista','filterEstado','filterFechaDesde','filterFechaHasta'].forEach(id=>$(id).addEventListener('change',applyFilters));
['filterFechaDesde','filterFechaHasta'].forEach(id=>$(id).addEventListener('input',applyFilters));
$('backToInbox').addEventListener('click',intentarRegresarABandeja);document.querySelectorAll('.ops-tab-btn').forEach(b=>b.addEventListener('click',()=>renderOpsTab(b.dataset.opsTab)));
if($('btnObserveExecutive')) $('btnObserveExecutive').addEventListener('click',()=>showModal('Observación enviada','Se registró la observación y el caso será devuelto al ejecutivo para subsanación.'));

if ($('btnDescargarCronograma')) $('btnDescargarCronograma').addEventListener('click', downloadCronogramaPdf);
if ($('btnGenerarOrdenPago')) {
  $('btnGenerarOrdenPago').addEventListener('click', () => {
    showModal(
      'Confirmar envío',
      '¿Está seguro de que desea generar la salida para la orden de pago?',
      'confirm',
      true,
      () => {
        showModal('Envío Exitoso', 'Se generó la salida para la orden de pago de manera exitosa.', 'success');
        currentCase.estado = 'Aprobado';
        saveCases();
        fillAnalistaFilter();
        renderTracking();
        render();
        if ($('btnGenerarOrdenPago')) {
          $('btnGenerarOrdenPago').disabled = true;
        }
      }
    );
  });
}

if ($('btnRegresarBandeja')) {
  $('btnRegresarBandeja').addEventListener('click', () => {
    intentarRegresarABandeja();
  });
}

if($('btnDeriveBoss')) $('btnDeriveBoss').addEventListener('click',()=>showModal('Derivado a jefe','El caso fue derivado a jefe para revisión.'));
$('closeModal').addEventListener('click',()=>modal.classList.add('hidden'));$('acceptModal').addEventListener('click',()=>modal.classList.add('hidden'));modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});document.addEventListener('click',closeOptionMenus);document.addEventListener('keydown',e=>{if(e.key==='Escape'){modal.classList.add('hidden');if($('observarModal'))$('observarModal').classList.add('hidden');if($('docPreviewModal'))$('docPreviewModal').classList.add('hidden');closeOptionMenus();}});

// --- Nuevas Acciones de Operaciones ---
$('btnRegresarBandejaOps')?.addEventListener('click',intentarRegresarABandeja);

// --- Modal de Observación Event Listeners ---
const observarModal = $('observarModal');
const closeObservarModal = $('closeObservarModal');
const cancelObservarModal = $('cancelObservarModal');
const confirmObservarModal = $('confirmObservarModal');
const observarMotivo = $('observarMotivo');
const observarComentario = $('observarComentario');

$('btnObservarOperaciones')?.addEventListener('click', () => {
  if (observarMotivo) observarMotivo.value = '';
  if (observarComentario) observarComentario.value = '';
  if (observarModal) observarModal.classList.remove('hidden');
});

closeObservarModal?.addEventListener('click', () => {
  if (observarModal) observarModal.classList.add('hidden');
});

cancelObservarModal?.addEventListener('click', () => {
  if (observarModal) observarModal.classList.add('hidden');
});

confirmObservarModal?.addEventListener('click', () => {
  const motivo = observarMotivo.value;
  const comentario = observarComentario.value.trim();

  if (!motivo) {
    showModal('Campo Requerido', 'Por favor, seleccione el motivo de la observación.', 'warning');
    return;
  }
  if (!comentario) {
    showModal('Campo Requerido', 'Por favor, ingrese un comentario para la observación.', 'warning');
    return;
  }

  if (currentCase) {
    currentCase.estado = 'Observado';
    currentCase.motivoObservacion = motivo;
    currentCase.comentarioObservacion = comentario;
    currentCase.fechaObservacion = getFormattedNow();
    currentCase.analistaObservacion = usuarioOperacionesSesion;
    currentCase.historialOperaciones = currentCase.historialOperaciones || [];
    currentCase.historialOperaciones.push({rol:'Analista de Operaciones',usuario:usuarioOperacionesSesion,fecha:currentCase.fechaObservacion,comentario:`Observado: ${motivo} - ${comentario}`});
    saveCases();
    fillAnalistaFilter();

    if (observarModal) observarModal.classList.add('hidden');
    
    applyFilters(); // Update inbox grid
    renderObservationBox(); // Update current view card & buttons
    showModal('Solicitud Observada', 'La solicitud ha sido observada y devuelta al Ejecutivo de manera exitosa.');
  }
});

observarModal?.addEventListener('click', e => {
  if (e.target === observarModal) observarModal.classList.add('hidden');
});

$('btnAprobarActivarBantotal')?.addEventListener('click',()=>{
  showModal('Activación Exitosa', `Se aprobó la solicitud y se activó exitosamente en Bantotal.`);
  
  currentCase.estado = 'Activado';
  currentCase.fechaActivacion = getFormattedNow();
  currentCase.analistaActivacion = usuarioOperacionesSesion;
  currentCase.historialOperaciones = currentCase.historialOperaciones || [];
  currentCase.historialOperaciones.push({rol:'Analista de Operaciones',usuario:usuarioOperacionesSesion,fecha:currentCase.fechaActivacion,comentario:'Solicitud aprobada y activada en Bantotal.'});
  saveCases();
  fillAnalistaFilter();
  
  $('stageAPanel').classList.add('hidden');
  $('stageBPanel').classList.remove('hidden');
  $('detailHeaderTitle').textContent = "Activación Bantotal";
  
  populateStageB();
  renderTracking();
  applyFilters();
  
  if($('btnAprobarActivarBantotal')) $('btnAprobarActivarBantotal').disabled = true;
  if($('btnObservarOperaciones')) $('btnObservarOperaciones').disabled = true;

  window.scrollTo({top:0,behavior:'smooth'});
});

$('btnRegresarBandejaActivacion')?.addEventListener('click',intentarRegresarABandeja);

let activePreviewName = '';
let activePreviewNum = 1;

function openDocumentPreview(name, num) {
  activePreviewName = name;
  activePreviewNum = num;
  
  if ($('previewModalTitle')) $('previewModalTitle').textContent = `Vista Previa - Documento ${num}`;
  if ($('previewDocName')) $('previewDocName').textContent = name;
  if ($('docPreviewModal')) $('docPreviewModal').classList.remove('hidden');
}

function closeDocumentPreview() {
  if ($('docPreviewModal')) $('docPreviewModal').classList.add('hidden');
}

// Bind Document Preview event listeners
$('closePreviewModal')?.addEventListener('click', closeDocumentPreview);
$('btnCerrarPreview')?.addEventListener('click', closeDocumentPreview);
$('btnDescargarPreview')?.addEventListener('click', () => {
  downloadDocumentPdf(activePreviewName, activePreviewNum);
});
