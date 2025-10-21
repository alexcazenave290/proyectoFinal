// ===== VARIABLES GLOBALES =====
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

const cantidadPatitas = 15;
const tamanoMin = 30;
const tamanoMax = 70;
const sidebarWidth = 200; 
const headerHeight = 90;

let cardCounter = 0;
let allPets = [];
let filteredPets = [];



fetch("session_status.php").then(res => res.json()).then(data => {
  if (data.logged) {
    document.getElementById("profile-icon").style.display = "block";
  }
});

// ===== FUNCIONES AL CARGAR LA PAGINA =====
document.addEventListener('DOMContentLoaded', () => {
    cargarMascotasDesdeDB(); 
    generarPatitas();
    setupEventListeners();
    actualizarTodasLasOpciones();
});

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
    filtersContainer.classList.toggle('active');
    const icon = filtersToggle.querySelector('i');
    if (filtersContainer.classList.contains('active')) {
        icon.className = 'bx bx-x';
        filtersToggle.innerHTML = '<i class="bx bx-x"></i> Cerrar Filtros';
    } else {
        icon.className = 'bx bx-filter-alt';
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

    // Primera opción fija
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todas las especies';
    especieFilter.appendChild(defaultOption);

    // Especies fijas predefinidas
    const especiesFijas = ['Gato', 'Perro', 'Ave', 'Tortuga'];
    especiesFijas.forEach(especie => {
        const option = document.createElement('option');
        option.value = especie.toLowerCase();
        option.textContent = especie;
        especieFilter.appendChild(option);
    });

    // Especies únicas desde allPets
    const especiesUnicas = [...new Set(allPets.map(pet => pet.especie.toLowerCase()))]
        .filter(e => !especiesFijas.map(f => f.toLowerCase()).includes(e));

    especiesUnicas.forEach(especie => {
        const option = document.createElement('option');
        option.value = especie;
        option.textContent = especie.charAt(0).toUpperCase() + especie.slice(1);
        especieFilter.appendChild(option);
    });

    // Mantener selección anterior si sigue existiendo
    if (especieActual && [...especieFilter.options].some(opt => opt.value === especieActual)) {
        especieFilter.value = especieActual;
    }
}


