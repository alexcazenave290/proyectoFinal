document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("paw-container");
  if (!container) return;

  const TOTAL_PATITAS = 50;

  const patitas = [];


  for (let i = 0; i < TOTAL_PATITAS; i++) {
    const img = document.createElement("img");
    img.src = "../img/pawBackground.png"; 
    img.classList.add("paw-bg");

    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    img.dataset.origX = x;
    img.dataset.origY = y;

    container.appendChild(img);
    patitas.push(img);
  }
});
