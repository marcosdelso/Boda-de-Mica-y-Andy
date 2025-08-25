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
    popup.style.display = "flex"; // asegurar que se muestre
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
async function loadGallery() {
  const { data, error } = await client.storage.from(BUCKET).list("", {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" }
  });
  if (error) return console.error(error.message);

  gallery.innerHTML = "";
  for (const item of data) {
    const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(item.name);
    const img = document.createElement("img");
    img.src = urlData.publicUrl;
    gallery.appendChild(img);
  }
}

// Inicializar
loadGallery();
