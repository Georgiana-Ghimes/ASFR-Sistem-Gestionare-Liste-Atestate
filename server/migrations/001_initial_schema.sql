-- Migrare 001: Schema inițială completă
-- Aceasta este schema de bază a aplicației ASFR
-- Rulată o singură dată la primul deploy

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'isf', 'cisf', 'scsc')),
    isf_name VARCHAR(255),
    cisf_name VARCHAR(255),
    scsc_name VARCHAR(255),
    has_atestate_role BOOLEAN DEFAULT FALSE,
    has_dre_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS liste_tiparire (
    id SERIAL PRIMARY KEY,
    numar_lista VARCHAR(255) UNIQUE NOT NULL,
    data_lista DATE NOT NULL,
    isf_name VARCHAR(255) NOT NULL,
    numar_autorizatii INTEGER NOT NULL CHECK (numar_autorizatii >= 1),
    pdf_url TEXT NOT NULL,
    pdf_filename VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PRIMITA' CHECK (status IN ('PRIMITA', 'VERIFICATA', 'TRIMISA')),
    tip VARCHAR(50) DEFAULT 'Autorizatii'
        CHECK (tip IN ('Autorizatii', 'Vize', 'Duplicate', 'Schimbare nume')),
    observatii TEXT,
    created_by_email VARCHAR(255),
    verificat_at TIMESTAMP,
    verificat_by VARCHAR(255),
    trimis_at TIMESTAMP,
    trimis_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liste_status ON liste_tiparire(status);
CREATE INDEX IF NOT EXISTS idx_liste_isf ON liste_tiparire(isf_name);
CREATE INDEX IF NOT EXISTS idx_liste_data ON liste_tiparire(data_lista);

CREATE TABLE IF NOT EXISTS atestate (
    id SERIAL PRIMARY KEY,
    numar_atestat VARCHAR(255) UNIQUE NOT NULL,
    numar_atestat_format VARCHAR(50) UNIQUE,
    data_atestat DATE NOT NULL,
    nume_complet VARCHAR(255) NOT NULL,
    din_cadrul VARCHAR(255) NOT NULL DEFAULT '',
    functie VARCHAR(255) NOT NULL,
    pdf_url TEXT NOT NULL,
    pdf_filename VARCHAR(255) NOT NULL,
    all_files JSONB,
    status VARCHAR(20) DEFAULT 'PRIMITA',
    observatii TEXT,
    organization_type VARCHAR(10),
    organization_name VARCHAR(255),
    created_by_email VARCHAR(255),
    verificat_at TIMESTAMP,
    verificat_by VARCHAR(255),
    trimis_at TIMESTAMP,
    trimis_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_atestate_numar ON atestate(numar_atestat);
CREATE INDEX IF NOT EXISTS idx_atestate_data ON atestate(data_atestat);

CREATE TABLE IF NOT EXISTS DRE (
    id SERIAL PRIMARY KEY,
    nr_declaratie TEXT NOT NULL UNIQUE,
    nume_examinator TEXT NOT NULL,
    tip_declaratie TEXT NOT NULL CHECK (tip_declaratie IN ('noua', 'reinnoita', 'modificata')),
    limba_evaluare TEXT NOT NULL,
    material_rulant_teoretic BOOLEAN DEFAULT FALSE,
    material_rulant_practic BOOLEAN DEFAULT FALSE,
    infrastructura_teoretic BOOLEAN DEFAULT FALSE,
    infrastructura_practic BOOLEAN DEFAULT FALSE,
    data_emitere DATE NOT NULL,
    data_expirare DATE NOT NULL,
    all_files JSONB,
    organization_name TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP,
    created_by_email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dre_created_by ON DRE(created_by_email);
CREATE INDEX IF NOT EXISTS idx_dre_nr_declaratie ON DRE(nr_declaratie);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_email ON audit_log(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);
