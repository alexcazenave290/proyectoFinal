const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const seguimientosGrid = document.getElementById("seguimientosGrid");
const loading = document.getElementById("loading");
const noSeguimientos = document.getElementById("no-seguimientos");
const loginBtn = document.getElementById("login-btn");

// Menú responsive
menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));

// Verificar sesión al cargar
document.addEventListener("DOMContentLoaded", async function() {
    await verificarSesion();
    await cargarSeguimientos();
});

// Verificar si hay sesión activa
async function verificarSesion() {
    try {
        const response = await fetch('/proyecto/php/session_status.php');
        const data = await response.json();
        
        if (data.logged) {
            // Usuario logeado, ocultar botón de acceder
            loginBtn.style.display = 'none';
        } else {
            // Usuario no logeado, mostrar botón
            loginBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
    }
}

// Cargar seguimientos desde la base de datos
async function cargarSeguimientos() {
    try {
        loading.style.display = 'block';
        noSeguimientos.style.display = 'none';
        
        const response = await fetch('/proyecto/php/get_seguimientos.php');
        const data = await response.json();
        
        console.log('📦 Seguimientos recibidos:', data);
        
        if (!data.success) {
            console.error('Error:', data.error);
            mostrarError();
            return;
        }
        
        const seguimientos = data.seguimientos;
        
        loading.style.display = 'none';
        
        if (seguimientos.length === 0) {
            noSeguimientos.style.display = 'block';
            return;
        }
        
        // Renderizar seguimientos
        seguimientos.forEach(seguimiento => {
            const card = crearCardSeguimiento(seguimiento);
            seguimientosGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error al cargar seguimientos:', error);
        loading.style.display = 'none';
        mostrarError();
    }
}

// Crear card de seguimiento
function crearCardSeguimiento(seg) {
    const card = document.createElement('div');
    card.className = 'seguimiento-card';
    
    // Determinar qué imagen mostrar en el header
    const imagenHeader = seg.foto_seguimiento || seg.foto_masc || '/proyecto/img/default.svg';
    
    // Obtener clase de salud
    const claseSalud = obtenerClaseSalud(seg.estado_salud);
    
    // Formatear fecha
    const fechaFormateada = formatearFecha(seg.fecha_seguimiento);
    
    // Nombre del adoptante
    const nombreAdoptante = `${seg.nom_us || ''} ${seg.apell_us || ''}`.trim() || 'Adoptante';
    const inicialAdoptante = (seg.nom_us || 'A').charAt(0).toUpperCase();
    
    // Avatar del adoptante
    const avatarAdoptante = seg.logo_us 
        ? `<img src="${seg.logo_us}" alt="${nombreAdoptante}" class="adoptante-avatar">`
        : `<div class="adoptante-avatar">${inicialAdoptante}</div>`;
    
    card.innerHTML = `
        <div class="card-header">
            <img src="${imagenHeader}" alt="Seguimiento de ${seg.nom_masc}">
            <div class="card-badge">
                <i class='bx bx-calendar'></i>
                ${fechaFormateada}
            </div>
        </div>
        
        <div class="card-body">
            <div class="card-mascota-info">
                <img src="${seg.foto_masc || '/proyecto/img/default.svg'}" 
                     alt="${seg.nom_masc}" 
                     class="mascota-mini-foto">
                <div class="mascota-mini-info">
                    <h4>${seg.nom_masc}</h4>
                    <p>${seg.especie_masc}${seg.raza_masc ? ' • ' + seg.raza_masc : ''}</p>
                </div>
            </div>
            
            <div class="card-info-row">
                <i class='bx bx-heart-circle'></i>
                <div>
                    <strong>Estado de salud:</strong>
                    <span class="salud-badge ${claseSalud}">${seg.estado_salud}</span>
                </div>
            </div>
            
            ${seg.comportamiento ? `
                <div class="card-text-block">
                    <strong><i class='bx bx-happy'></i> Comportamiento:</strong>
                    ${seg.comportamiento}
                </div>
            ` : ''}
            
            ${seg.observaciones ? `
                <div class="card-text-block">
                    <strong><i class='bx bx-note'></i> Observaciones:</strong>
                    ${seg.observaciones}
                </div>
            ` : ''}
        </div>
        
        <div class="card-footer">
            ${avatarAdoptante}
            <div class="adoptante-info">
                <p>Publicado por</p>
                <h5>${nombreAdoptante}</h5>
            </div>
            <div class="fecha-info">
                <i class='bx bx-time-five'></i>
                ${calcularTiempoTranscurrido(seg.fecha_registro)}
            </div>
        </div>
    `;
    
    return card;
}

// Obtener clase CSS según estado de salud
function obtenerClaseSalud(estado) {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('excelente')) return 'salud-excelente';
    if (estadoLower.includes('bueno') || estadoLower.includes('bien')) return 'salud-bueno';
    if (estadoLower.includes('regular')) return 'salud-regular';
    if (estadoLower.includes('atención') || estadoLower.includes('atencion')) return 'salud-atencion';
    return 'salud-bueno';
}

// Formatear fecha (DD/MM/YYYY)
function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    const f = new Date(fecha + 'T00:00:00');
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const año = f.getFullYear();
    return `${dia}/${mes}/${año}`;
}

// Calcular tiempo transcurrido
function calcularTiempoTranscurrido(fechaRegistro) {
    if (!fechaRegistro) return 'Hace tiempo';
    
    const ahora = new Date();
    const fecha = new Date(fechaRegistro);
    const diff = ahora - fecha;
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 30) return `Hace ${dias}d`;
    
    return formatearFecha(fechaRegistro.split(' ')[0]);
}

// Mostrar mensaje de error
function mostrarError() {
    loading.style.display = 'none';
    noSeguimientos.innerHTML = `
        <i class='bx bx-error-circle'></i>
        <p>Error al cargar los seguimientos. Intenta recargar la página.</p>
    `;
    noSeguimientos.style.display = 'block';
}

