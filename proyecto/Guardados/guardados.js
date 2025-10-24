// ===== Sidebar toggle =====
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
menuToggle.addEventListener("click", () => { sidebar.classList.toggle("active"); });

// ===== Funciones básicas de cards guardadas =====
function mostrarMensajeVacio() {
    const grid = document.getElementById("cardsGrid");
    grid.innerHTML = `<div class="no-pets-message">
        <i class='bx bxs-bookmark-minus' style='font-size:3rem; color:#b48a5a; display:block; margin-bottom:10px;'></i>
        <h3>No tienes publicaciones guardadas</h3>
        <p>Las mascotas que guardes aparecerán aquí para que puedas verlas más tarde.</p>
        <a href="index.php" style="display:inline-block; margin-top:15px; padding:10px 20px; background:#b48a5a; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">
            <i class='bx bx-home'></i> Ir al inicio
        </a>
    </div>`;
}

// Aquí podrías agregar la carga real desde PHP usando fetch como en tu código previo
document.addEventListener('DOMContentLoaded', mostrarMensajeVacio);