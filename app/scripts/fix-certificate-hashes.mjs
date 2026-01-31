#!/usr/bin/env node
/**
 * Fixes certificate hash mismatch for existing certificates.
 * Run: node scripts/fix-certificate-hashes.mjs [email] [password]
 * Example: node scripts/fix-certificate-hashes.mjs superadmin@example.com yourpassword
 * Uses SUPABASE_SERVICE_ROLE_KEY if set (bypasses RLS), else signs in with email/password.
 */
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
if (!existsSync(envPath)) {
  console.error('Missing .env file.');
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [key, ...vals] = line.split('=');
      return [key?.trim(), vals.join('=').trim().replace(/^["']|["']$/g, '')];
    })
);

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey || anonKey);

function normalizeDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

function createHash(cert) {
  const data = JSON.stringify({
    studentName: cert.student_name,
    courseName: cert.course_name,
    institutionName: cert.institution_name,
    issueDate: normalizeDate(cert.issue_date),
    uniqueId: cert.unique_id,
  });
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

async function main() {
  if (!serviceKey) {
    const [email, password] = process.argv.slice(2);
    if (!email || !password) {
      console.error('Usage: node scripts/fix-certificate-hashes.mjs <email> <password>');
      console.error('Or set SUPABASE_SERVICE_ROLE_KEY in .env (from Supabase Dashboard > Settings > API)');
      process.exit(1);
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      console.error('Login failed:', authError.message);
      process.exit(1);
    }
    console.log('Logged in. Fixing hashes...');
  }

  const { data: certs, error: certError } = await supabase
    .from('certificates')
    .select('id, unique_id, student_name, course_name, institution_name, issue_date');
  if (certError) {
    console.error('Failed to fetch certificates:', certError.message);
    process.exit(1);
  }
  if (!certs?.length) {
    console.log('No certificates to fix.');
    return;
  }
  let fixed = 0;
  for (const cert of certs) {
    const newHash = createHash(cert);
    const { error } = await supabase
      .from('blockchain_anchors')
      .update({ hash: newHash })
      .eq('unique_id', cert.unique_id);
    if (error) {
      console.warn(`Could not update anchor for ${cert.unique_id}:`, error.message);
    } else {
      fixed++;
      console.log(`Fixed: ${cert.unique_id}`);
    }
  }
  console.log(`\nDone. Fixed ${fixed}/${certs.length} certificate hashes.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
