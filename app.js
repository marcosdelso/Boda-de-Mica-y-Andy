const SUPABASE_URL = "https://bfguzvyklcugedhwaqbg.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ3V6dnlrbGN1Z2VkaHdhcWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjU5MzgsImV4cCI6MjA3MTcwMTkzOH0.FrArgmZvrtFitQYsIPkqbx15xub9J2qYL_ZisO8_kik"
const BUCKET = "wedding-photos"

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const selectFilesBtn = document.getElementById("select-files-btn");
const fileInput = document.getElementById("file-input");
const popup = document.getElementById("popup");
const preview = document.getElementById("preview");
const confirmUpload = document.getElementById("confirm-upload");
const cancelUpload = document.getElementById("cancel-upload");
const gallery = document.getElementById("gallery");
const counterElement = document.querySelector(".txt-counter h2"); // 👈 contador

let filesToUpload = [];

// Abrir selector de archivos al hacer clic en el botón
selectFilesBtn.addEventListener("click", () => {
  fileInput.click();
});

// Previsualizar archivos seleccionados y mostrar pop-up
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    filesToUpload = Array.from(fileInput.files);
    updatePreview();
    popup.classList.remove("hidden");
    popup.style.display = "flex";
  }
});

// Cancelar upload
cancelUpload.addEventListener("click", () => {
  closePopup();
});

// Cerrar pop-up al hacer clic fuera de la caja blanca
popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    closePopup();
  }
});

// Confirmar upload
confirmUpload.addEventListener("click", async () => {
  for (const file of filesToUpload) {
    const filePath = `/${Date.now()}-${file.name}`;
    const { error } = await client.storage.from(BUCKET).upload(filePath, file);
    if (error) console.error(error.message);
  }
  closePopup();
  loadGallery();
});

// Función para cerrar pop-up y limpiar selección
function closePopup() {
  filesToUpload = [];
  fileInput.value = "";
  popup.classList.add("hidden");
  popup.style.display = "none";
  preview.innerHTML = "";
}

// Mostrar previsualización con opción de eliminar
function updatePreview() {
  preview.innerHTML = "";
  filesToUpload.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `<img src="${e.target.result}"><div class="remove">&times;</div>`;
      div.querySelector(".remove").addEventListener("click", () => {
        filesToUpload.splice(index, 1);
        updatePreview();
      });
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

// Cargar galería de Supabase
// ---- Layout ----
const viewButtons = document.querySelectorAll(".visualizations-buttons button");
let currentLayout = 1; // 👉 layout por defecto (2 columnas)

function setLayout(index) {
  currentLayout = index; // 👈 recordar el layout actual
  viewButtons.forEach(b => b.classList.remove("active"));
  viewButtons[index].classList.add("active");

  if (index === 0) {
    gallery.className = "gallery-1";
    gallery.style.gridTemplateColumns = "1fr";
    gallery.querySelectorAll("img").forEach(img => {
      img.style.height = "900px";
      img.classList.remove("show");
      void img.offsetWidth;
      img.classList.add("show");
    });
  } else if (index === 1) {
    gallery.className = "gallery-2";
    gallery.style.gridTemplateColumns = "1fr 1fr";
    gallery.querySelectorAll("img").forEach(img => {
      img.style.height = "500px";
      img.classList.remove("show");
      void img.offsetWidth;
      img.classList.add("show");
    });
  } else if (index === 2) {
    gallery.className = "gallery-3";
    gallery.style.gridTemplateColumns = "1fr 1fr 1fr";
    gallery.querySelectorAll("img").forEach(img => {
      img.style.height = "500px";
      img.classList.remove("show");
      void img.offsetWidth;
      img.classList.add("show");
    });
  }
}

// Cargar galería de Supabase
async function loadGallery() {
  const { data, error } = await client.storage.from(BUCKET).list("", {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" }
  });
  if (error) return console.error(error.message);

  counterElement.textContent = `Cantidad de fotos: ${data.length}`;
  gallery.innerHTML = "";
  images = [];

  data.forEach((item, i) => {
    const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(item.name);
    const img = document.createElement("img");
    img.src = urlData.publicUrl;
    gallery.appendChild(img);

    setTimeout(() => img.classList.add("show"), i * 100);

    // abrir lightbox al click
    img.addEventListener("click", () => openLightbox(i));

    images.push(img);
  });

  setLayout(currentLayout);
}


// eventos de clic en cada botón
viewButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => setLayout(index));
});

// layout por defecto → 2 columnas
loadGallery();
setLayout(1);



// --- Lightbox ---
// --- Lightbox con animaciones ---
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.querySelector(".lightbox .close");
const prevBtn = document.querySelector(".lightbox .prev");
const nextBtn = document.querySelector(".lightbox .next");

let currentIndex = 0;
let images = []; // array con todas las imágenes visibles

function openLightbox(index) {
  currentIndex = index;
  lightbox.classList.remove("hidden");
  setTimeout(() => lightbox.classList.add("show"), 10); // animación fade + scale
  showImage(currentIndex, false);
}

function closeLightbox() {
  lightbox.classList.remove("show");
  lightboxImg.classList.remove("visible");
  setTimeout(() => lightbox.classList.add("hidden"), 400); // esperar transición
}

// mostrar imagen con animación de deslizamiento
function showImage(index, direction = null) {
  const newSrc = images[index].src;

  // animación de slide lateral
  const offset = direction === "next" ? 50 : direction === "prev" ? -50 : 0;
  lightboxImg.style.transform = `translate(${offset}%, -50%)`;
  lightboxImg.style.opacity = 0;

  setTimeout(() => {
    lightboxImg.src = newSrc;
    lightboxImg.style.transition = "none";
    lightboxImg.style.transform = `translate(${offset * -1}%, -50%)`; // posición opuesta
    setTimeout(() => {
      lightboxImg.style.transition = "transform 0.5s ease, opacity 0.5s ease";
      lightboxImg.style.transform = "translate(-50%, -50%)";
      lightboxImg.style.opacity = 1;
      lightboxImg.classList.add("visible");
    }, 50);
  }, 200);
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage(currentIndex, "prev");
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex, "next");
}

// eventos botones
closeBtn.addEventListener("click", closeLightbox);
prevBtn.addEventListener("click", showPrev);
nextBtn.addEventListener("click", showNext);

// soporte teclado
document.addEventListener("keydown", (e) => {
  if (lightbox.classList.contains("hidden")) return;
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "ArrowRight") showNext();
  if (e.key === "Escape") closeLightbox();
});

// actualizar loadGallery
