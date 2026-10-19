# Naturalista

PWA personal para registrar mi colección de plantas. Construida con Next.js 14, Google Sheets como base de datos, y deployada en Vercel.

## Stack

- **Next.js 14** (App Router + Server Actions)
- **Tailwind CSS** — UI mobile-first
- **Google Sheets API v4** — almacenamiento gratuito
- **Vercel** — deploy gratuito

## Features

- **Colección** — plantas que tengo en casa
- **Muertas** — las que ya no están con nosotros
- **Wishlist** — las que quiero tener
- Búsqueda por familia, género o especie
- Agregar plantas con modal estilo iOS
- Eliminar plantas
- Instalable como PWA en iPhone

---

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Google Sheets

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto nuevo
3. Habilitar la **Google Sheets API**
4. Crear un **Service Account** y descargar el JSON key
5. Crear un Google Spreadsheet con **3 pestañas**:
- `Coleccion`
- `Muertas`
- `Wishlist`
6. En cada pestaña, poner en la fila 1 los encabezados: `id | Familia | Genero | Especie | fecha_agregado`
7. Compartir el Spreadsheet con el email del Service Account (rol: **Editor**)

### 3. Variables de entorno

Copiar `.env.example` como `.env.local` y llenar los valores:

```bash
cp .env.example .env.local
```

```env
GOOGLE_SHEET_ID=1ABC...xyz
GOOGLE_CLIENT_EMAIL=naturalista@mi-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
AUTH_USER=tu_usuario
AUTH_PASSWORD=tu_contrasena_segura
```

> **Nota**: El `GOOGLE_PRIVATE_KEY` debe tener los saltos de línea como `\n` literal (no saltos reales) cuando se copia desde el JSON key.

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

1. Push el código a GitHub
2. Importar el repo en [Vercel](https://vercel.com)
3. Agregar las variables de entorno en **Settings → Environment Variables**:
- `GOOGLE_SHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `AUTH_USER`
- `AUTH_PASSWORD`
4. Deploy

### Instalar en iPhone

1. Abrir la URL de Vercel en **Safari**
2. Tocar el botón de compartir (cuadrado con flecha)
3. Seleccionar **"Agregar a pantalla de inicio"**
4. ¡Listo! La app aparece como ícono nativo

---

## Estructura del proyecto

```
naturalista/
├── app/
│ ├── actions.ts # Server Actions: leer, agregar, eliminar plantas
│ ├── globals.css
│ ├── layout.tsx # Root layout + PWA meta tags
│ ├── manifest.ts # Web App Manifest (installable PWA)
│ └── page.tsx # Página principal
├── components/
│ ├── AddPlantModal.tsx # Modal bottom-sheet para agregar
│ ├── PlantTable.tsx # Tabla de plantas con delete
│ ├── SearchBar.tsx # Búsqueda con URL params
│ └── TabNav.tsx # Navegación entre pestañas
├── lib/
│ └── sheets.ts # Cliente Google Sheets API
└── public/
├── icon-192x192.png
└── icon-512x512.png
```