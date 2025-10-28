// ===== VARIABLES GLOBALES =====
console.log("Archivo indexadmin.js cargado correctamente");

// Función global para abrir el modal (debe estar al inicio)
function abrirModalCrear() {
  console.log("Función global abrirModalCrear ejecutada");
  const modal = document.getElementById("crear-mascota-modal");
  if (modal) {
    modal.style.display = "flex";
  } else {
    console.log("Modal no encontrado en función global");
  }
}

// Función global para cerrar el modal
function cerrarModalCrear() {
  console.log("Función global cerrarModalCrear ejecutada");
  const modal = document.getElementById("crear-mascota-modal");
  const form = document.getElementById("crear-mascota-form");
  const imagenPreview = document.getElementById("imagen-preview");
  
  if (modal) modal.style.display = "none";
  if (form) form.reset();
  if (imagenPreview) imagenPreview.innerHTML = "";
}

const cardsGrid = document.getElementById('cardsGrid');
const searchBar = document.getElementById('searchBar');
const filtersToggle = document.getElementById('filtersToggle');
const filtersContainer = document.getElementById('filtersContainer');
const especieFilter = document.getElementById('especieFilter');
const razaFilter = document.getElementById('razaFilter');
const tamanoFilter = document.getElementById('tamanoFilter');
const saludFilter = document.getElementById('saludFilter');
const clearFilters = document.getElementById('clearFilters');
const activeFilters = document.getElementById('activeFilters');
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector('.sidebar');

const cantidadPatitas = 15;
const tamanoMin = 30;
const tamanoMax = 70;
const sidebarWidth = 200; 
const headerHeight = 90;

let cardCounter = 0;
let allPets = [];
let filteredPets = [];
let dataLoaded = false;

// ===== TOGGLE DEL MENÚ EN RESPONSIVE =====
if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("active");
  });

  // Cerrar el menú al hacer clic fuera de él
  document.addEventListener("click", (e) => {
    if (sidebar.classList.contains("active") && 
        !sidebar.contains(e.target) && 
        !menuToggle.contains(e.target)) {
      sidebar.classList.remove("active");
    }
  });
}

