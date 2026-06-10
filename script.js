const cases=[
{solicitud:'EFE001',cliente:'Pérez Salazar Juan Carlos',documento:'12345678',concesionario:'TOYOTA',tienda:'PURUCHUCO',usuario:'jgonzalesf',carretera:'Full',fecha:'2026-05-20T15:30:00',estado:'Pendiente',sla:'02h 20m'},
{solicitud:'EFE002',cliente:'Melgar Salazar José Carlos',documento:'12345678',concesionario:'HYUNDAI',tienda:'SAN MIGUEL',usuario:'tramirezp',carretera:'Full',fecha:'2026-05-20T15:30:00',estado:'Subsanado',sla:'01h 10m'},
{solicitud:'EFE003',cliente:'Pérez García Pedro Juan',documento:'12345678',concesionario:'TOYOTA',tienda:'LA MOLINA',usuario:'jgonzalesf',carretera:'Semi Full',fecha:'2026-05-20T15:30:00',estado:'Aprobado',sla:'00h 35m'},
{solicitud:'POP001',cliente:'Pérez Salazar Felipe Carlos',documento:'12345678',concesionario:'HYUNDAI',tienda:'PURUCHUCO',usuario:'jpardol',carretera:'Express',fecha:'2026-05-20T15:30:00',estado:'Observado',sla:'06h 05m'},
{solicitud:'POP002',cliente:'Toledo Salazar Rafael Carlos',documento:'12345678',concesionario:'TOYOTA',tienda:'SAN MIGUEL',usuario:'jpardol',carretera:'Full',fecha:'2026-05-20T15:30:00',estado:'Rechazado',sla:'08h 40m'}];
const $=id=>document.getElementById(id);const gridBody=$('gridBody'),summary=$('summary'),resultCount=$('resultCount'),totalCases=$('totalCases');
const bandejaView=$('bandejaView'),detailView=$('detailView'),opsTabContent=$('opsTabContent'),checklistBody=$('checklistBody'),trackingList=$('trackingList');
const modal=$('modal'),modalTitle=$('modalTitle'),modalContent=$('modalContent');let currentCase=null;let checklistStatuses=[];

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
function unique(f){return [...new Set(cases.map(x=>x[f]))].sort()}function fillSelect(id,f){unique(f).forEach(v=>$(id).insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`))}function fillEstado(){['Subsanado','Pendiente','Aprobado','Observado','Rechazado','Derivado Jefe','Activado'].forEach(v=>$('filterEstado').insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`))}
function render(data=cases){gridBody.innerHTML=data.map(item=>{const canOpen=['Pendiente','Subsanado','Aprobado','Observado','Rechazado','Derivado Jefe','Activado'].includes(item.estado);return `<tr><td>${item.solicitud}</td><td>${item.cliente}</td><td>${item.documento}</td><td>${item.concesionario}</td><td>${item.tienda}</td><td><strong>${item.usuario}</strong></td><td>${item.carretera}</td><td>${formatDate(item.fecha)}</td><td><span class="status ${normalize(item.estado)}">${item.estado}</span></td><td><span class="sla ${slaClass(item)}">${slaLabel(item)}</span></td><td><button class="open-btn" type="button" data-id="${item.solicitud}" ${canOpen?'':'disabled'}>${canOpen?'Abrir':'No disponible'}</button></td></tr>`}).join('');
resultCount.textContent=`${data.length} resultado${data.length===1?'':'s'}`;totalCases.textContent=cases.length;summary.innerHTML=['Subsanado','Pendiente','Aprobado','Observado','Rechazado','Derivado Jefe','Activado'].map(s=>`<span><i class="dot ${normalize(s)}"></i>${s} <strong>${data.filter(x=>x.estado===s).length}</strong></span>`).join('');document.querySelectorAll('.open-btn:not(:disabled)').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.id)))}
function getFilters(){return{solicitud:$('filterSolicitud').value.trim().toUpperCase(),documento:$('filterDocumento').value.trim(),concesionario:$('filterConcesionario').value,tienda:$('filterTienda').value,usuario:$('filterUsuario').value.trim().toLowerCase(),carretera:$('filterCarretera').value,estado:$('filterEstado').value,desde:$('filterFechaDesde').value,hasta:$('filterFechaHasta').value}}
function applyFilters(){const f=getFilters();render(cases.filter(i=>{const d=i.fecha.slice(0,10);return(!f.solicitud||i.solicitud.includes(f.solicitud))&&(!f.documento||i.documento.includes(f.documento))&&(!f.concesionario||i.concesionario===f.concesionario)&&(!f.tienda||i.tienda===f.tienda)&&(!f.usuario||i.usuario.toLowerCase().includes(f.usuario))&&(!f.carretera||i.carretera===f.carretera)&&(!f.estado||i.estado===f.estado)&&(!f.desde||d>=f.desde)&&(!f.hasta||d<=f.hasta)}))}
function clearFilters(){['filterSolicitud','filterDocumento','filterConcesionario','filterTienda','filterUsuario','filterCarretera','filterEstado','filterFechaDesde','filterFechaHasta'].forEach(id=>$(id).value='');render()}
function renderOpsTab(tab) {
  const numDoc = currentCase ? currentCase.documento : '12345678';
  const nameCli = currentCase ? currentCase.cliente : 'Pérez Salazar Juan Carlos';
  const codSol = currentCase ? currentCase.solicitud : 'EFE001';

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

  let html = '';
  if (tab === 'vehiculo') {
    html = `
      <div class="ops-tab-grid">
        <div class="ops-tab-title-header">Datos de Vehículo</div>
        
        <div class="ops-readonly-field">
          <label>Estado del vehículo</label>
          <select disabled>
            <option selected>Nuevo</option>
            <option>Seminuevo</option>
            <option>Usado</option>
          </select>
        </div>
        <div class="ops-readonly-field">
          <label>Valor del vehículo (USD) *</label>
          <input type="text" readonly value="${vehValorUsd}" />
        </div>
        
        <div class="ops-readonly-field">
          <label>Valor del vehículo (S/)</label>
          <input type="text" readonly value="${vehValorPen}" />
        </div>
        <div class="ops-readonly-field">
          <label>Año modelo *</label>
          <input type="text" readonly value="${vehAnio}" />
        </div>
        
        <div class="ops-readonly-field">
          <label>Marca *</label>
          <input type="text" readonly value="${vehMarca}" />
        </div>
        <div class="ops-readonly-field">
          <label>Modelo *</label>
          <input type="text" readonly value="${vehModelo}" />
        </div>
        
        <div class="ops-readonly-field">
          <label>Color *</label>
          <input type="text" readonly value="${vehColor}" />
        </div>
        <div class="ops-readonly-field">
          <label>Tipo de vehículo *</label>
          <select disabled>
            <option selected>SUV</option>
            <option>Sedán</option>
            <option>Pick-up</option>
            <option>Hatchback</option>
          </select>
        </div>
        
        <div class="ops-readonly-field">
          <label>VIN *</label>
          <input type="text" readonly value="${vehVin}" />
        </div>
        <div class="ops-readonly-field">
          <label>N° de motor *</label>
          <input type="text" readonly value="${vehMotor}" />
        </div>
      </div>
    `;
  } else if (tab === 'domicilio') {
    html = `
      <div class="ops-tab-grid">
        <div class="ops-tab-title-header">Verificación Domiciliaria</div>
        
        <div class="ops-readonly-field">
          <label>Proveedor Verifed</label>
          <input type="text" readonly value="Verifed S.A.C." />
        </div>
        <div class="ops-readonly-field">
          <label>Estado de la verificación</label>
          <input type="text" readonly value="Conforme / Verificado" />
        </div>
        
        <div class="ops-readonly-field span-2">
          <label>Fecha de resultado</label>
          <input type="text" readonly value="16/05/2026 14:30" />
        </div>
        
        <div class="ops-readonly-field span-2">
          <label>Observaciones de campo</label>
          <textarea readonly rows="3">Domicilio verificado plenamente. Se confirmó que el cliente reside en la dirección declarada, coincidiendo con el DNI y los recibos de servicios presentados.</textarea>
        </div>
      </div>
    `;
  } else if (tab === 'cliente') {
    const parts = nameCli.split(' ');
    const emailVal = parts.length >= 2 
      ? `${normalize(parts[0])}.${normalize(parts[1])}@email.com`
      : 'carlos.perez@email.com';

    html = `
      <div class="ops-tab-grid">
        <div class="ops-tab-title-header">Datos de Cliente</div>
        
        <div class="ops-readonly-field">
          <label>Tipo de documento</label>
          <input type="text" readonly value="DNI" />
        </div>
        <div class="ops-readonly-field">
          <label>Número de documento</label>
          <input type="text" readonly value="${numDoc}" />
        </div>
        
        <div class="ops-readonly-field">
          <label>Nombre completo</label>
          <input type="text" readonly value="${nameCli}" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha de nacimiento</label>
          <input type="text" readonly value="15/09/1988" />
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
          <label>Estado civil</label>
          <select disabled>
            <option selected>Casado</option>
            <option>Soltero</option>
            <option>Divorciado</option>
            <option>Viudo</option>
          </select>
        </div>
        <div class="ops-readonly-field">
          <label>Separación de bienes</label>
          <select disabled>
            <option selected>No</option>
            <option>Sí</option>
          </select>
        </div>

        <div class="ops-readonly-field">
          <label>Empleador / Empresa</label>
          <input type="text" readonly value="Servicios Generales SAC" />
        </div>
        <div class="ops-readonly-field">
          <label>Cargo laboral</label>
          <input type="text" readonly value="Supervisor de Operaciones" />
        </div>

        <div class="ops-readonly-field">
          <label>Sueldo mensual neto</label>
          <input type="text" readonly value="S/ 6,500.00" />
        </div>
        <div class="ops-readonly-field">
          <label>Capacidad de pago</label>
          <input type="text" readonly value="S/ 4,500.00" />
        </div>
        
        <div class="ops-readonly-field span-2">
          <label>Dirección de domicilio</label>
          <input type="text" readonly value="Av. Javier Prado Este 2450 - San Borja" />
        </div>
        <div class="ops-readonly-field span-2">
          <label>Referencia de ubicación</label>
          <input type="text" readonly value="Frente al Centro Comercial La Rambla" />
        </div>
      </div>
    `;
  } else if (tab === 'riesgos') {
    html = `
      <div class="ops-tab-grid">
        <div class="ops-tab-title-header">Resultado de Riesgos</div>
        
        <div class="ops-readonly-field">
          <label>Estado de Riesgos</label>
          <input type="text" readonly value="Aprobado" style="font-weight: 800; color: #16a34a;" />
        </div>
        <div class="ops-readonly-field">
          <label>Fecha de aprobación</label>
          <input type="text" readonly value="16/05/2026 10:15" />
        </div>
        
        <div class="ops-readonly-field span-2">
          <label>Analista de Riesgos responsable</label>
          <input type="text" readonly value="mfloresz" />
        </div>
        
        <div class="ops-readonly-field span-2">
          <label>Observaciones históricas</label>
          <textarea readonly rows="3">Aprobado sin excepciones en el comité de créditos. Cuenta con buen comportamiento de pago y ratios financieros óptimos.</textarea>
        </div>
      </div>
    `;
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
        <td><span style="font-size: 13px; color: #4b5563; font-weight: 600;">${d.origin}</span></td>
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
    if (currentCase.estado === 'Aprobado' || currentCase.estado === 'Activado') {
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

  // Reset inputs and sections
  if($('opsObservationText')) $('opsObservationText').value = '';
  
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
  if (currentCase.estado === 'Aprobado' || currentCase.estado === 'Activado') {
    if($('btnAprobarActivarBantotal')) $('btnAprobarActivarBantotal').disabled = true;
    if($('btnObservarOperaciones')) $('btnObservarOperaciones').disabled = true;
    
    $('stageAPanel').classList.add('hidden');
    $('stageBPanel').classList.remove('hidden');
    $('detailHeaderTitle').textContent = "Activación bantotal";
    
    populateStageB();
    if ($('btnGenerarOrdenPago')) {
      $('btnGenerarOrdenPago').disabled = (currentCase.estado === 'Aprobado');
    }
  } else {
    $('stageAPanel').classList.remove('hidden');
    $('stageBPanel').classList.add('hidden');
    $('detailHeaderTitle').textContent = "Validación de solicitud";
    
    renderChecklist();
    renderOpsTab('vehiculo');
  }

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
fillSelect('filterConcesionario','concesionario');fillSelect('filterTienda','tienda');fillSelect('filterCarretera','carretera');fillEstado();render();
$('btnLimpiar').addEventListener('click',clearFilters);
$('filterDocumento').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'');applyFilters();});
['filterSolicitud','filterUsuario'].forEach(id=>$(id).addEventListener('input',applyFilters));
['filterConcesionario','filterTienda','filterCarretera','filterEstado','filterFechaDesde','filterFechaHasta'].forEach(id=>$(id).addEventListener('change',applyFilters));
['filterFechaDesde','filterFechaHasta'].forEach(id=>$(id).addEventListener('input',applyFilters));
$('backToInbox').addEventListener('click',()=>{detailView.classList.add('hidden');bandejaView.classList.remove('hidden')});document.querySelectorAll('.ops-tab-btn').forEach(b=>b.addEventListener('click',()=>renderOpsTab(b.dataset.opsTab)));
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
    detailView.classList.add('hidden');
    bandejaView.classList.remove('hidden');
  });
}

