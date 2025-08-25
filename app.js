// Configuración de tu Supabase
const SUPABASE_URL = "https://TU-PROJECT.supabase.co"
const SUPABASE_ANON_KEY = "TU_ANON_KEY"
const BUCKET = "wedding-photos"

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const uploadBtn = document.getElementById("upload-btn")
const fileInput = document.getElementById("file-input")
const usernameInput = document.getElementById("username")
const gallery = document.getElementById("gallery")

// Subir una foto
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0]
  const username = usernameInput.value.trim()

  if (!file || !username) {
    alert("Por favor, ingresá tu nombre y seleccioná una foto")
    return
  }

  const filePath = `${username}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file)

  if (error) {
    console.error("Error subiendo foto:", error.message)
    alert("Error al subir la foto")
  } else {
    alert("Foto subida con éxito 🎉")
    loadGallery()
  }
})

// Cargar fotos y mostrarlas
async function loadGallery() {
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
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
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(item.name)
    const img = document.createElement("img")
    img.src = urlData.publicUrl
    gallery.appendChild(img)
  }
}

// Al iniciar, mostrar galería
loadGallery()
