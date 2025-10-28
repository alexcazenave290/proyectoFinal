const formDatos = document.getElementById("formDatos");
const seccionSeguimiento = document.getElementById("seccion-seguimiento");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const selectMascota = document.getElementById("selectMascota");
const formSeguimiento = document.getElementById("formSeguimiento");

let mascotasAdoptadas = [];
let datosUsuario = null;
let userRol = null;

// Menú responsive
menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));

// Verificar sesión al cargar la página
document.addEventListener("DOMContentLoaded", async function() {
    await verificarSesion();
});

// Verificar que el usuario esté logeado
async function verificarSesion() {
    try {
        const response = await fetch('/proyecto/php/get_datos_usuario_seguimiento.php');
        const data = await response.json();
        
        if (!data.success || !data.logged_in) {
            // No está logeado, redirigir al index
            alert('Debes iniciar sesión para acceder a esta sección');
            window.location.href = '/proyecto/index/index.html';
            return;
        }
        
        datosUsuario = data.usuario;
        userRol = data.rol;
        
        // Autocompletar datos del usuario
        const nombreCompleto = `${datosUsuario.nombre || ''} ${datosUsuario.apellido || ''}`.trim();
        document.getElementById("adoptante").value = nombreCompleto || 'Edita tu perfil';
        document.getElementById("telefono").value = datosUsuario.telefono || 'Edita tu perfil';
        document.getElementById("email").value = datosUsuario.email || 'Edita tu perfil';
        
        // Mostrar mensaje si no es usuario
        if (userRol !== 'usuario') {
            mostrarMensajeRol();
        }
        
        // Cargar mascotas adoptadas
        await cargarMascotasAdoptadas();
        
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        alert('Error al verificar la sesión. Redirigiendo...');
        window.location.href = '/proyecto/index/index.html';
    }
}

// Cargar mascotas adoptadas por el usuario
async function cargarMascotasAdoptadas() {
    try {
        console.log('🐾 Cargando mascotas adoptadas...');
        const response = await fetch('/proyecto/php/get_mascotas_adoptadas.php');
        const data = await response.json();
        
        console.log('📦 Respuesta del servidor:', data);
        
        if (!data.success) {
            console.error('❌ Error al cargar mascotas:', data.error);
            selectMascota.innerHTML = '<option value="">No has adoptado mascotas</option>';
            document.getElementById("guardarSeguimientoBtn").disabled = true;
            return;
        }
        
        mascotasAdoptadas = data.mascotas;
        console.log(`✅ Mascotas recibidas: ${mascotasAdoptadas.length}`, mascotasAdoptadas);
        
        if (mascotasAdoptadas.length === 0) {
            console.log('⚠️ No hay mascotas adoptadas');
            selectMascota.innerHTML = '<option value="">No has adoptado mascotas</option>';
            document.getElementById("guardarSeguimientoBtn").disabled = true;
            return;
        }
        
        // Limpiar select
        selectMascota.innerHTML = '<option value="">-- Selecciona una mascota --</option>';
        
        // Agregar cada mascota al select
        mascotasAdoptadas.forEach(mascota => {
            console.log(`➕ Agregando mascota: ${mascota.nom_masc} (ID: ${mascota.id_masc})`);
            const option = document.createElement('option');
            option.value = mascota.id_masc;
            option.setAttribute('data-id-adop', mascota.id_adop);
            option.setAttribute('data-foto', mascota.foto_masc || '');
            option.textContent = `${mascota.nom_masc} (${mascota.especie_masc})`;
            selectMascota.appendChild(option);
        });
        
        console.log('✅ Select poblado correctamente');
        
        // Crear contenedor para visualización de la mascota seleccionada
        mostrarVistaPrevia();
        
    } catch (error) {
        console.error('💥 Error al cargar mascotas:', error);
        selectMascota.innerHTML = '<option value="">Error al cargar mascotas</option>';
    }
}

// Mostrar mensaje para empleados e instituciones
function mostrarMensajeRol() {
    const mensaje = document.createElement('div');
    mensaje.className = 'alert alert-info mt-3';
    mensaje.innerHTML = `
        <i class='bx bx-info-circle'></i> 
        <strong>Información:</strong> Solo los usuarios que adoptaron mascotas pueden publicar seguimientos. 
        ${userRol === 'empleado' ? 'Como empleado' : 'Como institución'}, puedes consultar esta sección pero no crear nuevos seguimientos.
    `;
    
    const formDatos = document.getElementById('formDatos');
    formDatos.parentElement.appendChild(mensaje);
    
    // Deshabilitar botones si no es usuario
    document.getElementById("guardarDatosBtn").disabled = true;
    document.getElementById("guardarSeguimientoBtn").disabled = true;
}

