# Migrare DRE - Pași de Instalare

## Modificări efectuate

Am adăugat funcționalitatea DRE în aplicație cu următoarele componente:

### 1. Frontend
- ✅ Pagini noi: `AllDre.jsx` și `CreateDre.jsx`
- ✅ Rute noi în `App.jsx`: `/all-dre` și `/create-dre`
- ✅ Meniuri noi în Sidebar pentru DRE
- ✅ Logică specială pentru utilizatorul Florin (florin.hritcu@sigurantaferoviara.ro)
- ✅ Suport pentru rolul `has_dre_role` în Settings
- ✅ Actualizat header-ul aplicației: "Liste/Atestate/DRE"

### 2. Backend
- ✅ Script de migrare: `server/scripts/add-dre-column.js`

## Pași de instalare

### 1. Rulează migrarea bazei de date

```bash
cd server
node scripts/add-dre-column.js
```

Acest script va adăuga coloana `has_dre_role` în tabela `users`.

### 2. Activează rolul DRE pentru Florin

Conectează-te la baza de date și rulează:

```sql
UPDATE users 
SET has_dre_role = TRUE 
WHERE email = 'florin.hritcu@sigurantaferoviara.ro';
```

### 3. Restart aplicația

```bash
# Frontend
npm run dev

# Backend
cd server
npm run dev
```

## Comportament

### Utilizatorul Florin (florin.hritcu@sigurantaferoviara.ro)
- Vede doar: Dashboard, Administrare DRE, Încărcare DRE
- Similar cu Cecilia pentru Atestate

### Administratori (în afară de Cecilia și Florin)
- Văd toate meniurile: Liste, Atestate, DRE, Setări

### Utilizatori ISF/CISF/SCSC
- Pot avea rol de DRE (similar cu rolul de Atestate)
- Dacă au `has_dre_role = TRUE`, văd: "DRE-urile mele" și "Încărcare DRE"

## Următorii pași

Paginile DRE sunt momentan stoc și trebuie implementate funcționalitățile:
- [ ] Tabel pentru gestionarea DRE-urilor
- [ ] Formular pentru încărcarea DRE-urilor
- [ ] API endpoints pentru DRE
- [ ] Tabela `dre` în baza de date