function actualizarTamanos() {
    const tamanoActual = tamanoFilter.value;
    tamanoFilter.innerHTML = '';

    // Primera opción fija
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todos los tamaños';
    tamanoFilter.appendChild(defaultOption);

    // Opciones fijas predefinidas
    const tamanosFijos = ['Chico', 'Mediano', 'Grande'];
    tamanosFijos.forEach(tamano => {
        const option = document.createElement('option');
        option.value = tamano.toLowerCase();
        option.textContent = tamano;
        tamanoFilter.appendChild(option);
    });

    // Obtener los tamaños desde la base de datos
    fetch('get_filtros.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los tamaños');
            }
            return response.json();
        })
        .then(tamanosUnicos => {
            // Evitar duplicados de los tamaños fijos
            const tamanosFiltrados = tamanosUnicos.filter(
                t => !tamanosFijos.map(f => f.toLowerCase()).includes(t.toLowerCase())
            );

            tamanosFiltrados.forEach(tamano => {
                const option = document.createElement('option');
                option.value = tamano.toLowerCase();
                option.textContent = tamano.charAt(0).toUpperCase() + tamano.slice(1);
                tamanoFilter.appendChild(option);
            });

            // Mantener el tamaño previamente seleccionado si aún existe
            if (
                tamanoActual &&
                [...tamanoFilter.options].some(opt => opt.value === tamanoActual)
            ) {
                tamanoFilter.value = tamanoActual;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function actualizarEstadosSalud() {
    const saludActual = saludFilter.value;
    saludFilter.innerHTML = '';

    // Primera opción fija
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todos los estados';
    saludFilter.appendChild(defaultOption);

    // Opciones personalizadas fijas
    const estadosFijos = ['Horrible', 'Mal', 'Más o Menos', 'Bien', 'Impecable'];
    estadosFijos.forEach(estado => {
        const option = document.createElement('option');
        option.value = estado.toLowerCase();
        option.textContent = estado;
        saludFilter.appendChild(option);
    });

    // Estados únicos desde la base de datos o array
    const estadosSaludUnicos = [...new Set(allPets.map(pet => pet.salud.toLowerCase()))]
        .filter(estado => !estadosFijos.map(e => e.toLowerCase()).includes(estado));

    estadosSaludUnicos.forEach(estado => {
        const option = document.createElement('option');
        option.value = estado;
        option.textContent = estado.charAt(0).toUpperCase() + estado.slice(1);
        saludFilter.appendChild(option);
    });

    // Mantener el estado anterior si sigue existiendo
    if (saludActual && [...saludFilter.options].some(opt => opt.value === saludActual)) {
        saludFilter.value = saludActual;
    }
}


function actualizarRazas() {
    const razaActual = razaFilter.value;
    const especieSeleccionada = especieFilter.value;
    razaFilter.innerHTML = '';

    // Primera opción fija
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todas las razas';
    razaFilter.appendChild(defaultOption);

    // RAZAS PERSONALIZADAS (fijas al inicio)
    const razasFijas = ['Golden', 'Siames', 'Bulldog', 'Persa', 'Labrador', 'Caniche', 'Sin Raza', 'Egipcio'];
    razasFijas.forEach(raza => {
        const option = document.createElement('option');
        option.value = raza.toLowerCase();
        option.textContent = raza;
        razaFilter.appendChild(option);
    });

    // RAZAS DISPONIBLES SEGÚN FILTRO
    const razasDisponibles = especieSeleccionada 
        ? allPets.filter(pet => pet.especie.toLowerCase() === especieSeleccionada)
                 .map(pet => pet.raza.toLowerCase())
        : allPets.map(pet => pet.raza.toLowerCase());

    // Eliminar duplicados y evitar repetir las razas fijas
    const razasUnicas = [...new Set(razasDisponibles)]
        .filter(raza => !razasFijas.map(r => r.toLowerCase()).includes(raza));

    // Agregar las razas del sistema
    razasUnicas.forEach(raza => {
        const option = document.createElement('option');
        option.value = raza;
        option.textContent = raza.charAt(0).toUpperCase() + raza.slice(1);
        razaFilter.appendChild(option);
    });

    // Mantener la selección anterior si sigue existiendo
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
        mostrarMensajeVacio();
    } else {
        actualizarTodasLasOpciones();
        aplicarFiltros();
    }
}

function mostrarMascotas() {
    cardsGrid.innerHTML = '';
    cardCounter = 0;
    
    if (filteredPets.length === 0) {
        mostrarMensajeSinResultados();
    } else {
        filteredPets.forEach(pet => crearCard(pet));
    }
    marcarLikesEnCards();
}

function mostrarMensajeSinResultados() {
    const mensaje = document.createElement("div");
    mensaje.className = "no-pets-message";
    
    const hayFiltros = searchBar.value || especieFilter.value || razaFilter.value || 
                     tamanoFilter.value || saludFilter.value;
    
    if (hayFiltros) {
        mensaje.innerHTML = `
            <i class='bx bx-search' style='font-size: 3rem; color: #b48a5a; display: block; margin-bottom: 10px;'></i>
            <h3>No se encontraron mascotas</h3>
            <p>No hay mascotas que coincidan con los filtros seleccionados</p>
            <button onclick="limpiarFiltros()" style="margin-top: 10px; padding: 10px 20px; background: #b48a5a; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Limpiar filtros
            </button>
        `;
    } else {
        mensaje.innerHTML = `
            <i class='bx bx-sad' style='font-size: 3rem; color: #b48a5a; display: block; margin-bottom: 10px;'></i>
            <h3>No hay mascotas disponibles</h3>
            <p>Ve al formulario de adopción para agregar algunas mascotas.</p>
        `;
    }
    
    cardsGrid.appendChild(mensaje);
}

function mostrarMensajeVacio() {
    const mensaje = document.createElement("div");
    mensaje.className = "no-pets-message";
    mensaje.innerHTML = `
        <i class='bx bx-sad' style='font-size: 3rem; color: #b48a5a; display: block; margin-bottom: 10px;'></i>
        <h3>No hay mascotas disponibles</h3>
        <p>Ve al formulario de adopción para agregar algunas mascotas.</p>
    `;
    cardsGrid.appendChild(mensaje);
}



async function cargarMascotasDesdeDB() {
    try {
        const response = await fetch('obtenerMascotas.php');
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            allPets = result.data.map(mascota => ({
                id: mascota.id_masc,
                name: mascota.nom_masc || "Sin nombre",
                raza: mascota.raza_masc || "Desconocida",
                especie: mascota.especie_masc || "Otro",
                image: mascota.foto_masc ? mascota.foto_masc : "img/default.jpg",
                edad: mascota.edad_masc || "Desconocida",
                salud: mascota.salud_masc || "Desconocida",
                tamano: mascota.tamano_masc || "Desconocida",
                desc: mascota.desc_masc || "Sin descripción",
                adoptado: mascota.estadoAdopt_masc || 0
            }));
            actualizarTodasLasOpciones();
            aplicarFiltros();
        } else {
            mostrarMensajeVacio();
        }
    } catch (error) {
        console.error("Error al cargar mascotas:", error);
        mostrarMensajeVacio();
    }
}


function crearCard(pet) {
    const cardId = `card-${pet.id}`;
    let isSaved = false;
    let isLiked = false;
    const isAdopted = pet.adoptado == 1;

    const card = document.createElement("div");
    card.className = "card";
    card.id = cardId;
    card.innerHTML = `
        <div class="card-header">
            <i class='bx bx-bookmark card-bookmark'></i>
            <div class="card-actions">
                <i class='bx bx-message-detail card-comment'></i>
                <i class='bx bx-heart card-like' data-id-publ="${pet.id}"></i>
            </div>
        </div>
        <img src="${pet.image}" class="card-img" alt="${pet.name}">
        <div class="card-body">
            <div class="card-info">
                <i class='bx bxs-cat'></i> 
                <div class="card-title">${pet.name}</div>
                <i class='bx bxs-dog'></i> 
            </div>
            <div class="card-desc">${pet.desc}</div>
            <div class="card-details">
                <p><b>Raza:</b> ${pet.raza}</p>
                <p><b>Especie:</b> ${pet.especie}</p>
                <p><b>Tamaño:</b> ${pet.tamano}</p>
                <p><b>Salud:</b> ${pet.salud}</p>
                <p><b>Edad:</b> ${pet.edad}</p>
                <p><b>Estado de adopción:</b> 
                    <span class="adoption-status ${isAdopted ? 'adopted' : 'available'}">
                        ${isAdopted ? 'Adoptado' : 'En Adopción'}
                    </span>
                </p>
            </div>
            <button class="adopt-button ${isAdopted ? 'adopted' : ''}" ${isAdopted ? 'disabled' : ''}>
                <i class='bx ${isAdopted ? 'bx-check-circle' : 'bxs-heart'}'></i>
                ${isAdopted ? 'Adoptado' : 'Adoptar'}
            </button>
            <div class="comment-section">
                <div class="comment-input-container">
                    <textarea placeholder="Escribe un comentario sobre ${pet.name}..." class="comment-input"></textarea>
                    <button class="comment-btn">
                        <i class='bx bx-send'></i>
                        Enviar
                    </button>
                </div>
                <div class="comment-list"></div>
            </div>
        </div>
    `;

    cardsGrid.appendChild(card);
}


function generarPatitas() {
    var container = document.getElementById('paw-container');
    if (!container) {
        console.warn('No se encontró el contenedor de patitas (#paw-container)');
        return;
    }

    container.innerHTML = '';
    var containerWidth = window.innerWidth - sidebarWidth;
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
            x = sidebarWidth + Math.random() * (containerWidth - tamano);
            y = headerHeight + Math.random() * (containerHeight - headerHeight - tamano);
            intentos++;
        } while(posiciones.some(function(p) {
            return Math.abs(p.x - x) < (p.size + tamano) && Math.abs(p.y - y) < (p.size + tamano);
        }) && intentos < 100);
        posiciones.push({x: x, y: y, size: tamano});
        paw.style.left = x + 'px';
        paw.style.top = y + 'px';
        paw.style.animationDuration = (2 + Math.random()*3) + 's';
        container.appendChild(paw);
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    const loginBtn = document.getElementById("login-btn");
    const profileIcon = document.getElementById("profile-icon");

    try {
        const res = await fetch("session_status.php");
        const data = await res.json();
        if (data.logged) {
            loginBtn.style.display = "none";
            profileIcon.style.display = "block";
        } else {
            loginBtn.style.display = "block";
            profileIcon.style.display = "none";
        }
    } catch (e) {
        loginBtn.style.display = "block";
        profileIcon.style.display = "none";
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const loginBtn = document.getElementById("login-btn");
    const profileIcon = document.getElementById("profile-icon");
    const profileCircle = document.getElementById("profile-circle");
    const profileMenu = document.getElementById("profile-menu");

    try {
        const res = await fetch("session_status.php");
        const data = await res.json();
        if (data.logged) {
            loginBtn.style.display = "none";
            profileIcon.style.display = "block";
        } else {
            loginBtn.style.display = "block";
            profileIcon.style.display = "none";
        }
    } catch (e) {
        loginBtn.style.display = "block";
        profileIcon.style.display = "none";
    }

    // Toggle menú de perfil
    profileCircle.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("open");
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener("click", () => {
        profileMenu.classList.remove("open");
    });

    // Opciones del menú
    document.getElementById("logout").onclick = async () => {
        await fetch("logout.php");
        window.location.reload();
    };
});

