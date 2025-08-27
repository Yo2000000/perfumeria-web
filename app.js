console.log("app.js cargado ✅");

const firebaseConfig = {
  apiKey: "AIzaSyAzGcRQmCvV8H6tL15ZBGjhIf2uWT6o-8A",
  authDomain: "perfumeria-web.firebaseapp.com",
  projectId: "perfumeria-web",
  storageBucket: "perfumeria-web.firebasestorage.app",
  messagingSenderId: "148592337011",
  appId: "1:148592337011:web:2a38a47df445fc850eca06",
  measurementId: "G-G5RR20PJ7Z"
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const captureButton = document.getElementById("tomarFoto");
  const saveButton = document.getElementById("guardarFoto");
  const imagenesDiv = document.getElementById("imagenes");
  const debugDiv = document.getElementById("debug");
  const detallesCamara = document.getElementById("detallesCamara");
  const precioInput = document.getElementById("precio");
  const descripcionInput = document.getElementById("descripcion");
  const ctx = canvas?.getContext("2d");
  let streamCamara = null;

  const inputFile = document.getElementById("inputFile");
  const verDetallesBtn = document.getElementById("verDetallesGaleria");
  const previewContainer = document.getElementById("previewContainer");
  const detallesGaleria = document.getElementById("detallesGaleria");
  const precioGaleria = document.getElementById("precioGaleria");
  const descripcionGaleria = document.getElementById("descripcionGaleria");
  const guardarGaleriaBtn = document.getElementById("guardarGaleria");
  const debugGaleria = document.getElementById("debugGaleria");
  let archivoSeleccionado = null;

  if (inputFile) {
    inputFile.addEventListener("change", () => {
      previewContainer.innerHTML = "";
      debugGaleria.innerText = "";
      detallesGaleria.style.display = "none";
      precioGaleria.value = "";
      descripcionGaleria.value = "";
      archivoSeleccionado = inputFile.files[0] || null;
    });
  }

  if (verDetallesBtn) {
    verDetallesBtn.addEventListener("click", () => {
      previewContainer.innerHTML = "";
      debugGaleria.innerText = "";

      if (!archivoSeleccionado) {
        debugGaleria.innerText = "Primero selecciona una imagen.";
        return;
      }
      if (!archivoSeleccionado.type.startsWith("image/")) {
        debugGaleria.innerText = "Por favor selecciona un archivo de imagen.";
        return;
      }
      const imgPrev = document.createElement("img");
      imgPrev.style.maxWidth = "200px";
      imgPrev.style.marginTop = "0.5rem";
      imgPrev.src = URL.createObjectURL(archivoSeleccionado);
      previewContainer.appendChild(imgPrev);
      detallesGaleria.style.display = "block";
    });
  }

  if (guardarGaleriaBtn) {
    guardarGaleriaBtn.addEventListener("click", () => {
      if (!archivoSeleccionado) {
        debugGaleria.innerText = "No hay imagen seleccionada.";
        return;
      }
      const precioVal = Number(precioGaleria.value);
      if (isNaN(precioVal) || precioVal < 0) {
        debugGaleria.innerText = "Precio inválido (>= 0).";
        return;
      }
      const descripcionVal = (descripcionGaleria.value || "").trim();
      debugGaleria.innerText = "Subiendo la foto...";

      const extension = archivoSeleccionado.name.split(".").pop();
      const nombreEnStorage = `galeria-${Date.now()}.${extension}`;

      const uploadTask = storage.ref(nombreEnStorage).put(archivoSeleccionado);
      uploadTask.on("state_changed", () => {}, error => {
        debugGaleria.innerText = "Error subiendo: " + error.message;
      }, () => {
        uploadTask.snapshot.ref.getDownloadURL().then(url => {
          // [UPDATE 2025-08-14] campos opcionales para la ficha
          const extra = {
            clima: ["Cálido","Templado"],     // puedes editar/guardar desde tu UI si quieres
            temporadas: ["Primavera","Verano"],
            notas: { salida:["Pomelo","Bergamota"], corazon:["Neroli"], fondo:["Almizcle"] },
            badge: "Novedad",
            imagenesExtras: []                // aquí podrías añadir más URLs si subes varias
          };
          return db.collection("imagenes").add({
            url,
            path: nombreEnStorage,
            precio: precioVal,
            descripcion: descripcionVal,
            ...extra,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }).then(() => {
          debugGaleria.innerText = "Foto y detalles guardados ✔️";
          previewContainer.innerHTML = "";
          inputFile.value = "";
          detallesGaleria.style.display = "none";
          precioGaleria.value = "";
          descripcionGaleria.value = "";
          archivoSeleccionado = null;
        }).catch(err => {
          debugGaleria.innerText = "Error guardando datos: " + err.message;
        });
      });
    });
  }

  if (captureButton) {
    captureButton.addEventListener("click", () => {
      if (!video?.videoWidth || !video?.videoHeight) {
        debugDiv.innerText = "Vídeo no listo, espera un momento...";
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.style.display = "block";
      debugDiv.innerText = "Foto tomada ✔️";
      detallesCamara.style.display = "block";
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      debugDiv.innerText = "Guardando foto...";
      const precioVal = Number(precioInput?.value || 0);
      const descripcionVal = descripcionInput?.value || "";
      canvas.toBlob(blob => {
        const name = `foto-${Date.now()}.jpg`;
        storage.ref(name).put(blob).then(snap => snap.ref.getDownloadURL().then(url => {
          // [UPDATE 2025-08-14] mismos campos opcionales
          const extra = {
            clima: ["Cálido","Templado"],
            temporadas: ["Primavera","Verano"],
            notas: { salida:["Pomelo","Bergamota"], corazon:["Neroli"], fondo:["Almizcle"] },
            badge: "Novedad",
            imagenesExtras: []
          };
          return db.collection("imagenes").add({
            url,
            path: name,
            precio: precioVal,
            descripcion: descripcionVal,
            ...extra,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        })).then(() => {
          debugDiv.innerText = "Foto y detalles guardados ✔️";
          precioInput.value = "";
          descripcionInput.value = "";
          detallesCamara.style.display = "none";
          canvas.style.display = "none";
          if (streamCamara && streamCamara.getTracks) {
            streamCamara.getTracks().forEach(track => track.stop());
          }
          const camara = document.getElementById("camara");
          if (camara) camara.style.display = "none";
        }).catch(err => {
          debugDiv.innerText = "Error: " + err.message;
        });
      }, "image/jpeg");
    });
  }

  // -------- Render catálogo (lo tuyo) + botón “+” --------
  db.collection("imagenes").orderBy("timestamp", "desc").onSnapshot(snap => {
    const imagenesDiv = document.getElementById("imagenes");
    imagenesDiv.innerHTML = "";
    snap.forEach(doc => {
      const data = doc.data();
      const { url, path, precio, descripcion } = data;
      const id = doc.id;

      const card = document.createElement("div");
      card.classList.add("producto-card");

      const img = document.createElement("img");
      img.src = url;
      img.alt = descripcion || "Foto de producto";
      img.style.maxWidth = "100%";
      img.onerror = () => {
        card.remove();
        db.collection("imagenes").doc(id).delete().catch(console.error);
      };
      card.appendChild(img);

      if (precio != null) {
        const precioEl = document.createElement("p");
        precioEl.classList.add("producto-precio");
        precioEl.innerText = `Q ${Number(precio).toFixed(2)}`;
        card.appendChild(precioEl);
      }
      if (descripcion) {
        const descEl = document.createElement("p");
        descEl.classList.add("producto-desc");
        descEl.innerText = descripcion;
        card.appendChild(descEl);
      }

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.classList.add("btn-eliminar");
      btnEliminar.addEventListener("click", () => {
        storage.ref(path).delete().then(() => db.collection("imagenes").doc(id).delete());
      });
      card.appendChild(btnEliminar);

      const btnCarrito = document.createElement("button");
      btnCarrito.textContent = "Agregar al carrito 🛒";
      btnCarrito.classList.add("btn-carrito");
      btnCarrito.addEventListener("click", () => {
        const item = { id, descripcion, precio: Number(precio || 0), url };
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        carrito.push(item);
        localStorage.setItem("carrito", JSON.stringify(carrito));
        alert("Producto agregado al carrito");
      });
      card.appendChild(btnCarrito);

      // [UPDATE 2025-08-14] abrir detalle al hacer clic en la imagen o el título
      img.style.cursor = "pointer";
      img.addEventListener("click", () => abrirDetalle(id, data));

      imagenesDiv.appendChild(card);
    });

    const addCard = document.createElement("div");
    addCard.classList.add("add-card");
    const plusIcon = document.createElement("div");
    plusIcon.classList.add("add-icon");
    plusIcon.innerText = "+";
    addCard.appendChild(plusIcon);
    addCard.addEventListener("click", () => {
      const camaraSection = document.getElementById("camara");
      if (camaraSection) {
        camaraSection.style.display = "block";
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            streamCamara = stream;
            if (video) video.srcObject = stream;
            if (debugDiv) debugDiv.innerText = "Cámara activa ✔️";
            if (canvas) canvas.style.display = "none";
            if (detallesCamara) detallesCamara.style.display = "none";
          })
          .catch(err => {
            if (debugDiv) debugDiv.innerText = `Error al activar cámara: ${err.name} — ${err.message}`;
          });
      }
      const galeriaSection = document.getElementById("galeria");
      if (galeriaSection) galeriaSection.style.display = "block";
    });
    imagenesDiv.appendChild(addCard);
  });

}); // DOMContentLoaded


// ======================= NAV / CHAT / CARRITO (tuyo) =======================
function toggleChat() {
  const iframe = document.getElementById("chatbot-frame");
  iframe.style.display = iframe.style.display === "block" ? "none" : "block";
}

const toggleBtn = document.getElementById("menu-toggle");
const nav = document.querySelector(".main-nav");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    nav.classList.toggle("show");
  });
}

