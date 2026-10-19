# Naturalista

A personal progressive web app (PWA) for managing a plant collection. Naturalista uses Next.js for the application, Google Sheets as a lightweight data store, and Vercel for deployment.

## Features

- **Collection** — keep track of the plants currently at home.
- **Deceased** — archive plants that are no longer part of the collection.
- **Wishlist** — save plants you would like to add in the future.
- Search by family, genus, or species.
- Add plants through a mobile-friendly bottom-sheet modal.
- Delete plants from the collection.
- Install the app on supported mobile devices as a PWA.
- Password-protected access using environment variables.

## Tech stack

- **Next.js 14** with the App Router and Server Actions.
- **React 18**.
- **Tailwind CSS** for the mobile-first UI.
- **Google Sheets API v4** for data storage.
- **Vercel** for deployment.
- **TypeScript** for type-safe application code.

## Prerequisites

- Node.js and npm installed locally.
- A Google Cloud project with the Google Sheets API enabled.
- A Google service account with access to the spreadsheet.
- A Google Spreadsheet with the worksheets described below.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Google Sheets

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a Google Cloud project.
3. Enable the **Google Sheets API**.
4. Create a **service account** and generate a JSON key.
5. Create a Google Spreadsheet with these three worksheets:
   - `Coleccion`
   - `Muertas`
   - `Wishlist`
6. Add the following headers to row 1 of each worksheet:

   `id | Familia | Genero | Especie | fecha_agregado`

7. Share the spreadsheet with the service account email and grant it **Editor** access.

### 3. Configure environment variables

Copy the example file and add your credentials:

```bash
cp .env.example .env.local
```

Then update `.env.local`:

```env
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
AUTH_USER=your_username
AUTH_PASSWORD=your_secure_password
```

### Environment variables

| Variable | Description |
| --- | --- |
| `GOOGLE_SHEET_ID` | The ID of the Google Spreadsheet. It is the value between `/d/` and `/edit` in the spreadsheet URL. |
| `GOOGLE_CLIENT_EMAIL` | The email address of the Google service account. |
| `GOOGLE_PRIVATE_KEY` | The service account private key. Keep the newline characters as literal `\n` sequences in `.env.local` and in Vercel. |
| `AUTH_USER` | Username required to access the application. |
| `AUTH_PASSWORD` | Password required to access the application. |

> **Security:** Never commit `.env.local` or expose Google service account credentials in client-side code. Store production secrets in Vercel project settings.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run start    # Start the production server
```

## Deployment on Vercel

1. Push the repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Add the following variables under **Project Settings → Environment Variables**:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `AUTH_USER`
   - `AUTH_PASSWORD`
4. Deploy the project.

Vercel automatically detects the Next.js application and uses the project scripts for the build and production start commands.

## Install on an iPhone

1. Open the deployed app in **Safari**.
2. Tap the **Share** button.
3. Select **Add to Home Screen**.
4. Confirm by tapping **Add**.

The application will then be available from the iPhone home screen like an app.

## Project structure

```text
naturalista/
├── app/
│   ├── actions.ts          # Server Actions for reading, adding, and deleting plants
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout and application metadata
│   ├── manifest.ts         # Web App Manifest for PWA installation
│   └── page.tsx            # Main page
├── components/
│   ├── AddPlantModal.tsx   # Bottom-sheet modal for adding plants
│   ├── PlantTable.tsx      # Plant table and delete actions
│   ├── SearchBar.tsx       # Search input and URL parameters
│   └── TabNav.tsx          # Collection navigation
├── lib/
│   └── sheets.ts           # Google Sheets API client
├── public/
│   ├── icon-192x192.png    # PWA icon
│   └── icon-512x512.png    # PWA icon
├── .env.example            # Environment variable template
└── package.json            # Project scripts and dependencies
```

## Notes

- The worksheet names and header order must match the values expected by the application.
- Google Sheets is intended here as a simple, low-cost personal data store rather than a high-throughput production database.
- If you change the authentication or spreadsheet configuration, restart the development server so the new environment variables are loaded.
