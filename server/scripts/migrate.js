#!/usr/bin/env node
/**
 * Migration runner automat
 * - Citește toate fișierele din server/migrations/ în ordine numerică
 * - Rulează doar cele care nu au fost rulate încă (urmărite în tabelul schema_migrations)
 * - Sigur de rulat de mai multe ori (idempotent)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();

  try {
    // Creare tabel de tracking dacă nu există
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Citire fișiere din migrations/
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 Nu există director migrations/ — nimic de rulat.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // ordine alfabetică = ordine numerică dacă fișierele sunt 001_, 002_ etc.

    if (files.length === 0) {
      console.log('✅ Nu există migrări de rulat.');
      return;
    }

    // Migrări deja aplicate
    const applied = await client.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(applied.rows.map(r => r.filename));

    let ran = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏭  ${file} — deja aplicată, skip`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      console.log(`🔄 Rulare migrare: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ ${file} — aplicată cu succes`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Eroare la ${file}:`, err.message);
        process.exit(1);
      }
    }

    if (ran === 0) {
      console.log('✅ Baza de date este la zi — nicio migrare nouă.');
    } else {
      console.log(`\n✅ ${ran} migrare(i) aplicate cu succes.`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