// ===== VERIFICACIÓN DE ACCESO ADMIN =====
async function verificarAccesoAdmin() {
  try {
    const res = await fetch("../php/session_status.php", {
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    
    // Solo permitir acceso a empleados e instituciones
    if (data.logged && (data.rol === 'empleado' || data.rol === 'institucion')) {
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error al verificar acceso:", e);
    return false;
  }
}

// ===== FUNCIONES AL CARGAR LA PAGINA =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOM cargado, inicializando aplicación...");
  
  // Verificar acceso antes de hacer cualquier cosa
  const tieneAcceso = await verificarAccesoAdmin();
  if (!tieneAcceso) {
    alert("No tienes permisos para acceder a esta página. Serás redirigido al inicio.");
    window.location.href = "../index/index.html";
    return;
  }
  
  setupEventListeners();
  await checkSessionAndToggleUI();
  setupProfileMenuHandlers();
  setupPerfilModalHandlers();
  setupCrearMascotaHandlers();
  generarPatitas();
  // Cargar mascotas al final para evitar mensajes prematuros
  await cargarMascotasDesdeDB(); 
  console.log("Aplicación inicializada completamente");
});

// ===== CHECK DE SESIÓN Y UI PERFIL =====
async function checkSessionAndToggleUI() {
  const loginBtn = document.getElementById("login-btn");
  const profileIcon = document.getElementById("profile-icon");

  try {
    const res = await fetch("../php/session_status.php", {
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.logged) {
      // Guardar email del usuario en sessionStorage para el chat
      if (data.email) {
        sessionStorage.setItem('userEmail', data.email);
      }
      if (loginBtn)    loginBtn.style.display = "none";
      if (profileIcon) profileIcon.style.display = "block";
      
      // Verificar si el usuario es donante y agregar badge, cargar logo de perfil
      try {
        const perfilRes = await fetch("../php/get_perfil.php", { credentials: "include", cache: "no-store" });
        const perfilData = await perfilRes.json();
        if (perfilData.success) {
          const profileCircle = document.getElementById("profile-circle");
          
          // Mostrar logo de perfil si existe
          if (perfilData.perfil.logo && profileCircle) {
            const userIcon = profileCircle.querySelector('i');
            if (userIcon) {
              userIcon.style.display = 'none';
            }
            profileCircle.style.backgroundImage = `url('${perfilData.perfil.logo}')`;
            profileCircle.style.backgroundSize = 'cover';
            profileCircle.style.backgroundPosition = 'center';
          }
          
          // Agregar badge si es donante
          if (data.rol === 'usuario' && perfilData.perfil.donante) {
            const profileIcon = document.getElementById("profile-icon");
            if (profileIcon && profileCircle && !document.querySelector("#profile-icon .premium-badge-small")) {
              // Crear contenedor relativo si no existe
              if (profileCircle.parentElement.id === "profile-icon") {
                const container = document.createElement("div");
                container.style.cssText = "position:relative;display:inline-block;";
                profileCircle.parentElement.insertBefore(container, profileCircle);
                container.appendChild(profileCircle);
                
                // Agregar el badge al contenedor
                const badge = document.createElement("div");
                badge.className = "premium-badge-small";
                container.insertBefore(badge, profileCircle);
              }
            }
          }
        }
      } catch (e) {
        console.log("No se pudo verificar perfil:", e);
      }
      
      // Agregar opción para volver al índice público si es empleado o institución
      const profileMenu = document.getElementById("profile-menu");
      if (profileMenu && (data.rol === 'empleado' || data.rol === 'institucion')) {
        const volverOption = document.getElementById("volver-index-option");
        if (!volverOption) {
          const ul = profileMenu.querySelector("ul");
          const editarPerfil = document.getElementById("editar-perfil");
          const li = document.createElement("li");
          li.id = "volver-index-option";
          li.textContent = "Índice Público";
          li.onclick = () => {
            window.location.href = "../index/index.html";
          };
          // Insertar después de "editar-perfil"
          if (editarPerfil && editarPerfil.parentElement) {
            editarPerfil.parentElement.insertBefore(li, editarPerfil.nextSibling);
          } else {
            ul.appendChild(li);
          }
        }
      }
    } else {
      if (loginBtn)    loginBtn.style.display = "block";
      if (profileIcon) profileIcon.style.display = "none";
    }
  } catch (e) {
    if (loginBtn)    loginBtn.style.display = "block";
    if (profileIcon) profileIcon.style.display = "none";
  }
}

function setupProfileMenuHandlers() {
  const profileCircle = document.getElementById("profile-circle");
  const profileMenu = document.getElementById("profile-menu");

  if (profileCircle && profileMenu) {
    profileCircle.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("open");
    });
    document.addEventListener("click", () => {
      profileMenu.classList.remove("open");
    });
  }

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await fetch("../php/logout.php", { credentials: "include", cache: "no-store" });
      window.location.reload();
    };
  }

  const verChatsBtn = document.getElementById("ver-chats");
  if (verChatsBtn) {
    verChatsBtn.onclick = async () => {
      await abrirListaChats();
    };
  }

  const verPerfilBtn = document.getElementById("ver-perfil");
  if (verPerfilBtn) {
    verPerfilBtn.onclick = async () => {
      const modal = document.getElementById("perfil-modal");
      const modalContent = document.getElementById("perfil-modal-content");
      if (!modal || !modalContent) return;
      modal.style.display = "flex";
      modalContent.innerHTML = "<div style='text-align:center;padding:30px 0;'>Cargando...</div>";

      try {
        const res = await fetch("../php/get_perfil.php", { credentials: "include", cache: "no-store" });
        const data = await res.json();
        console.log('Datos del perfil recibidos:', data); // Debug
        
        if (data.success) {
          const p = data.perfil || {};
          const rol = data.rol || 'usuario';
          console.log('Rol del usuario:', rol); // Debug
          console.log('Datos del perfil:', p); // Debug
          
          // Campos específicos para instituciones y empleados
          let camposExtra = '';
          if (rol === 'institucion') {
            camposExtra = `
              <div class="perfil-info-row"><span class="perfil-info-label">Días:</span><span class="perfil-info-value">${p.dia ?? '-'}</span></div>
              <div class="perfil-info-row"><span class="perfil-info-label">Hora Apertura:</span><span class="perfil-info-value">${p.hora_apertura ?? '-'}</span></div>
              <div class="perfil-info-row"><span class="perfil-info-label">Hora Cierre:</span><span class="perfil-info-value">${p.hora_cierre ?? '-'}</span></div>
            `;
          } else if (rol === 'empleado') {
            camposExtra = `
              <div class="perfil-info-row"><span class="perfil-info-label">Tipo Empleado:</span><span class="perfil-info-value">${p.tipo ?? '-'}</span></div>
            `;
          }
          
          modalContent.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:18px;">
              <div style="position:relative;display:inline-block;">
                ${p.donante ? '<div class="premium-badge"></div>' : ''}
                <div style="width:70px;height:70px;border-radius:50%;background:${p.logo ? `url('${p.logo}')` : '#fff'};background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #b48a5a55;position:relative;z-index:2;">
                  ${!p.logo ? `<i class='bx ${rol === 'institucion' ? 'bx-building' : rol === 'empleado' ? 'bx-id-card' : 'bx-user'}' style="font-size:3rem;color:#b48a5a;"></i>` : ''}
                </div>
              </div>
              <div style="font-size:1.3rem;font-weight:bold;color:#8b4513;margin-top:10px;">
                ${(p.nombre ?? '')} ${(p.apellido ?? '')}
              </div>
              <div style="display:inline-block;margin-top:8px;padding:4px 12px;background:#28a745;color:white;border-radius:15px;font-size:0.85rem;font-weight:bold;">
                ${p.tipo_cuenta ?? 'Usuario'}
              </div>
            </div>
            <div class="perfil-info-row"><span class="perfil-info-label">Email:</span><span class="perfil-info-value">${p.mail ?? '-'}</span></div>
            ${p.cedula !== undefined && p.cedula !== '' && p.cedula !== null ? `<div class="perfil-info-row"><span class="perfil-info-label">Cédula:</span><span class="perfil-info-value">${p.cedula}</span></div>` : ''}
            <div class="perfil-info-row"><span class="perfil-info-label">Teléfono:</span><span class="perfil-info-value">${p.telefono ?? '-'}</span></div>
            <div class="perfil-info-row"><span class="perfil-info-label">Dirección:</span><span class="perfil-info-value">${p.direccion ?? '-'}</span></div>
            ${camposExtra}
          `;
        } else {
          console.error('Error al cargar perfil:', data.message);
          modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>${data.message || "No se pudo cargar el perfil."}</div>`;
        }
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>Error al conectar con el servidor.</div>`;
      }
    };
  }

  const editarPerfilBtn = document.getElementById("editar-perfil");
  if (editarPerfilBtn) {
    editarPerfilBtn.onclick = async () => {
      const modal = document.getElementById("perfil-modal");
      const modalContent = document.getElementById("perfil-modal-content");
      if (!modal || !modalContent) return;
      modal.style.display = "flex";
      modalContent.innerHTML = "<div style='text-align:center;padding:30px 0;'>Cargando...</div>";

      try {
        const res = await fetch("../php/get_perfil.php", { credentials: "include", cache: "no-store" });
        const data = await res.json();
        console.log('Datos para editar perfil:', data); // Debug
        
        if (data.success) {
          const p = data.perfil || {};
          const rol = data.rol || 'usuario';
          
          // Generar campos según el tipo de cuenta
          let camposFormulario = '';
          if (rol === 'institucion') {
            camposFormulario = `
              <input type="text" name="nombre" placeholder="Nombre Institución" value="${p.nombre ?? ''}" required style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <input type="text" name="telefono" placeholder="Teléfono" value="${p.telefono ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <input type="text" name="direccion" placeholder="Dirección" value="${p.direccion ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <input type="text" name="dia" placeholder="Días de atención" value="${p.dia ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <div style="display:flex;gap:15px;width:100%;margin-top:0;">
                <div style="flex:1;display:flex;flex-direction:column;">
                  <label style="display:block;font-size:0.85rem;color:#8b4513;font-weight:600;margin-bottom:6px;text-align:left;">Hora Apertura</label>
                  <input type="time" name="hora_apertura" value="${p.hora_apertura ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;box-sizing:border-box;">
                </div>
                <div style="flex:1;display:flex;flex-direction:column;">
                  <label style="display:block;font-size:0.85rem;color:#8b4513;font-weight:600;margin-bottom:6px;text-align:left;">Hora Cierre</label>
                  <input type="time" name="hora_cierre" value="${p.hora_cierre ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;box-sizing:border-box;">
                </div>
              </div>
            `;
          } else {
            // Usuario o Empleado
            camposFormulario = `
              <input type="text" name="nombre" placeholder="Nombre" value="${p.nombre ?? ''}" required style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <input type="text" name="apellido" placeholder="Apellido" value="${p.apellido ?? ''}" ${rol === 'empleado' ? 'required' : ''} style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <input type="text" name="cedula" placeholder="Cédula" value="${p.cedula ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <input type="text" name="telefono" placeholder="Teléfono" value="${p.telefono ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
              <input type="text" name="direccion" placeholder="Dirección" value="${p.direccion ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
            `;
          }
          
          modalContent.innerHTML = `
            <form id="editar-perfil-form" style="display:flex;flex-direction:column;align-items:center;gap:12px;">
              <div id="logo-preview-container" style="width:70px;height:70px;border-radius:50%;background:${p.logo ? `url('${p.logo}')` : '#fff'};background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #b48a5a55;position:relative;overflow:hidden;cursor:pointer;">
                ${!p.logo ? `<i class='bx ${rol === 'institucion' ? 'bx-building' : rol === 'empleado' ? 'bx-id-card' : 'bx-user'}' id="default-icon" style="font-size:3rem;color:#b48a5a;"></i>` : ''}
                <input type="file" id="logo-input" accept="image/*" style="display:none;">
              </div>
              <div style="font-size:0.8rem;color:#666;text-align:center;margin-top:-8px;">Click en la imagen para cambiarla</div>
              <div style="display:inline-block;margin-bottom:8px;padding:4px 12px;background:#28a745;color:white;border-radius:15px;font-size:0.85rem;font-weight:bold;">
                ${p.tipo_cuenta ?? 'Usuario'}
              </div>
              ${camposFormulario}
              <button type="submit" style="margin-top:10px;padding:10px 24px;border-radius:8px;background:#8b4513;color:#fffbe6;font-weight:bold;border:none;cursor:pointer;">Guardar Cambios</button>
            </form>
            <div style="margin-top:10px;font-size:0.95rem;color:#888;">Email: <b>${p.mail ?? '-'}</b></div>
          `;

          // Agregar manejador para el input de logo
          const logoPreview = document.getElementById("logo-preview-container");
          const logoInput = document.getElementById("logo-input");
          let logoRuta = p.logo || null; // Guardar la ruta actual del logo
          
          logoPreview.onclick = () => logoInput.click();
          
          logoInput.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
              alert('Por favor selecciona una imagen válida');
              return;
            }
            
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
              alert('La imagen es demasiado grande (máximo 5MB)');
              return;
            }
            
            // Mostrar preview
            const reader = new FileReader();
            reader.onload = (ev) => {
              logoPreview.style.backgroundImage = `url('${ev.target.result}')`;
              const icon = document.getElementById('default-icon');
              if (icon) icon.style.display = 'none';
            };
            reader.readAsDataURL(file);
            
            // Subir imagen al servidor
            const formData = new FormData();
            formData.append('logo', file);
            
            try {
              const uploadRes = await fetch("../php/subir_logo_perfil.php", {
                method: "POST",
                body: formData,
                credentials: "include",
                cache: "no-store"
              });
              
              const uploadResult = await uploadRes.json();
              console.log('Resultado de subida de logo:', uploadResult);
              
              if (uploadResult.success) {
                logoRuta = uploadResult.ruta;
              } else {
                alert('Error al subir la imagen: ' + (uploadResult.error || 'Error desconocido'));
              }
            } catch (error) {
              console.error('Error al subir logo:', error);
              alert('Error al subir la imagen');
            }
          };
          
          document.getElementById("editar-perfil-form").onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const payload = {};
            
            // Recoger datos del formulario
            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
              payload[key] = value;
            }
            
            // Agregar logo si se subió uno nuevo
            if (logoRuta) {
              payload.logo = logoRuta;
            }
            
            console.log('Enviando actualización de perfil:', payload); // Debug
            
            const upd = await fetch("../php/update_perfil.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              cache: "no-store",
              body: JSON.stringify(payload)
            });
            const result = await upd.json();
            console.log('Resultado de actualización:', result); // Debug
            
            if (result.success) {
              modalContent.innerHTML = "<div style='color:#28a745;text-align:center;padding:30px 0;'>¡Perfil actualizado!</div>";
              setTimeout(() => { 
                modal.style.display = "none"; 
                // Recargar la página para actualizar el logo en el círculo de perfil
                window.location.reload();
              }, 1200);
            } else {
              alert(result.message || "Error al actualizar");
            }
          };
        } else {
          console.error('Error al cargar perfil para editar:', data.message);
          modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>${data.message || "No se pudo cargar el perfil."}</div>`;
        }
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>Error al conectar con el servidor.</div>`;
      }
    };
  }
}

function setupPerfilModalHandlers() {
  const modal = document.getElementById("perfil-modal");
  if (!modal) return;
  const closeBtn = modal.querySelector(".close-perfil-modal");
  const bg = modal.querySelector(".perfil-modal-bg");
  if (closeBtn) closeBtn.onclick = () => { modal.style.display = "none"; };
  if (bg) bg.onclick = () => { modal.style.display = "none"; };
}

// ===== FUNCIONES PARA CREAR MASCOTA =====
function setupCrearMascotaHandlers() {
    const crearBtn = document.getElementById("crear-mascota-btn");
    const modal = document.getElementById("crear-mascota-modal");
    const form = document.getElementById("crear-mascota-form");
    const fotoInput = document.getElementById("foto_masc");
    const imagenPreview = document.getElementById("imagen-preview");
  
    // Abrir
    crearBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      modal?.style && (modal.style.display = "flex");
    });
  
    // Cerrar (X y fondo)
    modal?.querySelector(".close-crear-modal")?.addEventListener("click", cerrarModalCrear);
    modal?.querySelector(".crear-modal-bg")?.addEventListener("click", cerrarModalCrear);
  
    // Preview de imagen
    fotoInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) { imagenPreview && (imagenPreview.innerHTML = ""); return; }
      const reader = new FileReader();
      reader.onload = (ev) => { imagenPreview.innerHTML = `<img src="${ev.target.result}" alt="Vista previa">`; };
      reader.readAsDataURL(file);
    });
  
    // Envío del form
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      // Validación extra (además de required en HTML)
      const required = ["nom_masc","desc_masc","raza_masc","especie_masc","tamano_masc","edad_masc","salud_masc"];
      for (const name of required) {
        const el = form.querySelector(`[name="${name}"]`);
        if (!el || !String(el.value).trim()) { alert("Completa todos los campos."); return; }
      }
      const img = form.querySelector("#foto_masc");
      if (!img?.files?.length) { alert("Sube una imagen."); return; }
  
      await crearMascota();
    });
  }
  


async function crearMascota() {
  const form = document.getElementById("crear-mascota-form");
  
  if (!form) return;
  
  const submitBtn = form.querySelector(".submit-btn");

  // Deshabilitar botón de envío
  submitBtn.disabled = true;
  submitBtn.textContent = "Creando...";

  try {
    const formData = new FormData(form);
    
    const response = await fetch("../php/crearMascota.php", {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const result = await response.json();

    if (result.success) {
      // Mostrar mensaje de éxito
      alert("¡Mascota creada exitosamente!");
      
      // Cerrar modal y limpiar formulario
      cerrarModalCrear();
      
      // Recargar las mascotas
      await cargarMascotasDesdeDB();
    } else {
      alert("Error: " + (result.error || "No se pudo crear la mascota"));
    }
  } catch (error) {
    console.error("Error al crear mascota:", error);
    alert("Error de conexión. Inténtalo de nuevo.");
  } finally {
    // Rehabilitar botón
    submitBtn.disabled = false;
    submitBtn.textContent = "Crear Mascota";
  }
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function setupEventListeners() {
  searchBar.addEventListener('input', aplicarFiltros);
  filtersToggle.addEventListener('click', toggleFilters);
  especieFilter.addEventListener('change', actualizarRazas);
  especieFilter.addEventListener('change', aplicarFiltros);
  razaFilter.addEventListener('change', aplicarFiltros);
  tamanoFilter.addEventListener('change', aplicarFiltros);
  saludFilter.addEventListener('change', aplicarFiltros);
  clearFilters.addEventListener('click', limpiarFiltros);
  
  window.addEventListener('storage', function(e) {
    if (e.key === 'pets') {
      cardsGrid.innerHTML = '';
    }
  });
  
  window.addEventListener('adoptedPetsUpdated', function() {
    actualizarEstadosAdopcion();
  });
}

// ===== FUNCIONES DE FILTROS =====
function toggleFilters() {
  if (!filtersContainer || !filtersToggle) return;
  
  filtersContainer.classList.toggle('active');
  const icon = filtersToggle.querySelector('i');
  if (filtersContainer.classList.contains('active')) {
    if (icon) icon.className = 'bx bx-x';
    filtersToggle.innerHTML = '<i class="bx bx-x"></i> Cerrar Filtros';
  } else {
    if (icon) icon.className = 'bx bx-filter-alt';
    filtersToggle.innerHTML = '<i class="bx bx-filter-alt"></i> Filtros Avanzados';
  }
}

// ===== FUNCIONES PARA ACTUALIZAR OPCIONES DINÁMICAMENTE =====
function actualizarTodasLasOpciones() {
  actualizarEspecies();
  actualizarRazas();
  actualizarTamanos();
  actualizarEstadosSalud();
}

function actualizarEspecies() {
  const especieActual = especieFilter.value;
  especieFilter.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todas las especies';
  especieFilter.appendChild(defaultOption);

  const especiesFijas = ['Gato', 'Perro', 'Ave', 'Tortuga'];
  especiesFijas.forEach(especie => {
    const option = document.createElement('option');
    option.value = especie.toLowerCase();
    option.textContent = especie;
    especieFilter.appendChild(option);
  });

  const especiesUnicas = [...new Set(allPets.map(pet => pet.especie.toLowerCase()))]
    .filter(e => !especiesFijas.map(f => f.toLowerCase()).includes(e) && e !== 'otro');

  especiesUnicas.forEach(especie => {
    const option = document.createElement('option');
    option.value = especie;
    option.textContent = especie.charAt(0).toUpperCase() + especie.slice(1);
    especieFilter.appendChild(option);
  });

  if (especieActual && [...especieFilter.options].some(opt => opt.value === especieActual)) {
    especieFilter.value = especieActual;
  }
}

function actualizarTamanos() {
  const tamanoActual = tamanoFilter.value;
  tamanoFilter.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todos los tamaños';
  tamanoFilter.appendChild(defaultOption);

  const tamanosFijos = ['Chico', 'Mediano', 'Grande'];
  tamanosFijos.forEach(tamano => {
    const option = document.createElement('option');
    option.value = tamano.toLowerCase();
    option.textContent = tamano;
    tamanoFilter.appendChild(option);
  });

  // Obtener tamaños únicos de las mascotas cargadas
  const tamanosUnicos = [...new Set(allPets.map(pet => pet.tamano.toLowerCase()))]
    .filter(t => !tamanosFijos.map(f => f.toLowerCase()).includes(t) && t !== 'desconocida');

  tamanosUnicos.forEach(tamano => {
    const option = document.createElement('option');
    option.value = tamano;
    option.textContent = tamano.charAt(0).toUpperCase() + tamano.slice(1);
    tamanoFilter.appendChild(option);
  });

  if (tamanoActual && [...tamanoFilter.options].some(opt => opt.value === tamanoActual)) {
    tamanoFilter.value = tamanoActual;
  }
}

function actualizarEstadosSalud() {
  const saludActual = saludFilter.value;
  saludFilter.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todos los estados';
  saludFilter.appendChild(defaultOption);

  const estadosFijos = ['Horrible', 'Mal', 'Más o Menos', 'Bien', 'Impecable'];
  estadosFijos.forEach(estado => {
    const option = document.createElement('option');
    option.value = estado.toLowerCase();
    option.textContent = estado;
    saludFilter.appendChild(option);
  });

  // Obtener estados de salud únicos de las mascotas cargadas
  const estadosSaludUnicos = [...new Set(allPets.map(pet => pet.salud.toLowerCase()))]
    .filter(estado => !estadosFijos.map(e => e.toLowerCase()).includes(estado) && estado !== 'desconocida');

  estadosSaludUnicos.forEach(estado => {
    const option = document.createElement('option');
    option.value = estado;
    option.textContent = estado.charAt(0).toUpperCase() + estado.slice(1);
    saludFilter.appendChild(option);
  });

  if (saludActual && [...saludFilter.options].some(opt => opt.value === saludActual)) {
    saludFilter.value = saludActual;
  }
}

function actualizarRazas() {
  const razaActual = razaFilter.value;
  const especieSeleccionada = especieFilter.value;
  razaFilter.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todas las razas';
  razaFilter.appendChild(defaultOption);

  const razasFijas = ['Golden', 'Siames', 'Bulldog', 'Persa', 'Labrador', 'Caniche', 'Sin Raza', 'Egipcio'];
  razasFijas.forEach(raza => {
    const option = document.createElement('option');
    option.value = raza.toLowerCase();
    option.textContent = raza;
    razaFilter.appendChild(option);
  });

  const razasDisponibles = especieSeleccionada 
    ? allPets.filter(pet => pet.especie.toLowerCase() === especieSeleccionada).map(pet => pet.raza.toLowerCase())
    : allPets.map(pet => pet.raza.toLowerCase());

  const razasUnicas = [...new Set(razasDisponibles)]
    .filter(raza => !razasFijas.map(r => r.toLowerCase()).includes(raza) && raza !== 'desconocida');

  razasUnicas.forEach(raza => {
    const option = document.createElement('option');
    option.value = raza;
    option.textContent = raza.charAt(0).toUpperCase() + raza.slice(1);
    razaFilter.appendChild(option);
  });

  if (razaActual && [...razaFilter.options].some(opt => opt.value === razaActual)) {
    razaFilter.value = razaActual;
  }
}

function aplicarFiltros() {
  const textoBusqueda = searchBar.value.toLowerCase().trim();
  const especieFiltro = especieFilter.value.toLowerCase();
  const razaFiltro = razaFilter.value.toLowerCase();
  const tamanoFiltro = tamanoFilter.value.toLowerCase();
  const saludFiltro = saludFilter.value.toLowerCase();
  
  filteredPets = allPets.filter(pet => {
    const cumpleBusqueda = !textoBusqueda || 
      pet.name.toLowerCase().includes(textoBusqueda) ||
      pet.desc.toLowerCase().includes(textoBusqueda);
      
    const cumpleEspecie = !especieFiltro || 
      pet.especie.toLowerCase().includes(especieFiltro);
      
    const cumpleRaza = !razaFiltro || 
      pet.raza.toLowerCase().includes(razaFiltro);
      
    const cumpleTamano = !tamanoFiltro || 
      pet.tamano.toLowerCase().includes(tamanoFiltro);
      
    const cumpleSalud = !saludFiltro || 
      pet.salud.toLowerCase().includes(saludFiltro);
    
    return cumpleBusqueda && cumpleEspecie && cumpleRaza && cumpleTamano && cumpleSalud;
  });
  
  mostrarMascotas();
  actualizarFiltrosActivos();
}

function limpiarFiltros() {
  searchBar.value = '';
  especieFilter.value = '';
  razaFilter.value = '';
  tamanoFilter.value = '';
  saludFilter.value = '';
  actualizarTodasLasOpciones();
  aplicarFiltros();
}

function removerFiltro(tipoFiltro) {
  switch(tipoFiltro) {
    case 'especie':
      especieFilter.value = '';
      actualizarEspecies();
      break;
    case 'raza':
      razaFilter.value = '';
      actualizarRazas();
      break;
    case 'tamano':
      tamanoFilter.value = '';
      actualizarTamanos();
      break;
    case 'salud':
      saludFilter.value = '';
      actualizarEstadosSalud();
      break;
  }
  actualizarTodasLasOpciones();
  aplicarFiltros();
}

function actualizarFiltrosActivos() {
  activeFilters.innerHTML = '';
  
  const filtrosActivos = [];
  
  if (especieFilter.value) {
    filtrosActivos.push({
      tipo: 'Especie',
      valor: especieFilter.options[especieFilter.selectedIndex].text,
      filtro: 'especie'
    });
  }
  
  if (razaFilter.value) {
    filtrosActivos.push({
      tipo: 'Raza',
      valor: razaFilter.options[razaFilter.selectedIndex].text,
      filtro: 'raza'
    });
  }
  
  if (tamanoFilter.value) {
    filtrosActivos.push({
      tipo: 'Tamaño',
      valor: tamanoFilter.options[tamanoFilter.selectedIndex].text,
      filtro: 'tamano'
    });
  }
  
  if (saludFilter.value) {
    filtrosActivos.push({
      tipo: 'Salud',
      valor: saludFilter.options[saludFilter.selectedIndex].text,
      filtro: 'salud'
    });
  }
  
  filtrosActivos.forEach(filtro => {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `
      ${filtro.tipo}: ${filtro.valor}
      <span class="remove-tag" onclick="removerFiltro('${filtro.filtro}')">×</span>
    `;
    activeFilters.appendChild(tag);
  });
}

function cargarMascotas() {
  const pets = JSON.parse(localStorage.getItem("pets")) || [];
  allPets = pets;
  
  if (pets.length === 0) {
    mostrarMascotas(); // Usar mostrarMascotas para manejar el mensaje correctamente
  } else {
    actualizarTodasLasOpciones();
    aplicarFiltros();
  }
}

function ensureEmptyMessage(title, subtitle) {
  // Quita cualquier mensaje anterior dentro del grid
  if (cardsGrid) {
    cardsGrid.querySelectorAll('.no-pets-message').forEach(n => n.remove());
  }

  const mensaje = document.createElement('div');
  mensaje.className = 'no-pets-message';
  mensaje.innerHTML = `
    <i class='bx ${title.includes('filtro') ? 'bx-search' : 'bx-sad'}' style='font-size: 3rem; color: #b48a5a; display: block; margin-bottom: 10px;'></i>
    <h3>${title}</h3>
    <p>${subtitle}</p>
    ${title.includes('filtro') ? `
      <button onclick="limpiarFiltros()" style="margin-top: 10px; padding: 10px 20px; background: #b48a5a; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Limpiar filtros
      </button>` : ''
    }
  `;
  if (cardsGrid) {
    cardsGrid.appendChild(mensaje);
  }
}

function toggleEmptyState() {
  // Oculta cualquier “no-pets-message” estático que tengas en el HTML
  document.querySelectorAll('.no-pets-message').forEach(el => el.style.display = 'none');

  const hayFiltros = !!(searchBar.value || especieFilter.value || razaFilter.value || tamanoFilter.value || saludFilter.value);

  if (allPets.length === 0) {
    // No hay mascotas en la BD
    ensureEmptyMessage('No hay mascotas disponibles', 'Ve al formulario de adopción para agregar algunas mascotas.');
  } else if (hayFiltros && filteredPets.length === 0) {
    // Hay mascotas en BD pero 0 resultados por filtros
    ensureEmptyMessage('No se encontraron mascotas', 'No hay mascotas que coincidan con los filtros seleccionados');
  }
}

function removeEmptyState() {
  if (cardsGrid) {
    cardsGrid.querySelectorAll('.no-pets-message').forEach(n => n.remove());
  }
}

function mostrarMascotas() {
  // Limpiar render previo
  if (cardsGrid) {
    cardsGrid.innerHTML = '';
  }
  removeEmptyState();

  // Mientras se está cargando, no mostrar "no hay mascotas"
  if (!dataLoaded) return;

  // Si hay resultados, renderizar cards
  if (filteredPets.length > 0) {
    filteredPets.forEach(pet => crearCard(pet));
    return;
  }

  // Sin resultados: decidir entre "BD vacía" o "sin coincidencias por filtros"
  const hayFiltros = !!(
    searchBar.value || 
    especieFilter.value || 
    razaFilter.value || 
    tamanoFilter.value || 
    saludFilter.value
  );

  const msg = document.createElement('div');
  msg.className = 'no-pets-message';

  if (allPets.length === 0) {
    // Realmente no hay mascotas en BD
    msg.innerHTML = `
      <i class='bx bx-sad' style='font-size:3rem;color:#b48a5a;display:block;margin-bottom:10px;'></i>
      <h3>No hay mascotas disponibles</h3>
      <p>Ve al formulario de adopción para agregar algunas mascotas.</p>
    `;
  } else if (hayFiltros) {
    // Hay mascotas en BD, pero los filtros no dan coincidencias
    msg.innerHTML = `
      <i class='bx bx-search' style='font-size:3rem;color:#b48a5a;display:block;margin-bottom:10px;'></i>
      <h3>No se encontraron mascotas</h3>
      <p>No hay mascotas que coincidan con los filtros seleccionados.</p>
      <button onclick="limpiarFiltros()" style="margin-top:10px;padding:10px 20px;background:#b48a5a;color:#fff;border:none;border-radius:5px;cursor:pointer;">
        Limpiar filtros
      </button>
    `;
  }

  if (cardsGrid) {
    cardsGrid.appendChild(msg);
  }
}


function mostrarMensajeSinResultados() {
  const mensaje = document.createElement("div");
  mensaje.className = "no-pets-message";
  
  // Verificar si hay filtros activos
  const hayFiltros = searchBar.value || especieFilter.value || razaFilter.value || 
                   tamanoFilter.value || saludFilter.value;
  
  if (allPets.length === 0) {
    // Solo mostrar mensaje de "no hay mascotas" si realmente no hay ninguna en la base de datos
    mensaje.innerHTML = `
      <i class='bx bx-sad' style='font-size: 3rem; color: #b48a5a; display: block; margin-bottom: 10px;'></i>
      <h3>No hay mascotas disponibles</h3>
      <p>Ve al formulario de adopción para agregar algunas mascotas.</p>
    `;
    if (cardsGrid) {
      cardsGrid.appendChild(mensaje);
    }
  } else if (hayFiltros) {
    // Si hay filtros activos pero no hay resultados, mostrar mensaje de filtros
    mensaje.innerHTML = `
      <i class='bx bx-search' style='font-size: 3rem; color: #b48a5a; display: block; margin-bottom: 10px;'></i>
      <h3>No se encontraron mascotas</h3>
      <p>No hay mascotas que coincidan con los filtros seleccionados</p>
      <button onclick="limpiarFiltros()" style="margin-top: 10px; padding: 10px 20px; background: #b48a5a; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Limpiar filtros
      </button>
    `;
    if (cardsGrid) {
      cardsGrid.appendChild(mensaje);
    }
  }
  // Si no hay filtros y hay mascotas cargadas, no mostrar ningún mensaje
}


async function cargarMascotasDesdeDB() {
  dataLoaded = false; // empezamos en "cargando"

  try {
    console.log('Iniciando carga de mascotas desde DB...');
    const response = await fetch('../php/obtenerMascotas.php', { cache: 'no-store' });
    console.log('Respuesta recibida:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Resultado parseado:', result);

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      allPets = result.data.map(mascota => {
        // Usar ruta absoluta o convertir rutas relativas antiguas
        let imagePath = mascota.foto_masc || "/proyecto/img/default.svg";
        
        // Si la ruta no empieza con / (absoluta) ni con http, convertirla
        if (imagePath && !imagePath.startsWith('/') && !imagePath.startsWith('http')) {
          imagePath = '/proyecto/' + imagePath;
        }
        
        // Convertir ruta del logo del creador también
        let logoCreador = mascota.logo_creador || "";
        if (logoCreador && !logoCreador.startsWith('/') && !logoCreador.startsWith('http')) {
          logoCreador = '/proyecto/' + logoCreador;
        }
        
        return {
          id: mascota.id_masc,
          name: mascota.nom_masc || "Sin nombre",
          raza: mascota.raza_masc || "Desconocida",
          especie: mascota.especie_masc || "Otro",
          image: imagePath,
          edad: mascota.edad_masc || "Desconocida",
          salud: mascota.salud_masc || "Desconocida",
          tamano: mascota.tamano_masc || "Desconocida",
          desc: mascota.desc_masc || "Sin descripción",
          adoptado: mascota.estadoAdopt_masc ? 1 : 0,
          institucion: mascota.nomb_inst || "Institución no especificada",
          creado_por: mascota.creado_por || "",
          tipo_creador: mascota.tipo_creador || "",
          email_creador: mascota.email_creador || "",
          logo_creador: logoCreador
        };
      });

      console.log(`Cargadas ${allPets.length} mascotas desde la base de datos`);

      // Si tienes esta función, mantenla (usa ?. para no romper si no existe)
      actualizarTodasLasOpciones?.();

      // Prepara filteredPets según filtros actuales
      aplicarFiltros(); // (llama internamente a mostrarMascotas, pero aún dataLoaded=false)
    } else {
      console.log("No se encontraron mascotas en la base de datos");
      allPets = [];
      filteredPets = [];
      // NO renderizamos aquí. Esperamos al finally.
    }
  } catch (error) {
    console.error("Error al cargar mascotas:", error);
    allPets = [];
    filteredPets = [];
    // Tampoco renderizamos aquí. Esperamos al finally.
  } finally {
    dataLoaded = true; // marca el fin de la carga
    // Aseguramos un render final ya con dataLoaded=true:
    mostrarMascotas();
  }
}


function crearCard(pet) {
  const cardId = `card-${pet.id}`;
  const isAdopted = pet.adoptado == 1;
  
  // Determinar icono según el tipo de creador
  let creadorIcono = 'bx-user';
  if (pet.tipo_creador === 'institucion') {
    creadorIcono = 'bx-building';
  } else if (pet.tipo_creador === 'empleado') {
    creadorIcono = 'bx-id-card';
  }

  const card = document.createElement("div");
  card.className = "card";
  card.id = cardId;
  card.innerHTML = `
    ${pet.creado_por ? `
    <div class="card-creator" data-creator-email="${pet.email_creador || ''}" data-creator-type="${pet.tipo_creador || ''}">
      <div class="creator-avatar-container">
        <div class="creator-avatar" style="${pet.logo_creador ? `background-image: url('${pet.logo_creador}')` : ''}">
          ${!pet.logo_creador ? `<i class='bx ${creadorIcono}'></i>` : ''}
        </div>
      </div>
      <div class="creator-name">${pet.creado_por}</div>
      <div class="creator-type">${pet.tipo_creador === 'empleado' ? 'Empleado' : 'Institución'}</div>
    </div>
    ` : ''}
    <img src="${pet.image}" class="card-img" alt="${pet.name}" onerror="this.src='../img/default.svg'" style="margin-top:12px;">
    <div class="card-body">
      <div class="card-info">
        <i class='bx ${pet.especie.toLowerCase() === 'gato' ? 'bxs-cat' : pet.especie.toLowerCase() === 'perro' ? 'bxs-dog' : 'bx-paw'}'></i> 
        <div class="card-title">${pet.name}</div>
        <i class='bx ${pet.especie.toLowerCase() === 'gato' ? 'bxs-cat' : pet.especie.toLowerCase() === 'perro' ? 'bxs-dog' : 'bx-paw'}'></i> 
      </div>
      <div class="card-desc">${pet.desc}</div>
      <div class="card-details">
        <p><b>Raza:</b> ${pet.raza}</p>
        <p><b>Especie:</b> ${pet.especie}</p>
        <p><b>Tamaño:</b> ${pet.tamano}</p>
        <p><b>Salud:</b> ${pet.salud}</p>
        <p><b>Edad:</b> ${pet.edad}</p>
        <p><b>Institución:</b> ${pet.institucion || 'No especificada'}</p>
        ${pet.creado_por ? `<p><b>Creado por:</b> ${pet.creado_por} <span style="font-size:0.8em;color:#666;">(${pet.tipo_creador === 'empleado' ? 'Empleado' : 'Institución'})</span></p>` : ''}
        <p><b>Estado de adopción:</b> 
          <span class="adoption-status ${isAdopted ? 'adopted' : 'available'}">
            ${isAdopted ? 'Adoptado' : 'En Adopción'}
          </span>
        </p>
      </div>
      <button class="delete-button" data-pet-id="${pet.id}">
        <i class='bx bxs-trash'></i>
        Eliminar
      </button>
    </div>
  `;

  // Agregar evento de click al botón de eliminar
  const deleteBtn = card.querySelector('.delete-button');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => eliminarMascota(pet.id, pet.name));
  }
  
  // Agregar event listener al perfil del creador
  const creatorAvatar = card.querySelector('.card-creator');
  if (creatorAvatar) {
    creatorAvatar.addEventListener('click', async (e) => {
      e.stopPropagation();
      const creatorEmail = creatorAvatar.dataset.creatorEmail;
      const creatorType = creatorAvatar.dataset.creatorType;
      if (creatorEmail && creatorType) {
        await abrirPerfilCreador(creatorEmail, creatorType);
      }
    });
  }

  if (cardsGrid) {
    cardsGrid.appendChild(card);
  }
}

// ===== FUNCIÓN PARA ELIMINAR MASCOTA =====
async function eliminarMascota(id, nombre) {
  // Mostrar confirmación
  const confirmar = confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"?\n\nEsta acción no se puede deshacer.`);
  
  if (!confirmar) {
    return; // El usuario canceló
  }

  try {
    const response = await fetch('../php/eliminarMascota.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ id_masc: id })
    });

    const result = await response.json();

    if (result.success) {
      // Eliminar la card del DOM con animación
      const card = document.getElementById(`card-${id}`);
      if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
          card.remove();
          // Actualizar el array de mascotas
          allPets = allPets.filter(pet => pet.id !== id);
          filteredPets = filteredPets.filter(pet => pet.id !== id);
          
          // Si no quedan mascotas, mostrar mensaje
          if (filteredPets.length === 0) {
            mostrarMascotas();
          }
        }, 300);
      }
      
      alert('Mascota eliminada exitosamente');
    } else {
      alert('Error al eliminar: ' + (result.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error al eliminar mascota:', error);
    alert('Error de conexión al intentar eliminar la mascota');
  }
}

function generarPatitas() {
  var container = document.getElementById('paw-container');
  if (!container) {
    console.warn('No se encontró el contenedor de patitas (#paw-container)');
    return;
  }

  container.innerHTML = '';
  
  // Ajustar según el tamaño de pantalla
  var esMobile = window.innerWidth <= 768;
  var offsetLeft = esMobile ? 0 : sidebarWidth;
  var containerWidth = window.innerWidth - offsetLeft;
  var containerHeight = window.innerHeight;
  var posiciones = [];
  
  for(var i=0; i<cantidadPatitas; i++) {
    var paw = document.createElement('img');
    paw.src = '../img/pawBackground.png';
    paw.className = 'paw-bg';
    var tamano = tamanoMin + Math.random() * (tamanoMax - tamanoMin);
    paw.style.width = tamano + 'px';
    paw.style.height = tamano + 'px';
    var x, y, intentos = 0;
    do {
      x = offsetLeft + Math.random() * (containerWidth - tamano);
      y = headerHeight + Math.random() * (containerHeight - headerHeight - tamano);
      intentos++;
    } while(posiciones.some(function(p) {
      return Math.abs(p.x - x) < (p.size + tamano) && Math.abs(p.y - y) < (p.size + tamano);
    }) && intentos < 100);
    posiciones.push({x: x, y: y, size: tamano});
    paw.style.left = x + 'px';
    paw.style.top = y + 'px';
    paw.style.animationDuration = (3 + Math.random()*4) + 's';
    paw.style.animationDelay = (Math.random()*2) + 's';
    container.appendChild(paw);
  }
}

// Regenerar patitas al cambiar tamaño de ventana
window.addEventListener('resize', function() {
  clearTimeout(window.resizePatitasTimer);
  window.resizePatitasTimer = setTimeout(function() {
    generarPatitas();
  }, 250);
});

// ===== SISTEMA DE PERFIL DEL CREADOR Y CHAT =====

// Variables globales del chat
let currentConversacionId = null;
let currentChatUser = null;
let chatPollingInterval = null;

// Función para abrir perfil del creador
async function abrirPerfilCreador(email, tipo) {
  const modal = document.getElementById('creator-profile-modal');
  const modalContent = document.getElementById('creator-profile-content');
  
  if (!modal || !modalContent) return;
  
  modal.style.display = 'flex';
  modalContent.innerHTML = '<div style="text-align:center;padding:30px 0;">Cargando...</div>';
  
  try {
    console.log('Cargando perfil:', email, tipo);
    const url = `../php/get_perfil_usuario.php?email=${encodeURIComponent(email)}&tipo=${encodeURIComponent(tipo)}`;
    console.log('URL:', url);
    
    const res = await fetch(url, {
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('Respuesta status:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const text = await res.text();
    console.log('Respuesta texto:', text);
    
    const data = JSON.parse(text);
    
    if (data.success) {
      const p = data.perfil || {};
      const tipoUsuario = data.tipo || tipo;
      
      // Determinar icono según el tipo
      let icono = 'bx-user';
      if (tipoUsuario === 'institucion') {
        icono = 'bx-building';
      } else if (tipoUsuario === 'empleado') {
        icono = 'bx-id-card';
      }
      
      // Campos específicos según el tipo
      let camposExtra = '';
      if (tipoUsuario === 'institucion') {
        camposExtra = `
          <div class="creator-info-row"><span class="creator-info-label">Días:</span><span class="creator-info-value">${p.dia ?? '-'}</span></div>
          <div class="creator-info-row"><span class="creator-info-label">Horario:</span><span class="creator-info-value">${p.hora_apertura ?? '-'} - ${p.hora_cierre ?? '-'}</span></div>
        `;
      } else if (tipoUsuario === 'empleado') {
        camposExtra = `
          <div class="creator-info-row"><span class="creator-info-label">Tipo:</span><span class="creator-info-value">${p.tipo ?? '-'}</span></div>
          <div class="creator-info-row"><span class="creator-info-label">Institución:</span><span class="creator-info-value">${p.nomb_inst ?? '-'}</span></div>
        `;
      }
      
      // Verificar si el usuario está viendo su propio perfil
      const esPropioPerfil = sessionStorage.getItem('userEmail') === email;
      
      modalContent.innerHTML = `
        <div class="creator-profile-header">
          <div class="creator-profile-avatar" style="${p.logo ? `background-image: url('${p.logo}')` : ''}">
            ${!p.logo ? `<i class='bx ${icono}'></i>` : ''}
          </div>
          <div class="creator-profile-name">
            ${(p.nombre ?? '')} ${(p.apellido ?? '')}
          </div>
          <div class="creator-profile-type">${p.tipo_cuenta ?? 'Usuario'}</div>
        </div>
        <div class="creator-profile-info">
          <div class="creator-info-row"><span class="creator-info-label">Email:</span><span class="creator-info-value">${p.email ?? '-'}</span></div>
          <div class="creator-info-row"><span class="creator-info-label">Teléfono:</span><span class="creator-info-value">${p.telefono ?? '-'}</span></div>
          <div class="creator-info-row"><span class="creator-info-label">Dirección:</span><span class="creator-info-value">${p.direccion ?? '-'}</span></div>
          ${camposExtra}
        </div>
        ${esPropioPerfil ? `
        <div style="text-align:center;padding:15px;background:#e3f2fd;border-radius:10px;margin-top:15px;">
          <i class='bx bx-info-circle' style='font-size:2rem;color:#1976d2;'></i>
          <p style="color:#1976d2;font-weight:600;margin:10px 0 0 0;">Esta es tu publicación</p>
        </div>
        ` : `
        <div class="creator-actions">
          <button class="btn-chat" onclick="iniciarChat('${email}', '${tipoUsuario}', '${(p.nombre ?? '')} ${(p.apellido ?? '')}', '${p.logo ?? ''}')">
            <i class='bx bx-message-dots'></i>
            Enviar Mensaje
          </button>
        </div>
        `}
      `;
    } else {
      modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>${data.message || 'Error al cargar perfil'}</div>`;
    }
  } catch (error) {
    console.error('Error al cargar perfil del creador:', error);
    modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>Error al conectar con el servidor</div>`;
  }
}

// Setup handlers para modal de perfil del creador
document.addEventListener('DOMContentLoaded', function() {
  const creatorModal = document.getElementById('creator-profile-modal');
  if (creatorModal) {
    const closeBtn = creatorModal.querySelector('.close-creator-modal');
    const bg = creatorModal.querySelector('.creator-modal-bg');
    if (closeBtn) closeBtn.onclick = () => { creatorModal.style.display = 'none'; };
    if (bg) bg.onclick = () => { creatorModal.style.display = 'none'; };
  }
});

// ===== FUNCIONES DEL CHAT =====

// Iniciar chat con un usuario
async function iniciarChat(emailDestinatario, tipoDestinatario, nombreDestinatario, logoDestinatario) {
  try {
    // Cerrar modal de perfil si está abierto
    const creatorModal = document.getElementById('creator-profile-modal');
    if (creatorModal) creatorModal.style.display = 'none';
    
    // Crear o obtener conversación
    const res = await fetch('../php/crear_conversacion.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        email_destinatario: emailDestinatario,
        tipo_destinatario: tipoDestinatario
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      currentConversacionId = data.conversacion_id;
      currentChatUser = {
        email: emailDestinatario,
        tipo: tipoDestinatario,
        nombre: nombreDestinatario,
        logo: logoDestinatario
      };
      
      // Abrir modal de chat
      abrirModalChat();
      
      // Cargar mensajes
      await cargarMensajes();
      
      // Iniciar polling
      if (chatPollingInterval) clearInterval(chatPollingInterval);
      chatPollingInterval = setInterval(cargarMensajes, 3000);
      
    } else {
      alert('Error al iniciar chat: ' + (data.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error al iniciar chat:', error);
    alert('Error al iniciar chat');
  }
}

// Abrir modal de chat
function abrirModalChat() {
  const modal = document.getElementById('chat-modal');
  if (!modal) return;
  
  // Configurar información del usuario
  const userName = document.getElementById('chat-user-name');
  const userType = document.getElementById('chat-user-type');
  const userAvatar = document.getElementById('chat-user-avatar');
  
  if (userName) userName.textContent = currentChatUser.nombre;
  if (userType) userType.textContent = currentChatUser.tipo === 'empleado' ? 'Empleado' : 'Institución';
  
  if (userAvatar) {
    if (currentChatUser.logo) {
      userAvatar.style.backgroundImage = `url('${currentChatUser.logo}')`;
      userAvatar.innerHTML = '';
    } else {
      userAvatar.style.backgroundImage = '';
      const icono = currentChatUser.tipo === 'institucion' ? 'bx-building' : 'bx-id-card';
      userAvatar.innerHTML = `<i class='bx ${icono}'></i>`;
    }
  }
  
  modal.style.display = 'flex';
}

// Cerrar modal de chat
function cerrarModalChat() {
  const modal = document.getElementById('chat-modal');
  if (modal) modal.style.display = 'none';
  
  // Detener polling
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
  
  currentConversacionId = null;
  currentChatUser = null;
}

// Cargar mensajes del chat
async function cargarMensajes() {
  if (!currentConversacionId) return;
  
  try {
    const res = await fetch(`../php/chat_api.php?conversacion_id=${currentConversacionId}`, {
      credentials: 'include',
      cache: 'no-store'
    });
    
    const data = await res.json();
    
    if (data.success) {
      renderizarMensajes(data.mensajes);
    }
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
  }
}

// Renderizar mensajes en el chat
function renderizarMensajes(mensajes) {
  const chatWindow = document.getElementById('chat-window');
  if (!chatWindow) return;
  
  // Guardar posición de scroll actual
  const estabaBajo = chatWindow.scrollHeight - chatWindow.scrollTop <= chatWindow.clientHeight + 50;
  
  chatWindow.innerHTML = '';
  
  if (mensajes.length === 0) {
    chatWindow.innerHTML = '<div class="no-messages">No hay mensajes aún. ¡Inicia la conversación!</div>';
    return;
  }
  
  mensajes.forEach(mensaje => {
    const esPropio = mensaje.email_emisor === sessionStorage.getItem('userEmail');
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje ${esPropio ? 'propio' : 'ajeno'}`;
    
    mensajeDiv.innerHTML = `
      <div>${escapeHtml(mensaje.contenido)}</div>
      <span class="timestamp">${formatearTimestamp(mensaje.created_at)}</span>
    `;
    
    chatWindow.appendChild(mensajeDiv);
  });
  
  // Auto-scroll si estaba abajo
  if (estabaBajo) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

// Enviar mensaje
async function enviarMensaje() {
  if (!currentConversacionId) return;
  
  const input = document.getElementById('chat-message-input');
  if (!input) return;
  
  const contenido = input.value.trim();
  if (!contenido) return;
  
  try {
    const res = await fetch('../php/chat_api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        conversacion_id: currentConversacionId,
        contenido: contenido
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      input.value = '';
      await cargarMensajes();
    } else {
      alert('Error al enviar mensaje: ' + (data.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    alert('Error al enviar mensaje');
  }
}

// Función para escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Función para formatear timestamp
function formatearTimestamp(timestamp) {
  const fecha = new Date(timestamp);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  
  let prefijo = '';
  if (fecha.toDateString() === hoy.toDateString()) {
    prefijo = 'Hoy ';
  } else if (fecha.toDateString() === ayer.toDateString()) {
    prefijo = 'Ayer ';
  } else {
    prefijo = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ';
  }
  
  return prefijo + fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ===== FUNCIONES PARA LISTA DE CHATS =====

// Abrir lista de conversaciones
async function abrirListaChats() {
  const modal = document.getElementById('chats-list-modal');
  const modalContent = document.getElementById('chats-list-content');
  
  if (!modal || !modalContent) return;
  
  modal.style.display = 'flex';
  modalContent.innerHTML = '<div style="text-align:center;padding:30px 0;">Cargando conversaciones...</div>';
  
  try {
    const res = await fetch('../php/get_conversaciones.php', {
      credentials: 'include',
      cache: 'no-store'
    });
    
    const data = await res.json();
    
    if (data.success) {
      if (data.conversaciones.length === 0) {
        modalContent.innerHTML = `
          <div class="no-chats-message">
            <i class='bx bx-message-x'></i>
            <h3>No tienes conversaciones</h3>
            <p>Cuando inicies un chat con un usuario, aparecerá aquí.</p>
          </div>
        `;
      } else {
        let html = '';
        data.conversaciones.forEach(conv => {
          // Determinar icono según el tipo
          let icono = 'bx-user';
          if (conv.tipo_otro === 'institucion') {
            icono = 'bx-building';
          } else if (conv.tipo_otro === 'empleado') {
            icono = 'bx-id-card';
          }
          
          // Mostrar badge si hay mensajes no leídos
          const badge = conv.no_leidos > 0 ? '<div class="chat-item-badge"></div>' : '';
          
          html += `
            <div class="chat-item" data-conversacion-id="${conv.conversacion_id}" data-email="${conv.email_otro}" data-tipo="${conv.tipo_otro}" data-nombre="${conv.nombre_otro}" data-logo="${conv.logo_otro || ''}">
              ${badge}
              <div class="chat-item-avatar" style="${conv.logo_otro ? `background-image: url('${conv.logo_otro}')` : ''}">
                ${!conv.logo_otro ? `<i class='bx ${icono}'></i>` : ''}
              </div>
              <div class="chat-item-info">
                <div class="chat-item-name">${conv.nombre_otro}</div>
                <div class="chat-item-last-message">${conv.ultimo_mensaje || 'Sin mensajes'}</div>
              </div>
            </div>
          `;
        });
        
        modalContent.innerHTML = html;
        
        // Agregar event listeners a cada item de chat
        document.querySelectorAll('.chat-item').forEach(item => {
          item.addEventListener('click', function() {
            const conversacionId = this.getAttribute('data-conversacion-id');
            const email = this.getAttribute('data-email');
            const tipo = this.getAttribute('data-tipo');
            const nombre = this.getAttribute('data-nombre');
            const logo = this.getAttribute('data-logo');
            
            abrirChatDesdeListado(conversacionId, email, tipo, nombre, logo);
          });
        });
      }
    } else {
      modalContent.innerHTML = `
        <div style="text-align:center;padding:30px 0;color:#e63946;">
          Error al cargar conversaciones
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar conversaciones:', error);
    modalContent.innerHTML = `
      <div style="text-align:center;padding:30px 0;color:#e63946;">
        Error de conexión
      </div>
    `;
  }
}

// Abrir chat desde el listado
function abrirChatDesdeListado(conversacionId, email, tipo, nombre, logo) {
  // Cerrar modal de lista de chats
  const chatsListModal = document.getElementById('chats-list-modal');
  if (chatsListModal) chatsListModal.style.display = 'none';
  
  // Configurar el chat actual
  currentConversacionId = conversacionId;
  currentChatUser = {
    email: email,
    tipo: tipo,
    nombre: nombre,
    logo: logo
  };
  
  // Abrir modal de chat
  abrirModalChat();
  
  // Cargar mensajes
  cargarMensajes();
  
  // Iniciar polling
  if (chatPollingInterval) clearInterval(chatPollingInterval);
  chatPollingInterval = setInterval(cargarMensajes, 3000);
}

// Setup handlers para modal de lista de chats
document.addEventListener('DOMContentLoaded', function() {
  const chatsListModal = document.getElementById('chats-list-modal');
  if (chatsListModal) {
    const closeBtn = chatsListModal.querySelector('.close-chats-list-modal');
    const bg = chatsListModal.querySelector('.chats-list-modal-bg');
    if (closeBtn) closeBtn.onclick = () => { chatsListModal.style.display = 'none'; };
    if (bg) bg.onclick = () => { chatsListModal.style.display = 'none'; };
  }
});

// Setup handlers para modal de chat
document.addEventListener('DOMContentLoaded', function() {
  const chatModal = document.getElementById('chat-modal');
  if (chatModal) {
    const closeBtn = chatModal.querySelector('.close-chat-modal');
    const bg = chatModal.querySelector('.chat-modal-bg');
    const sendBtn = document.getElementById('chat-send-button');
    const input = document.getElementById('chat-message-input');
    
    if (closeBtn) closeBtn.onclick = cerrarModalChat;
    if (bg) bg.onclick = cerrarModalChat;
    if (sendBtn) sendBtn.onclick = enviarMensaje;
    
    if (input) {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          enviarMensaje();
        }
      });
    }
  }
});
