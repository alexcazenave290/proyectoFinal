    const formDatos = document.getElementById("formDatos");
    const seccionSeguimiento = document.getElementById("seccion-seguimiento");
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    // Menú responsive
    menuToggle.addEventListener("click", ()=> sidebar.classList.toggle("active"));

    formDatos.addEventListener("submit", function(e){
      e.preventDefault();
      const adoptante = document.getElementById("adoptante").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const email = document.getElementById("email").value.trim();
      if(adoptante && telefono && email){
        seccionSeguimiento.classList.add("activo");
        seccionSeguimiento.scrollIntoView({ behavior:"smooth" });
      } else {
        alert("Por favor, completa todos los campos antes de continuar.");
      }
    });