// Mostrar vista previa de la mascota seleccionada
function mostrarVistaPrevia() {
    selectMascota.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const fotoMascota = selectedOption.getAttribute('data-foto');
        
        // Buscar o crear contenedor de vista previa
        let previewContainer = document.getElementById('mascota-preview');
        
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'mascota-preview';
            previewContainer.className = 'mascota-preview-container mt-2';
            selectMascota.parentElement.appendChild(previewContainer);
        }
        
        if (this.value && fotoMascota) {
            const mascotaInfo = mascotasAdoptadas.find(m => m.id_masc == this.value);
            previewContainer.innerHTML = `
                <div class="d-flex align-items-center gap-2 p-2 bg-light rounded">
                    <img src="${fotoMascota}" alt="${mascotaInfo.nom_masc}" 
                         class="mascota-preview-img">
                    <div>
                        <strong>${mascotaInfo.nom_masc}</strong><br>
                        <small class="text-muted">${mascotaInfo.especie_masc} - ${mascotaInfo.raza_masc || 'Sin raza'}</small>
                    </div>
                </div>
            `;
        } else {
            previewContainer.innerHTML = '';
        }
    });
}

// Evento submit del formulario de datos
formDatos.addEventListener("submit", function(e) {
    e.preventDefault();
    const adoptante = document.getElementById("adoptante").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const email = document.getElementById("email").value.trim();
    const mascotaSeleccionada = selectMascota.value;
    
    // Validar que se haya seleccionado una mascota válida
    if (!mascotaSeleccionada || mascotaSeleccionada === '') {
        alert("Por favor, selecciona una mascota antes de continuar.");
        selectMascota.focus();
        return;
    }
    
    // Validar que los datos del perfil estén completos
    if (!adoptante || adoptante === 'Edita tu perfil') {
        alert("❌ Por favor, completa tu nombre en el perfil antes de continuar.");
        return;
    }
    
    if (!telefono || telefono === 'Edita tu perfil') {
        alert("❌ Por favor, completa tu teléfono en el perfil antes de continuar.");
        return;
    }
    
    if (!email || email === 'Edita tu perfil') {
        alert("❌ Por favor, completa tu email en el perfil antes de continuar.");
        return;
    }
    
    if (adoptante && telefono && email) {
        seccionSeguimiento.classList.add("activo");
        seccionSeguimiento.scrollIntoView({ behavior: "smooth" });
    }
});

// Evento submit del formulario de seguimiento
formSeguimiento.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const idMascota = selectMascota.value;
    const estadoSalud = document.getElementById("salud").value;
    const fechaSeguimiento = document.getElementById("fechaSeguimiento").value;
    const comportamiento = document.getElementById("comportamiento").value.trim();
    const observaciones = document.getElementById("observaciones").value.trim();
    const fotoInput = document.querySelector('input[name="foto_mascota"]');
    
    // Validaciones
    if (!idMascota || idMascota === '') {
        alert('Por favor, selecciona una mascota válida');
        selectMascota.focus();
        return;
    }
    
    if (!estadoSalud || !fechaSeguimiento) {
        alert('Por favor, completa los campos obligatorios (Estado de salud y Fecha)');
        return;
    }
    
    // Validar que los datos del perfil estén completos
    const adoptante = document.getElementById("adoptante").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const email = document.getElementById("email").value.trim();
    
    if (!adoptante || adoptante === 'Edita tu perfil' || 
        !telefono || telefono === 'Edita tu perfil' || 
        !email || email === 'Edita tu perfil') {
        alert('Por favor, completa tu perfil antes de guardar un seguimiento.');
        return;
    }
    
    // Crear FormData para enviar archivos
    const formData = new FormData();
    formData.append('id_masc', idMascota);
    formData.append('estado_salud', estadoSalud);
    formData.append('fecha_seguimiento', fechaSeguimiento);
    formData.append('comportamiento', comportamiento);
    formData.append('observaciones', observaciones);
    
    if (fotoInput.files.length > 0) {
        formData.append('foto_seguimiento', fotoInput.files[0]);
    }
    
    // Deshabilitar botón mientras se procesa
    const btnGuardar = document.getElementById("guardarSeguimientoBtn");
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    
    try {
        const response = await fetch('/proyecto/php/guardar_seguimiento.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Seguimiento guardado correctamente');
            
            // Limpiar formulario
            formSeguimiento.reset();
            document.getElementById('mascota-preview').innerHTML = '';
            
            // Ocultar sección de seguimiento
            seccionSeguimiento.classList.remove("activo");
            
        } else {
            alert('❌ Error: ' + data.error);
        }
        
    } catch (error) {
        console.error('Error al guardar seguimiento:', error);
        alert('Error al guardar el seguimiento. Intenta nuevamente.');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar seguimiento';
    }
});

// Botón limpiar
document.getElementById("resetSeguimiento").addEventListener("click", function() {
    formSeguimiento.reset();
    const previewContainer = document.getElementById('mascota-preview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
});