// ===== LOGIN.JS - Casa Patitas =====
console.log("🚀 JavaScript cargado");

document.addEventListener("DOMContentLoaded", function() {
  console.log("✅ DOM cargado");

  // ===== Fondo con patitas =====
  const background = document.getElementById("background-paws");
  if (background) {
    const totalPaws = 50;
    for (let i = 0; i < totalPaws; i++) {
      const paw = document.createElement("img");
      paw.src = "../img/pawBackground.png";
      paw.classList.add("paw-bg");
      paw.style.left = Math.random() * window.innerWidth + "px";
      paw.style.top = Math.random() * window.innerHeight + "px";
      paw.style.width = 30 + Math.random() * 40 + "px";
      paw.style.opacity = 0.4 + Math.random() * 0.5;
      paw.style.animationDuration = 5 + Math.random() * 5 + "s";
      paw.style.animationDelay = Math.random() * 5 + "s";
      background.appendChild(paw);
    }
  }

  // ===== Obtener elementos del DOM =====
  const signin = document.getElementById("signin");
  const registerStage = document.getElementById("register-stage");
  const goRegisterBtn = document.getElementById("toggle-to-register");
  const goLoginBtn = document.getElementById("toggle-to-login");
  
  const formUsuario = document.getElementById("form-usuario");
  const formEmpleado = document.getElementById("form-empleado");
  const formInstitucion = document.getElementById("form-institucion");
  const loginForm = document.getElementById("login-form");

  console.log("📋 Elementos:", {
    signin: !!signin,
    registerStage: !!registerStage,
    goRegisterBtn: !!goRegisterBtn,
    goLoginBtn: !!goLoginBtn,
    formUsuario: !!formUsuario,
    formEmpleado: !!formEmpleado,
    formInstitucion: !!formInstitucion,
    loginForm: !!loginForm
  });

  // ===== Funciones de Toggle =====
  function showRegister() {
    console.log("👉 Mostrando registro");
    if (signin && registerStage) {
      signin.hidden = true;
      registerStage.hidden = false;
      
      // Mostrar usuario por defecto
      const modeUsuario = document.querySelector('[data-mode="usuario"]');
      if (modeUsuario) {
        setTimeout(() => modeUsuario.click(), 100);
      }
    }
  }

  function showLogin() {
    console.log("👉 Mostrando login");
    if (signin && registerStage) {
      registerStage.hidden = true;
      signin.hidden = false;
    }
  }

  // ===== Event Listeners para Toggle =====
  if (goRegisterBtn) {
    goRegisterBtn.onclick = function(e) {
      e.preventDefault();
      console.log("🖱️ Click en Registrarse");
      showRegister();
      return false;
    };
    console.log("✅ Listener agregado a goRegisterBtn");
  } else {
    console.error("❌ No se encontró #toggle-to-register");
  }

  if (goLoginBtn) {
    goLoginBtn.onclick = function(e) {
      e.preventDefault();
      console.log("🖱️ Click en Volver a Login");
      showLogin();
      return false;
    };
    console.log("✅ Listener agregado a goLoginBtn");
  }

  // ===== Switch entre tipos de registro =====
  const modePills = document.querySelectorAll(".mode-switch .pill");
  console.log("📊 Pills encontradas:", modePills.length);

  modePills.forEach(function(pill) {
    pill.onclick = function() {
      const mode = this.getAttribute("data-mode");
      console.log("🖱️ Click en modo:", mode);

      // Remover active de todas
      modePills.forEach(function(p) {
        p.classList.remove("active");
      });
      this.classList.add("active");

      // Ocultar todos los formularios
      if (formUsuario) formUsuario.hidden = true;
      if (formEmpleado) formEmpleado.hidden = true;
      if (formInstitucion) formInstitucion.hidden = true;

      // Mostrar el formulario correspondiente
      if (mode === "usuario" && formUsuario) {
        formUsuario.hidden = false;
        console.log("✅ Form Usuario visible");
      } else if (mode === "empleado" && formEmpleado) {
        formEmpleado.hidden = false;
        console.log("✅ Form Empleado visible");
        cargarInstituciones();
      } else if (mode === "institucion" && formInstitucion) {
        formInstitucion.hidden = false;
        console.log("✅ Form Institución visible");
      }
    };
  });

  // ===== Cargar Instituciones =====
  function cargarInstituciones() {
    const selectInst = document.getElementById("institucion_empleado");
    if (!selectInst || selectInst.dataset.loaded === "true") return;

    fetch("obtener_instituciones.php")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.instituciones) {
          selectInst.innerHTML = '<option value="">Selecciona una institución</option>';
          data.instituciones.forEach(function(inst) {
            const opt = document.createElement("option");
            opt.value = inst.id_inst;
            opt.textContent = inst.email_inst; // Mostrar email en lugar de nombre
            selectInst.appendChild(opt);
          });
          selectInst.dataset.loaded = "true";
          console.log("✅ Instituciones cargadas:", data.instituciones.length);
        }
      })
      .catch(function(err) {
        console.error("❌ Error cargando instituciones:", err);
      });
  }

  // ===== Registro de Usuario =====
  if (formUsuario) {
    formUsuario.onsubmit = async function(e) {
      e.preventDefault();
      console.log("📤 Enviando registro de Usuario");
      
      const formData = new FormData();
      formData.append("tipo_registro", "usuario");
      formData.append("mail_us", document.getElementById("email_usuario").value);
      formData.append("nom_us", document.getElementById("usuario_usuario").value);
      formData.append("contrasena_us", document.getElementById("password_usuario").value);

      try {
        const res = await fetch("register.php", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          alert("✅ Usuario registrado con éxito");
          window.location.href = "login.html";
        } else {
          alert("❌ " + (data.message || "Error al registrar"));
        }
      } catch (err) {
        alert("❌ Error de conexión");
        console.error(err);
      }
    };
  }

  // ===== Registro de Empleado =====
  if (formEmpleado) {
    formEmpleado.onsubmit = async function(e) {
      e.preventDefault();
      console.log("📤 Enviando registro de Empleado");
      
      const formData = new FormData();
      formData.append("tipo_registro", "empleado");
      formData.append("mail_us", document.getElementById("email_empleado").value);
      formData.append("nom_us", document.getElementById("usuario_empleado").value);
      formData.append("contrasena_us", document.getElementById("password_empleado").value);
      formData.append("nomb_empl", document.getElementById("nombre_empleado").value);
      formData.append("apellido_empl", document.getElementById("apellido_empleado").value);
      formData.append("cedula_empl", document.getElementById("cedula_empleado").value);
      formData.append("tel_empl", document.getElementById("telefono_empleado").value);
      formData.append("direccion_empl", document.getElementById("direccion_empleado").value);
      formData.append("tipo_empl", document.getElementById("tipo_empleado").value);
      formData.append("id_inst", document.getElementById("institucion_empleado").value);

      try {
        const res = await fetch("register.php", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          alert("✅ Empleado registrado con éxito");
          window.location.href = "login.html";
        } else {
          alert("❌ " + (data.message || "Error al registrar"));
        }
      } catch (err) {
        alert("❌ Error de conexión");
        console.error(err);
      }
    };
  }

  // ===== Registro de Institución =====
  if (formInstitucion) {
    formInstitucion.onsubmit = async function(e) {
      e.preventDefault();
      console.log("📤 Enviando registro de Institución");
      
      const formData = new FormData();
      formData.append("tipo_registro", "institucion");
      formData.append("nomb_inst", document.getElementById("nomb_inst").value);
      formData.append("email_inst", document.getElementById("email_institucion").value);
      formData.append("contrasena_inst", document.getElementById("password_institucion").value);
      formData.append("tel_inst", document.getElementById("tel_inst").value);
      formData.append("dia_inst", document.getElementById("dia_inst").value);
      formData.append("hora_apertura", document.getElementById("hora_apertura").value);
      formData.append("hora_cierre", document.getElementById("hora_cierre").value);
      formData.append("direccion_inst", document.getElementById("direccion_inst").value);

      try {
        const res = await fetch("register.php", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          alert("✅ Institución registrada con éxito\n\nAhora los empleados pueden registrarse y seleccionar esta institución.");
          window.location.href = "login.html";
        } else {
          alert("❌ " + (data.message || "Error al registrar"));
        }
      } catch (err) {
        alert("❌ Error de conexión");
        console.error(err);
      }
    };
  }

  // ===== Switch de tipo de login =====
  let tipoLoginSeleccionado = "usuario"; // Por defecto usuario
  const loginPills = document.querySelectorAll(".mode-switch-login .pill-login");
  
  loginPills.forEach(function(pill) {
    pill.onclick = function() {
      // Remover active de todas
      loginPills.forEach(function(p) {
        p.classList.remove("active");
      });
      this.classList.add("active");
      
      tipoLoginSeleccionado = this.getAttribute("data-login-type");
      console.log("🔄 Tipo de login seleccionado:", tipoLoginSeleccionado);
    };
  });

  // ===== Login =====
  if (loginForm) {
    loginForm.onsubmit = async function(e) {
      e.preventDefault();
      console.log("📤 Enviando login como:", tipoLoginSeleccionado);
      
      const formData = new FormData();
      formData.append("mail_us", document.getElementById("login-gmail").value);
      formData.append("contrasena_us", document.getElementById("login-password").value);
      formData.append("tipo_login", tipoLoginSeleccionado);

      try {
        const res = await fetch("login.php", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          alert("✅ Inicio de sesión exitoso");
          
          // Redirigir según el rol
          if (data.rol === "usuario") {
            window.location.href = "../index/index.html";
          } else if (data.rol === "empleado" || data.rol === "institucion") {
            window.location.href = "../indexadmin/indexadmin.html";
          } else {
            // Fallback
            window.location.href = "../index/index.html";
          }
        } else {
          alert("❌ " + (data.message || "Error al iniciar sesión"));
        }
      } catch (err) {
        alert("❌ Error de conexión");
        console.error(err);
      }
    };
  }

  console.log("🎉 Todo inicializado correctamente");
});