// --------------- Carrito de compras ---------------
document.getElementById("abrir-carrito").addEventListener("click", () => {
  const cont = document.getElementById("carrito-container");
  const items = JSON.parse(localStorage.getItem("carrito")) || [];
  const itemsContainer = document.getElementById("carrito-items");
  const totalContainer = document.getElementById("carrito-total");
  itemsContainer.innerHTML = "";

  let total = 0;
  items.forEach((item, index) => {
    const div = document.createElement("div");

    const img = document.createElement("img");
    img.src = item.url;
    img.style.maxWidth = "50px";
    img.style.marginRight = "10px";

    const label = document.createElement("span");
    label.innerHTML = `<strong>${item.descripcion || "Producto"}</strong> - Q${Number(item.precio || 0).toFixed(2)}`;

    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.onclick = () => eliminarDelCarrito(index);

    div.appendChild(img);
    div.appendChild(label);
    div.appendChild(btn);

    total += Number(item.precio || 0);
    itemsContainer.appendChild(div);
  });

  totalContainer.innerText = `Total: Q ${total.toFixed(2)}`;
  cont.style.display = "block";
});

function cerrarCarrito() {
  document.getElementById("carrito-container").style.display = "none";
}

function eliminarDelCarrito(index) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  document.getElementById("abrir-carrito").click(); // recarga
}

// Conexión al ESP32 por red local (tuyo)
const ipRobot = "http://192.168.4.1";
function enviar(direccion) {
  fetch(`${ipRobot}/mover?direccion=${direccion}`)
    .then(res => {
      if (!res.ok) throw new Error("Fallo al enviar comando");
      console.log(`Comando enviado: ${direccion}`);
    })
    .catch(err => {
      console.error("Error al conectar con el robot:", err.message);
      alert("No se pudo enviar el comando al robot. Verifica la conexión WiFi o la IP.");
    });
}

function enviarAccion(accion) {
  const ipESP32 = "http://192.168.1.50";
  const map = { crear: 1, muestra: 2, ticket: 3 };
  const boton = map[accion];
  const respuestaEl = document.getElementById("respuesta");
  if (!respuestaEl) return;
  if (boton === undefined) { respuestaEl.innerText = "❌ Acción inválida."; return; }
  respuestaEl.innerText = "⌛ Enviando...";
  fetch(`${ipESP32}/accion?boton=${boton}`)
    .then(res => res.text())
    .then(msg => { respuestaEl.innerText = `✅ ${msg}`; })
    .catch(err => { respuestaEl.innerText = `❌ Error: ${err.message}`; });
}


// ======================= [UPDATE 2025-08-14] FICHA DE PRODUCTO =======================

