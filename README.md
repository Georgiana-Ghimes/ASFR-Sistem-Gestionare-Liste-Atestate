# Liste Tipărire Autorizații

Aplicație completă pentru gestionarea listelor de tipărire autorizații cu PostgreSQL.

## Structură Proiect

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + PostgreSQL
- **Autentificare**: JWT
- **Upload fișiere**: Local storage

## Cerințe

- Node.js 18+
- PostgreSQL 14+
- npm sau yarn

## Instalare

### 1. Instalare dependențe

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Configurare PostgreSQL

Creați o bază de date PostgreSQL:

```sql
CREATE DATABASE lista_tiparire;
```

### 3. Configurare variabile de mediu

**Backend** (`server/.env`):
```
PORT=3001
DATABASE_URL=postgresql://postgres:parola_ta@localhost:5432/lista_tiparire
JWT_SECRET=secret-key-foarte-sigur-schimba-in-productie
NODE_ENV=development
```

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3001/api
```

### 4. Inițializare bază de date

```bash
cd server
npm run db:setup
cd ..
```

Acest script va crea tabelele și utilizatorii demo:
- Admin: `admin@test.com` / `password123`
- SCMLA: `scmla@test.com` / `password123`
- ISF București: `isf.bucuresti@test.com` / `password123`
- ISF Cluj: `isf.cluj@test.com` / `password123`

## Rulare Aplicație

### Development

Deschideți 2 terminale:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Aplicația va fi disponibilă la: `http://localhost:5173`

### Production

```bash
# Build frontend
npm run build

# Start backend
cd server
npm start
```

## Funcționalități

### Roluri

1. **ROLE_ISF** (Inspectorat Silvic)
   - Creare liste noi
   - Vizualizare liste proprii
   - Upload PDF-uri

2. **ROLE_SCMLA** (Administrare)
   - Dashboard cu statistici
   - Vizualizare toate listele
   - Schimbare status: PRIMITA → VERIFICATA → TRIMISA
   - Export CSV

3. **admin**
   - Toate permisiunile
   - Acces la setări

### Workflow

1. ISF creează o listă nouă (status: PRIMITA)
2. SCMLA verifică lista (status: VERIFICATA)
3. SCMLA trimite lista (status: TRIMISA)

## Structură Bază de Date

### Tabel: users
- id, email, password, role, isf_name, created_at

### Tabel: liste_tiparire
- id, numar_lista, data_lista, isf_name
- numar_autorizatii, pdf_url, pdf_filename
- status, observatii, created_by_email
- verificat_at, verificat_by, trimis_at, trimis_by
- created_date, updated_at

## API Endpoints

### Auth
- `POST /api/auth/login` - Autentificare
- `GET /api/auth/me` - Informații utilizator curent

### Liste
- `GET /api/liste` - Toate listele (SCMLA/admin)
- `GET /api/liste/my-lists` - Listele utilizatorului (ISF)
- `POST /api/liste` - Creare listă nouă (ISF/admin)
- `PATCH /api/liste/:id/status` - Actualizare status (SCMLA/admin)
- `GET /api/liste/stats` - Statistici (SCMLA/admin)

## Tehnologii

- React 18
- React Router v6
- TailwindCSS
- Lucide Icons
- Express.js
- PostgreSQL (pg)
- JWT Authentication
- Multer (file uploads)
- bcryptjs (password hashing)

## Licență

Proprietate privată
