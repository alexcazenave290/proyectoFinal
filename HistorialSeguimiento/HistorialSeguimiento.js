// Verificar sesión y permisos
async function verificarAcceso() {
  try {
    const response = await fetch('/proyecto/php/session_status.php');
    const data = await response.json();
    
    if (!data.logged) {
      alert('Debe iniciar sesión para acceder a esta página.');
      window.location.href = '/proyecto/login/login.html';
      return false;
    }
    
    // Verificar que sea empleado o institución
    if (data.rol !== 'empleado' && data.rol !== 'institucion') {
      alert('Acceso denegado. Solo empleados e instituciones pueden ver el historial de seguimientos.');
      window.location.href = '/proyecto/index/index.html';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    window.location.href = '/proyecto/login/login.html';
    return false;
  }
}

// Cargar seguimientos
async function cargarSeguimientos() {
  try {
    const response = await fetch('/proyecto/php/get_seguimientos_historial.php');
    const data = await response.json();
    
    const tbody = document.getElementById('tablaHistorial');
    
    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="7" class="no-data">${data.error || 'Error al cargar seguimientos'}</td></tr>`;
      return;
    }
    
    if (data.seguimientos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay seguimientos registrados para tus mascotas adoptadas.</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    
    data.seguimientos.forEach(seg => {
      const fecha = new Date(seg.fecha_seguimiento).toLocaleDateString('es-ES');
      const fotoPath = seg.foto_seguimiento || '/proyecto/img/default.svg';
      const nombreAdoptante = `${seg.nom_us || ''} ${seg.apell_us || ''}`.trim() || 'N/A';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Mascota">
          <strong>${seg.nom_masc}</strong><br>
          <small class="text-muted">${seg.especie_masc} - ${seg.raza_masc}</small>
        </td>
        <td data-label="Adoptante">${nombreAdoptante}</td>
        <td data-label="Fecha">${fecha}</td>
        <td data-label="Salud">${seg.estado_salud}</td>
        <td data-label="Comportamiento">${seg.comportamiento || 'N/A'}</td>
        <td data-label="Observaciones">${seg.observaciones || 'N/A'}</td>
        <td data-label="Foto">
          <img src="${fotoPath}" 
               class="foto-mini" 
               data-bs-toggle="modal" 
               data-bs-target="#verFotoModal" 
               alt="Foto seguimiento"
               onerror="this.src='/proyecto/img/default.svg'">
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // Re-aplicar el evento click a las nuevas imágenes
    document.querySelectorAll(".foto-mini").forEach(img => {
      img.addEventListener("click", () => {
        document.getElementById("fotoModalImg").src = img.src;
      });
    });
    
  } catch (error) {
    console.error('Error al cargar seguimientos:', error);
    const tbody = document.getElementById('tablaHistorial');
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">Error al cargar los seguimientos. Por favor, intente nuevamente.</td></tr>';
  }
}

// Menú hamburguesa
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  const accesoPermitido = await verificarAcceso();
  if (accesoPermitido) {
    await cargarSeguimientos();
  }
});