document.getElementById("ver-perfil").onclick = async () => {
    // Mostrar modal
    const modal = document.getElementById("perfil-modal");
    const modalContent = document.getElementById("perfil-modal-content");
    modal.style.display = "flex";
    modalContent.innerHTML = "<div style='text-align:center;padding:30px 0;'>Cargando...</div>";

    // Traer datos del perfil
    try {
        const res = await fetch("get_perfil.php");
        const data = await res.json();
        if (data.success) {
            const p = data.perfil;
            modalContent.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:18px;">
                    <div style="width:70px;height:70px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #b48a5a55;">
                        <i class='bx bx-user' style="font-size:3rem;color:#b48a5a;"></i>
                    </div>
                    <div style="font-size:1.3rem;font-weight:bold;color:#8b4513;margin-top:10px;">${p.nom_us ?? ''} ${p.apell_us ?? ''}</div>
                </div>
                <div class="perfil-info-row"><span class="perfil-info-label">Gmail:</span><span class="perfil-info-value">${p.mail_us}</span></div>
                <div class="perfil-info-row"><span class="perfil-info-label">CI:</span><span class="perfil-info-value">${p.ci_us ?? '-'}</span></div>
                <div class="perfil-info-row"><span class="perfil-info-label">Teléfono:</span><span class="perfil-info-value">${p.tel_us ?? '-'}</span></div>
                <div class="perfil-info-row"><span class="perfil-info-label">Dirección:</span><span class="perfil-info-value">${p.direccion_us ?? '-'}</span></div>
            `;
        } else {
            modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>${data.message || "No se pudo cargar el perfil."}</div>`;
        }
    } catch (e) {
        modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>Error al conectar con el servidor.</div>`;
    }
};

// Cerrar modal al clickear la X o el fondo borroso
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("perfil-modal");
    if (!modal) return;
    modal.querySelector(".close-perfil-modal").onclick = () => { modal.style.display = "none"; };
    modal.querySelector(".perfil-modal-bg").onclick = () => { modal.style.display = "none"; };
});

document.getElementById("editar-perfil").onclick = async () => {
    const modal = document.getElementById("perfil-modal");
    const modalContent = document.getElementById("perfil-modal-content");
    modal.style.display = "flex";
    modalContent.innerHTML = "<div style='text-align:center;padding:30px 0;'>Cargando...</div>";

    // Traer datos del perfil
    try {
        const res = await fetch("get_perfil.php");
        const data = await res.json();
        if (data.success) {
            const p = data.perfil;
            modalContent.innerHTML = `
                <form id="editar-perfil-form" style="display:flex;flex-direction:column;align-items:center;gap:12px;">
                    <div style="width:70px;height:70px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #b48a5a55;">
                        <i class='bx bx-user' style="font-size:3rem;color:#b48a5a;"></i>
                    </div>
                    <input type="text" name="nom_us" placeholder="Nombre" value="${p.nom_us ?? ''}" required style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
                    <input type="text" name="apell_us" placeholder="Apellido" value="${p.apell_us ?? ''}" required style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
                    <input type="text" name="ci_us" placeholder="CI" value="${p.ci_us ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
                    <input type="text" name="tel_us" placeholder="Teléfono" value="${p.tel_us ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
                    <input type="text" name="direccion_us" placeholder="Dirección" value="${p.direccion_us ?? ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ccc;width:100%;">
                    <button type="submit" style="margin-top:10px;padding:10px 24px;border-radius:8px;background:#8b4513;color:#fffbe6;font-weight:bold;border:none;cursor:pointer;">Guardar Cambios</button>
                </form>
                <div style="margin-top:10px;font-size:0.95rem;color:#888;">Gmail: <b>${p.mail_us}</b></div>
            `;

            // Manejar submit
            document.getElementById("editar-perfil-form").onsubmit = async (e) => {
                e.preventDefault();
                const form = e.target;
                const payload = {
                    nom_us: form.nom_us.value,
                    apell_us: form.apell_us.value,
                    ci_us: form.ci_us.value,
                    tel_us: form.tel_us.value,
                    direccion_us: form.direccion_us.value
                };
                const res = await fetch("update_perfil.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                if (result.success) {
                    modalContent.innerHTML = "<div style='color:#28a745;text-align:center;padding:30px 0;'>¡Perfil actualizado!</div>";
                    setTimeout(() => { modal.style.display = "none"; }, 1200);
                } else {
                    alert(result.message || "Error al actualizar");
                }
            };
        } else {
            modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>${data.message || "No se pudo cargar el perfil."}</div>`;
        }
    } catch (e) {
        modalContent.innerHTML = `<div style='color:#e63946;text-align:center;padding:30px 0;'>Error al conectar con el servidor.</div>`;
    }
};



