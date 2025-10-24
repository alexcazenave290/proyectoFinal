        // ===== Sidebar hamburguesa =====
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});
