// ===== VARIABLES GLOBALES =====
const cardsGrid = document.getElementById('cardsGrid');
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector('.sidebar');

const cantidadPatitas = 25;
const tamanoMin = 30;
const tamanoMax = 70;

let mascotasGuardadas = [];
let isUserLogged = false;

// ===== Toggle del menú en responsive =====
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

// ===== FUNCIONES AL CARGAR LA PAGINA =====
document.addEventListener('DOMContentLoaded', async () => {
  await checkSessionAndLoadSaved();
  generarPatitas();
});

// ===== CHECK DE SESIÓN Y CARGAR GUARDADOS =====
async function checkSessionAndLoadSaved() {
  try {
    const res = await fetch("../php/session_status.php", {
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    
    console.log('Estado de sesión:', data); // Debug
    
    if (data.logged) {
      isUserLogged = true;
      console.log('Usuario logueado con rol:', data.rol); // Debug
      await cargarMascotasGuardadas();
    } else {
      isUserLogged = false;
      mostrarMensajeNoLogueado();
    }
  } catch (e) {
    console.error('Error al verificar sesión:', e);
    isUserLogged = false;
    mostrarMensajeNoLogueado();
  }
}

// ===== CARGAR MASCOTAS GUARDADAS =====
async function cargarMascotasGuardadas() {
  cardsGrid.innerHTML = '<div style="text-align:center;padding:50px;color:#666;">Cargando mascotas guardadas...</div>';
  
  try {
    const res = await fetch("../php/get_mascotas_guardadas.php", {
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    
    console.log('Respuesta de mascotas guardadas:', data);
    
    if (data.success && data.data && data.data.length > 0) {
      mascotasGuardadas = data.data.map(mascota => {
        // Usar ruta absoluta o convertir rutas relativas antiguas
        let imagePath = mascota.foto_masc || "/proyecto/img/default.svg";
        
        // Si la ruta no empieza con / (absoluta) ni con http, convertirla
        if (imagePath && !imagePath.startsWith('/') && !imagePath.startsWith('http')) {
          imagePath = '/proyecto/' + imagePath;
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
          fecha_guardado: mascota.fecha_guardado
        };
      });
      
      console.log(`Cargadas ${mascotasGuardadas.length} mascotas guardadas`);
      mostrarMascotasGuardadas();
    } else {
      mostrarMensajeVacio();
    }
  } catch (error) {
    console.error('Error al cargar mascotas guardadas:', error);
    cardsGrid.innerHTML = '<div style="text-align:center;padding:50px;color:#e63946;">Error al cargar las mascotas guardadas. Por favor, intenta de nuevo.</div>';
  }
}

// ===== MOSTRAR MASCOTAS =====
function mostrarMascotasGuardadas() {
  cardsGrid.innerHTML = '';
  
  mascotasGuardadas.forEach(pet => {
    crearCard(pet);
  });
}

// ===== CREAR CARD =====
function crearCard(pet) {
  const isAdopted = pet.adoptado == 1;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-header">
      <i class='bx bxs-bookmark card-bookmark saved' data-id-masc="${pet.id}" title="Remover de guardados"></i>
    </div>
    <img src="${pet.image}" class="card-img" alt="${pet.name}" onerror="this.src='../img/default.svg'">
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
      <a href="/proyecto/index/index.html" class="view-button">
        <i class='bx bx-show'></i>
        Ver en Inicio
      </a>
    </div>
  `;

  cardsGrid.appendChild(card);

  // Agregar event listener al bookmark para remover de guardados
  const bookmarkIcon = card.querySelector('.card-bookmark');
  if (bookmarkIcon) {
    bookmarkIcon.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removerDeGuardados(pet.id);
    });
  }
}

// ===== REMOVER DE GUARDADOS =====
async function removerDeGuardados(idMascota) {
  if (!confirm('¿Deseas remover esta mascota de tus guardados?')) {
    return;
  }

  try {
    const res = await fetch("../php/toggle_guardado.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ id_masc: idMascota })
    });

    const data = await res.json();
    
    if (data.success && data.action === 'removed') {
      // Remover la mascota del array local
      mascotasGuardadas = mascotasGuardadas.filter(pet => pet.id !== idMascota);
      
      // Remover la card del DOM con animación
      const card = document.querySelector(`.card-bookmark[data-id-masc="${idMascota}"]`)?.closest('.card');
      if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
          card.remove();
          // Si no quedan más mascotas, mostrar mensaje vacío
          if (mascotasGuardadas.length === 0) {
            mostrarMensajeVacio();
          }
        }, 300);
      }
    } else {
      alert(data.message || 'Error al remover de guardados');
    }
  } catch (error) {
    console.error('Error al remover de guardados:', error);
    alert('Error al remover de guardados. Por favor, intenta de nuevo.');
  }
}

// ===== MENSAJES =====
function mostrarMensajeVacio() {
  cardsGrid.innerHTML = `
    <div class="no-pets-message">
        <i class='bx bxs-bookmark-minus' style='font-size:3rem; color:#b48a5a; display:block; margin-bottom:10px;'></i>
        <h3>No tienes publicaciones guardadas</h3>
        <p>Las mascotas que guardes aparecerán aquí para que puedas verlas más tarde.</p>
      <a href="/proyecto/index/index.html" class="cta-link">
            <i class='bx bx-home'></i> Ir al inicio
        </a>
    </div>
  `;
}

function mostrarMensajeNoLogueado() {
  cardsGrid.innerHTML = `
    <div class="no-pets-message">
      <i class='bx bx-lock-alt' style='font-size:3rem; color:#e63946; display:block; margin-bottom:10px;'></i>
      <h3>Debes iniciar sesión</h3>
      <p>Para ver tus mascotas guardadas, primero debes iniciar sesión en tu cuenta.</p>
      <a href="/proyecto/login/login.html" class="cta-link">
        <i class='bx bx-log-in'></i> Iniciar Sesión
      </a>
    </div>
  `;
}

// ===== GENERAR PATITAS DE FONDO =====
function generarPatitas() {
  var container = document.getElementById('paw-container');
  if (!container) {
    console.warn('No se encontró el contenedor de patitas (#paw-container)');
    return;
  }

  container.innerHTML = '';
  
  var esMobile = window.innerWidth <= 768;
  var containerWidth = window.innerWidth;
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
      x = Math.random() * (containerWidth - tamano);
      y = Math.random() * (containerHeight - tamano);
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