document.addEventListener("DOMContentLoaded", () => {
    const btnAbrir = document.getElementById("btnAgregarMascota");
    const modal = document.getElementById("modalAgregarMascota");
    const cerrar = modal.querySelector(".close-modal-mascota");

    // Abrir el modal
    btnAbrir.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    // Cerrar al hacer clic en la X
    cerrar.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Cerrar al hacer clic fuera del contenido
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    // Guardar mascota (lógica básica de ejemplo)
    document.getElementById("savePet").addEventListener("click", () => {
        const pet = {
            name: document.getElementById("petName").value,
            desc: document.getElementById("petDesc").value,
            raza: document.getElementById("petRaza").value,
            especie: document.getElementById("petEspecie").value,
            tamano: document.getElementById("petTamano").value,
            salud: document.getElementById("petSalud").value,
            edad: document.getElementById("petEdad").value
        };
        const imagen = document.getElementById("petImage").files[0];

        if (!pet.name || !pet.desc || !pet.raza || !pet.especie) {
            alert("Por favor, completá los campos obligatorios.");
            return;
        }

        // Aquí podés hacer un fetch() POST a un archivo PHP para guardar la mascota en la base de datos

        console.log("Mascota a guardar:", pet, imagen);
        alert("Mascota guardada (simulado)");
        modal.style.display = "none";
    });
});