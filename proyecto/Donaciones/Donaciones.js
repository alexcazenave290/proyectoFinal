  const general = document.getElementById("general");
  const refugio = document.getElementById("refugio");
  const input = document.getElementById("input");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const mercadoBtn = document.getElementById("mercadoBtn");
  const paypalBtn = document.getElementById("paypalBtn");

  // Toggle sidebar mobile
  menuToggle.addEventListener("click", ()=>{ sidebar.classList.toggle("active"); });

  // Donación checkbox
  function handleCheck(e){
    if(e.target===general && general.checked){ refugio.checked=false; input.disabled=true; }
    if(e.target===refugio && refugio.checked){ general.checked=false; input.disabled=false; }
  }
  general.addEventListener("change", handleCheck);
  refugio.addEventListener("change", handleCheck);

  // Validación y simulación pago
  function validarDonacion(plataforma){
    if(!general.checked && !refugio.checked){
      alert("Por favor selecciona una opción de donación.");
      return;
    }
    if(refugio.checked && input.value.trim()===""){
      alert("Por favor escribe el nombre del refugio.");
      return;
    }
    alert(`¡Redirigiendo a ${plataforma} para completar tu donación!`);
    // Aquí podrías agregar la integración real con Mercado Pago o PayPal
  }

  mercadoBtn.addEventListener("click", ()=> validarDonacion("Mercado Pago"));
  paypalBtn.addEventListener("click", ()=> validarDonacion("PayPal"));