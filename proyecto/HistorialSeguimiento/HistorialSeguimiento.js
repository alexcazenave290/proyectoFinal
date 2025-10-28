    // Modal de imagen
    document.querySelectorAll(".foto-mini").forEach(img => {
      img.addEventListener("click", () => {
        document.getElementById("fotoModalImg").src = img.src;
      });
    });

    // Menú hamburguesa
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });