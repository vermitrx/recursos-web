const jsonUrl = 'json/recursos.json';
let allResources = [];

// ✅ helper: derivar nombre de archivo desde la URL si no viene en el JSON
function filenameFromURL(url) {
  try {
    const u = new URL(url);
    const p = u.pathname;
    const name = decodeURIComponent(p.substring(p.lastIndexOf('/') + 1));
    return name || url;
  } catch {
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  }
}

async function fetchResourceMetadata(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return null;

    const lastModified = response.headers.get('last-modified');
    const size = response.headers.get('content-length');

    return {
      lastModified: lastModified ? new Date(lastModified).toLocaleString() : 'N/D',
      size: size ? `${(size / 1024).toFixed(2)} KB` : 'N/D'
    };
  } catch {
    return null;
  }
}

async function loadResources() {
  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error('No se pudo cargar el JSON');

    // ✅ completar nombre si falta
    const data = await res.json();
    allResources = data.map(r => ({
      ...r,
      nombre: r.nombre || filenameFromURL(r.url)
    }));

    populateFilters(allResources);
    applyFilters(); // mostrar de inicio
  } catch (err) {
    console.error('Error cargando recursos:', err);
  }
}

function populateFilters(data) {
  const folderSelect = document.getElementById('folderFilter');
  const typeSelect = document.getElementById('typeFilter');

  const folders = [...new Set(data.map(r => r.carpeta))].sort();
  folders.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    folderSelect.appendChild(opt);
  });

  const types = [...new Set(data.map(r => r.tipo))].sort();
  types.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    typeSelect.appendChild(opt);
  });
}

async function renderResources(data) {
  const container = document.getElementById('resourceList');
  container.innerHTML = '';

  for (const resource of data) {
    const meta = await fetchResourceMetadata(resource.url);

    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.src = resource.url;
    img.alt = resource.nombre;
    // Mantener aviso/ocultamiento en caso de error de imagen
    img.onerror = () => img.style.display = 'none';

    const name = document.createElement('div');
    name.textContent = resource.nombre;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'meta';
    metaDiv.textContent = `Fecha: ${meta?.lastModified || 'N/D'} | Tamaño: ${meta?.size || 'N/D'}`;

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(metaDiv);
    container.appendChild(card);
  }
}

function applyFilters() {
  const folderValue = document.getElementById('folderFilter').value;
  const typeValue = document.getElementById('typeFilter').value;
  const searchValue = document.getElementById('searchInput').value.toLowerCase();

  const filtered = allResources.filter(r => {
    return (!folderValue || r.carpeta === folderValue) &&
           (!typeValue || r.tipo === typeValue) &&
           (!searchValue || r.nombre.toLowerCase().includes(searchValue));
  });

  renderResources(filtered);
}

document.getElementById('folderFilter').addEventListener('change', applyFilters);
document.getElementById('typeFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

loadResources();
