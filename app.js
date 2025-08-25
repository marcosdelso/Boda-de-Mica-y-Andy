// Configuración de tu Supabase
const SUPABASE_URL = "https://bfguzvyklcugedhwaqbg.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ3V6dnlrbGN1Z2VkaHdhcWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjU5MzgsImV4cCI6MjA3MTcwMTkzOH0.FrArgmZvrtFitQYsIPkqbx15xub9J2qYL_ZisO8_kik"
const BUCKET = "wedding-photos"

// 👇 Usar window.supabase para crear el cliente
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const uploadBtn = document.getElementById("upload-btn")
const fileInput = document.getElementById("file-input")
const gallery = document.getElementById("gallery")

// Subir una foto
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0]

  if (!file) {
    alert("Por favor seleccioná una foto")
    return
  }

  const filePath = `/${Date.now()}-${file.name}`
  const { error } = await client.storage.from(BUCKET).upload(filePath, file)

  if (error) {
    console.error("Error subiendo foto:", error.message)
    alert("Error al subir la foto: " + error.message)
  } else {
    alert("Foto subida con éxito 🎉")
    loadGallery()
  }
})

// Cargar fotos y mostrarlas
async function loadGallery() {
  const { data, error } = await client.storage.from(BUCKET).list("", {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" }
  })

  if (error) {
    console.error("Error al listar fotos:", error.message)
    return
  }

  gallery.innerHTML = ""

  for (const item of data) {
    const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(item.name)
    const img = document.createElement("img")
    img.src = urlData.publicUrl
    gallery.appendChild(img)
  }
}

// Al iniciar, mostrar galería
loadGallery()
