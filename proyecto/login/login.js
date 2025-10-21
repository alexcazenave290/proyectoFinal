// ====== Patitas flotantes ======
const background = document.getElementById("background-paws");
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

// ====== Login/Register Logic ======
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const toggleLink = document.getElementById("toggle-link");
const formTitle = document.getElementById("form-title");
const checkInstitution = document.getElementById("isInstitution");
const institutionCard = document.getElementById("institutionCard");

const direccionInput = document.getElementById("direccion");
const latHidden = document.getElementById("lat_inst_hidden");
const lngHidden = document.getElementById("lng_inst_hidden");

if (checkInstitution) checkInstitution.checked = false;
if (institutionCard) institutionCard.classList.remove("activo");

if (checkInstitution && institutionCard) {
  checkInstitution.addEventListener("change", () => {
    institutionCard.classList.toggle("activo", checkInstitution.checked);
  });
}

toggleLink.addEventListener("click", () => {
  const goingToLogin = (loginForm.style.display === "none");
  if (goingToLogin) {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    formTitle.textContent = "🐾 Iniciar Sesión";
    toggleLink.textContent = "¿No tienes cuenta? Regístrate aquí";
    if (checkInstitution) checkInstitution.checked = false;
    if (institutionCard) institutionCard.classList.remove("activo");
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    formTitle.textContent = "🐶 Crear Cuenta";
    toggleLink.textContent = "¿Ya tienes cuenta? Inicia sesión aquí";
    if (checkInstitution) checkInstitution.checked = false;
    if (institutionCard) institutionCard.classList.remove("activo");
  }
});

// Login submit
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("mail_us", document.getElementById("login-gmail").value);
  formData.append("contrasena_us", document.getElementById("login-password").value);

  const res = await fetch("login.php", { method: "POST", body: formData });
  const data = await res.json();
  if (data.success) {
    window.location.href = "../index/index.html";
  } else {
    alert(data.message || "Usuario o contraseña incorrectos");
  }
});

// Registro submit
registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("mail_us", document.getElementById("email").value);
  formData.append("contrasena_us", document.getElementById("new-password").value);
  formData.append("nom_us", document.getElementById("new-username").value);

  const esInstitucion = checkInstitution && checkInstitution.checked;
  formData.append("is_institution", esInstitucion);

if (esInstitucion) {
  formData.append("nomb_inst", document.getElementById("nomb_inst").value);
  formData.append("tel_inst", document.getElementById("tel_inst").value);
  formData.append("dia_inst", document.getElementById("dia_inst").value);
  formData.append("hora_apertura", document.getElementById("hora_apertura").value); 
  formData.append("hora_cierre", document.getElementById("hora_cierre").value);    
  formData.append("direccion_inst", direccionInput.value || "");
}

  const res = await fetch("register.php", { method: "POST", body: formData });
  const data = await res.json();
  if (data.success) {
    window.location.href = "login.html";
  } else {
    alert(data.message || "No se pudo registrar");
  }
});