if($('btnDeriveBoss')) $('btnDeriveBoss').addEventListener('click',()=>showModal('Derivado a jefe','El caso fue derivado a jefe para revisión.'));
$('closeModal').addEventListener('click',()=>modal.classList.add('hidden'));$('acceptModal').addEventListener('click',()=>modal.classList.add('hidden'));modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});document.addEventListener('click',closeOptionMenus);document.addEventListener('keydown',e=>{if(e.key==='Escape'){modal.classList.add('hidden');closeOptionMenus();}});

// --- Nuevas Acciones de Operaciones ---
$('btnRegresarBandejaOps')?.addEventListener('click',()=>{detailView.classList.add('hidden');bandejaView.classList.remove('hidden')});

$('btnObservarOperaciones')?.addEventListener('click',()=>{
  const obs = $('opsObservationText').value.trim();
  if(!obs){
    showModal('Observación Requerida','Por favor, ingrese el motivo de la observación en el cuadro de texto.');
    return;
  }
  currentCase.estado = 'Observado';
  showModal('Solicitud Observada', `La solicitud ${currentCase.solicitud} ha sido observada y devuelta al Ejecutivo con la siguiente observación: "${obs}"`);
  detailView.classList.add('hidden');
  bandejaView.classList.remove('hidden');
  render();
});

$('btnAprobarActivarBantotal')?.addEventListener('click',()=>{
  showModal('Activación Exitosa', `Se aprobó la solicitud y se activó exitosamente en Bantotal.`);
  
  currentCase.estado = 'Activado';
  
  $('stageAPanel').classList.add('hidden');
  $('stageBPanel').classList.remove('hidden');
  $('detailHeaderTitle').textContent = "Activación bantotal";
  
  populateStageB();
  renderTracking();
  render();
  
  if($('btnAprobarActivarBantotal')) $('btnAprobarActivarBantotal').disabled = true;
  if($('btnObservarOperaciones')) $('btnObservarOperaciones').disabled = true;

  window.scrollTo({top:0,behavior:'smooth'});
});

$('btnRegresarBandejaActivacion')?.addEventListener('click',()=>{
  detailView.classList.add('hidden');
  bandejaView.classList.remove('hidden');
});

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
