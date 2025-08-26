const SUPABASE_URL = "https://bfguzvyklcugedhwaqbg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ3V6dnlrbGN1Z2VkaHdhcWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjU5MzgsImV4cCI6MjA3MTcwMTkzOH0.FrArgmZvrtFitQYsIPkqbx15xub9J2qYL_ZisO8_kik";
const BUCKET = "wedding-photos";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Elementos ---
const selectFilesBtn = document.getElementById("select-files-btn");
const fileInput = document.getElementById("file-input");
const popup = document.getElementById("popup");
const preview = document.getElementById("preview");
const confirmUpload = document.getElementById("confirm-upload");
const cancelUpload = document.getElementById("cancel-upload");
const gallery = document.getElementById("gallery");
const counterElement = document.querySelector(".txt-counter h2");
const verAlbumBtn = document.querySelector(".btn-ver");

let filesToUpload = [];
let images = [];
let currentLayout = 1;
let currentView = "invitados"; // "invitados" o "boda"

// --- Funciones de subida ---
selectFilesBtn.addEventListener("click", () => {
  if(currentView === "invitados") fileInput.click();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    filesToUpload = Array.from(fileInput.files);
    updatePreview();
    popup.classList.remove("hidden");
    popup.style.display = "flex";
  }
});

cancelUpload.addEventListener("click", () => closePopup());

popup.addEventListener("click", (e) => {
  if (e.target === popup) closePopup();
});

// --- Elementos de carga ---
const loadingOverlay = document.createElement("div");
loadingOverlay.id = "loading-overlay";
loadingOverlay.innerHTML = `
  <div class="spinner"></div>
  <p>Subiendo fotos...</p>
`;
document.body.appendChild(loadingOverlay);

// --- Confirmar subida ---
confirmUpload.addEventListener("click", async () => {
  if (currentView !== "invitados") return;

  // Validar tamaño (5MB = 5 * 1024 * 1024)
  for (const file of filesToUpload) {
    if (file.size > 5 * 1024 * 1024) {
      alert(`❌ El archivo "${file.name}" supera los 5MB y no puede subirse.`);
      return;
    }
  }

  // Mostrar overlay
  loadingOverlay.classList.add("show");

  try {
    for (const file of filesToUpload) {
      const filePath = `/invitados/${Date.now()}-${file.name}`;
      const { error } = await client.storage.from(BUCKET).upload(filePath, file);
      if (error) console.error(error.message);
    }
    closePopup();
    await loadGallery();
  } catch (err) {
    console.error("Error subiendo archivos:", err);
    alert("Ocurrió un error al subir las fotos. Intenta de nuevo.");
  } finally {
    // Ocultar overlay siempre
    loadingOverlay.classList.remove("show");
  }
});


function closePopup() {
  filesToUpload = [];
  fileInput.value = "";
  popup.classList.add("hidden");
  popup.style.display = "none";
  preview.innerHTML = "";
}

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

// --- Layout ---
const viewButtons = document.querySelectorAll(".visualizations-buttons button");
viewButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => setLayout(index));
});

function setLayout(index) {
  currentLayout = index;
  viewButtons.forEach(b => b.classList.remove("active"));
  viewButtons[index].classList.add("active");

  if(index === 0) gallery.style.gridTemplateColumns = "1fr";
  else if(index === 1) gallery.style.gridTemplateColumns = "1fr 1fr";
  else gallery.style.gridTemplateColumns = "1fr 1fr 1fr";

  gallery.querySelectorAll("img").forEach(img => {
    img.style.height = (index === 0) ? "900px" : "500px";
    img.classList.remove("show");
    void img.offsetWidth;
    img.classList.add("show");
  });
}

// --- Cargar galería ---
async function loadGallery() {
  const folder = (currentView === "invitados") ? "invitados" : "boda";
  const { data, error } = await client.storage.from(BUCKET).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" }
  });
  if (error) return console.error(error.message);

  const validData = data.filter(item => item.name !== "emptyFolderPlaceholder" && item.name !== "background.jpg");

  counterElement.textContent = `Cantidad de fotos: ${validData.length}`;
  gallery.innerHTML = "";
  images = [];

  if(validData.length === 0) {
    gallery.innerHTML = `<div class="empty-gallery" onclick="selectFilesBtn.click()">
      <i class="material-icons">add</i> No hay fotos cargadas
    </div>`;
    return;
  }

  validData.forEach((item,i) => {
    const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(`${folder}/${item.name}`);
    const img = document.createElement("img");
    img.src = urlData.publicUrl;
    gallery.appendChild(img);

    setTimeout(() => img.classList.add("show"), i*100);

    img.addEventListener("click", () => openLightbox(i));
    images.push(img);
  });

  setLayout(currentLayout);
}

// --- Lightbox ---
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.querySelector(".lightbox .close");
const prevBtn = document.querySelector(".lightbox .prev");
const nextBtn = document.querySelector(".lightbox .next");
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  lightbox.classList.remove("hidden");
  setTimeout(() => lightbox.classList.add("show"), 10);
  showImage(currentIndex,false);
}

function closeLightbox() {
  lightbox.classList.remove("show");
  lightboxImg.classList.remove("visible");
  setTimeout(()=>lightbox.classList.add("hidden"),400);
}

function showImage(index,direction=null){
  const newSrc = images[index].src;
  const offset = direction==="next"?50:direction==="prev"?-50:0;
  lightboxImg.style.transform = `translate(${offset}%, -50%)`;
  lightboxImg.style.opacity = 0;
  setTimeout(()=>{
    lightboxImg.src=newSrc;
    lightboxImg.style.transition="none";
    lightboxImg.style.transform = `translate(${offset*-1}%, -50%)`;
    setTimeout(()=>{
      lightboxImg.style.transition="transform 0.5s ease, opacity 0.5s ease";
      lightboxImg.style.transform = "translate(-50%,-50%)";
      lightboxImg.style.opacity=1;
      lightboxImg.classList.add("visible");
    },50);
  },200);
}

function showPrev(){ currentIndex=(currentIndex-1+images.length)%images.length; showImage(currentIndex,"prev"); }
function showNext(){ currentIndex=(currentIndex+1)%images.length; showImage(currentIndex,"next"); }

closeBtn.addEventListener("click", closeLightbox);
prevBtn.addEventListener("click", showPrev);
nextBtn.addEventListener("click", showNext);
document.addEventListener("keydown",(e)=>{
  if(lightbox.classList.contains("hidden")) return;
  if(e.key==="ArrowLeft") showPrev();
  if(e.key==="ArrowRight") showNext();
  if(e.key==="Escape") closeLightbox();
});

// --- Ver álbum / volver ---
verAlbumBtn.addEventListener("click", ()=> {
  if(currentView==="invitados"){
    currentView="boda";
    document.querySelector(".hero").style.display="none"; // ocultar fondo
    selectFilesBtn.style.display="none"; // no subir fotos en boda
    verAlbumBtn.innerHTML='<i class="material-icons">arrow_back</i> Volver';
  } else {
    currentView="invitados";
    document.querySelector(".hero").style.display="block";
    selectFilesBtn.style.display="inline-flex";
    verAlbumBtn.innerHTML='<i class="material-icons">swipe_up</i> Ver Álbum';
  }
  loadGallery();
});

// --- Inicial ---
loadGallery();
setLayout(currentLayout);






