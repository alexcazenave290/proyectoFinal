const general = document.getElementById("general");
const refugio = document.getElementById("refugio");
const input = document.getElementById("input");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const mercadoBtn = document.getElementById("mercadoBtn");
const paypalBtn = document.getElementById("paypalBtn");

// Toggle sidebar mobile
menuToggle.addEventListener("click", ()=>{ sidebar.classList.toggle("active"); });

// Verificar tipo de usuario al cargar la página
async function verificarTipoUsuario() {
  try {
    const res = await fetch("../php/session_status.php", {
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    
    if (data.logged && (data.rol === 'empleado' || data.rol === 'institucion')) {
      // Deshabilitar botones y checkboxes
      mercadoBtn.disabled = true;
      paypalBtn.disabled = true;
      general.disabled = true;
      refugio.disabled = true;
      input.disabled = true;
      
      // Agregar estilos visuales de deshabilitado
      mercadoBtn.style.opacity = "0.5";
      mercadoBtn.style.cursor = "not-allowed";
      paypalBtn.style.opacity = "0.5";
      paypalBtn.style.cursor = "not-allowed";
      
      // Agregar mensaje de advertencia
      const card = document.querySelector(".donaciones-card");
      const mensaje = document.createElement("div");
      mensaje.style.cssText = "background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px; color: #856404; font-weight: 600; text-align: center;";
      mensaje.innerHTML = "⚠️ Solo los usuarios regulares pueden realizar donaciones.<br>Empleados e instituciones no tienen acceso a esta función.";
      card.insertBefore(mensaje, card.firstChild);
    }
  } catch (error) {
    console.error("Error al verificar usuario:", error);
  }
}

// Ejecutar verificación al cargar
verificarTipoUsuario();

  // Donación checkbox
  function handleCheck(e){
    if(e.target===general && general.checked){ refugio.checked=false; input.disabled=true; }
    if(e.target===refugio && refugio.checked){ general.checked=false; input.disabled=false; }
  }
  general.addEventListener("change", handleCheck);
  refugio.addEventListener("change", handleCheck);

// Validación y simulación pago
async function validarDonacion(plataforma){
  // Verificar que el usuario sea tipo 'usuario'
  try {
    const res = await fetch("../php/session_status.php", {
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    
    if (!data.logged) {
      alert("Debes iniciar sesión para realizar una donación.");
      window.location.href = "../login/login.html";
      return;
    }
    
    if (data.rol === 'empleado' || data.rol === 'institucion') {
      alert("❌ No puedes realizar donaciones.\n\nSolo los usuarios regulares pueden donar.\nEmpleados e instituciones no tienen acceso a esta función.");
      return;
    }
  } catch (error) {
    alert("Error al verificar tu sesión. Por favor intenta nuevamente.");
    return;
  }
  
  if(!general.checked && !refugio.checked){
    alert("Por favor selecciona una opción de donación.");
    return;
  }
  if(refugio.checked && input.value.trim()===""){
    alert("Por favor escribe el nombre del refugio.");
    return;
  }
  
  const confirmacion = confirm(`¿Confirmas que deseas proceder con la donación a través de ${plataforma}?`);
  if(!confirmacion) return;
  
  try {
    const response = await fetch("../php/registrar_donacion.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        plataforma: plataforma,
        tipo_donacion: refugio.checked ? "refugio" : "general",
        nombre_refugio: refugio.checked ? input.value.trim() : ""
      })
    });
    
    const data = await response.json();
    
    if(data.success) {
      alert(`¡Gracias por tu donación! 🐾\n\nAhora eres un donante premium y tienes una patita dorada en tu perfil.\n\nSe simuló el proceso de pago con ${plataforma}.`);
      // Opcional: redirigir al inicio
      window.location.href = "../index/index.html";
    } else {
      alert(data.message || "Error al registrar la donación.");
    }
  } catch(error) {
    console.error("Error:", error);
    alert("Error al procesar la donación. Por favor intenta nuevamente.");
  }
}

mercadoBtn.addEventListener("click", ()=> validarDonacion("Mercado Pago"));
paypalBtn.addEventListener("click", ()=> validarDonacion("PayPal"));