// Abre el modal con datos del doc. Si algunos campos no existen, usamos valores por defecto.
function abrirDetalle(id, data) {
  const modal = document.getElementById("producto-modal");
  const close1 = document.getElementById("closeDetalle");
  const close2 = document.getElementById("closeDetalleBtn");

  // Galería
  const main = document.getElementById("detalleMain");
  const thumbs = document.getElementById("detalleThumbs");
  // Info
  const title = document.getElementById("prodTitle");
  const brand = document.getElementById("detalleBrand");
  const badge = document.getElementById("detalleBadge");
  const precio = document.getElementById("detallePrecio");
  const chips = document.getElementById("detalleChips");
  const qty = document.getElementById("detalleQty");

  // Tabs
  const tabs = document.getElementById("detalleTabs");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  const p3 = document.getElementById("p3");

  // Defaults si no existen
  const nombre = data.descripcion || "Fragancia";
  const precioNum = Number(data.precio || 0);
  const familia = data?.notas?.familia || data?.family || "Cítrica";
  const notas = data?.notas || { salida:["Pomelo"], corazon:["Neroli"], fondo:["Almizcle"] };
  const clima = data?.clima || ["Cálido","Templado"];
  const temporadas = data?.temporadas || ["Primavera","Verano"];
  const badgeVal = data?.badge || null;
  const imagenPrincipal = data?.url;
  const extras = Array.isArray(data?.imagenesExtras) ? data.imagenesExtras : [];

  // Rellena
  main.src = imagenPrincipal;
  title.textContent = nombre;
  brand.textContent = "FRAGANCIA KING DAVID";
  precio.textContent = "Q " + precioNum.toFixed(2);
  if (badgeVal) { badge.style.display = "inline-block"; badge.textContent = badgeVal.toUpperCase(); }
  else { badge.style.display = "none"; }

  // Chips
  chips.innerHTML = "";
  [...clima.map(c=>`Clima: ${c}`), ...temporadas.map(t=>`Temporada: ${t}`)].forEach(txt=>{
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = txt;
    chips.appendChild(span);
  });

  // Thumbs
  thumbs.innerHTML = "";
  const allImgs = [imagenPrincipal, ...extras].filter(Boolean);
  allImgs.forEach((src, idx)=>{
    const t = document.createElement("img");
    t.src = src;
    if (idx===0) t.classList.add("active");
    t.addEventListener("click", ()=>{
      document.querySelectorAll("#detalleThumbs img").forEach(i=>i.classList.remove("active"));
      t.classList.add("active");
      main.src = src;
    });
    thumbs.appendChild(t);
  });

  // Tabs contenido
  p1.innerHTML = `
    <strong>Familia:</strong> ${familia}<br>
    <div class="bullets">
      <div><strong>Salida:</strong> ${(notas.salida||[]).join(", ")}</div>
      <div><strong>Corazón:</strong> ${(notas.corazon||[]).join(", ")}</div>
      <div><strong>Fondo:</strong> ${(notas.fondo||[]).join(", ")}</div>
    </div>
  `;
  p2.textContent = "Ideal para días soleados, uso diario y oficina. Reaplicar tras 6–7 horas si deseas mayor proyección.";
  p3.textContent = "Cambios dentro de 7 días si el sello no ha sido roto. Envíos nacionales 24–72h. Internacional según courier.";

  // Tabs handler
  tabs.onclick = (e)=>{
    if (e.target.tagName!=="BUTTON") return;
    tabs.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
    e.target.classList.add("active");
    [p1,p2,p3].forEach(c=>c.style.display="none");
    const id = e.target.dataset.tab;
    document.getElementById(id).style.display = "block";
  };

  // Agregar al carrito desde el modal
  document.getElementById("detalleAddCart").onclick = ()=>{
    const cantidad = parseInt(qty.value || "1", 10);
    const item = { id, descripcion: nombre, precio: precioNum, url: imagenPrincipal, qty: cantidad };
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push(item);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert("Producto agregado al carrito");
  };

  // Favoritos (demo)
  document.getElementById("detalleFav").onclick = ()=>{
    let favs = JSON.parse(localStorage.getItem("favoritos")||"[]");
    favs.push({id, nombre});
    localStorage.setItem("favoritos", JSON.stringify(favs));
    alert("Guardado en favoritos");
  };

  // Pagos
  document.getElementById("payTarjetaLocal").onclick = ()=>{
    alert("Aquí integrarás el SDK de tu procesador local (tarjetas nacionales).");
  };
  document.getElementById("payTransferencia").onclick = ()=>{
    alert("Mostrar instrucciones de transferencia/depósito/QR y botón para subir comprobante.");
  };

  // PayPal (si cargaste su SDK)
  if (window.paypal && document.getElementById("paypal-button-container")) {
    document.getElementById("paypal-button-container").innerHTML = ""; // reset
    paypal.Buttons({
      createOrder: (data_, actions) => actions.order.create({
        purchase_units: [{ amount: { value: precioNum.toFixed(2), currency_code: "USD" }, description: nombre }]
      }),
      onApprove: (data_, actions) => actions.order.capture().then(() => {
        alert("Pago aprobado con PayPal ✅");
      }),
      onError: (err) => alert("Error PayPal: " + err.message)
    }).render("#paypal-button-container");
  }

  // Abrir / cerrar modal
  modal.style.display = "block";
  const close = ()=>{ modal.style.display = "none"; };
  close1.onclick = close;
  close2.onclick = close;
}
 