#!/usr/bin/env bash
set -euo pipefail
# Phase 1 tight loop — login bug (redacted secrets)
FRONT="${FRONT_URL:-http://frontend.141.253.110.210.sslip.io}"
BACK="${BACK_URL:-http://backend.141.253.110.210.sslip.io}"
if [ -z "${VITE_SUPABASE_URL:-}" ] && [ -f frontend/.env ]; then
  set -a; source frontend/.env 2>/dev/null || true; set +a
fi
URL="${VITE_SUPABASE_URL:-https://hrvbsbkcbtgephuntgqd.supabase.co}"
KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"
if [ -z "$KEY" ] && [ -f frontend/.env ]; then KEY=$(grep VITE_SUPABASE_PUBLISHABLE_KEY frontend/.env | cut -d= -f2); fi

echo "== Phase1 login loop =="
FAIL=0
HTML=$(curl -s --max-time 10 "$FRONT/" | tr -d '\0' || true)
if echo "$HTML" | grep -q "<!DOCTYPE html>"; then echo "  PASS doctype present"; else echo "  FAIL fragment only"; FAIL=1; fi
if echo "$HTML" | grep -q 'rel="stylesheet".*/assets/.*\.css'; then echo "  PASS css link in html"; else echo "  FAIL no css link"; FAIL=1; fi

echo "[2] frontend JS contains real Supabase URL"
JS_PATH=$(echo "$HTML" | tr -d '\0' | grep -oE '/assets/index-[^"]+\.js' | head -1)
if [ -z "$JS_PATH" ]; then echo "  FAIL no JS entry found"; FAIL=1; else
  TMPJS=$(mktemp)
  curl -s --max-time 10 "$FRONT$JS_PATH" -o "$TMPJS" || true
  tr -d '\0' < "$TMPJS" > "$TMPJS.clean" && mv "$TMPJS.clean" "$TMPJS"
  if grep -q "hrvbsbkcbtgephuntgqd.supabase.co" "$TMPJS"; then echo "  PASS JS has real URL"; else echo "  FAIL JS has placeholder"; FAIL=1; fi
  if grep -q "placeholder.supabase.co" "$TMPJS"; then echo "  FAIL JS contains placeholder"; FAIL=1; else echo "  PASS no placeholder"; fi
  rm -f "$TMPJS"
fi

echo "[3] Supabase anon key valid"
if [ -z "$KEY" ]; then echo "  SKIP no key"; else
  RESP=$(curl -s --max-time 10 -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"email":"phase1-nonexistent@example.com","password":"wrong"}' || true)
  if echo "$RESP" | grep -q "Invalid API key"; then echo "  FAIL Invalid API key"; FAIL=1; elif echo "$RESP" | grep -q "Invalid login credentials"; then echo "  PASS anon key valid"; else echo "  INFO $(echo "$RESP" | head -c 200)"; fi
fi

echo "[4] backend CORS + auth"
H=$(curl -s --max-time 10 "$BACK/healthz" || true)
if echo "$H" | grep -q '"status":"ok"'; then echo "  PASS backend health $H"; else echo "  FAIL backend health $H"; FAIL=1; fi
CORS=$(curl -s --max-time 10 -i "$BACK/healthz" -H "Origin: $FRONT" 2>&1 | grep -i "access-control-allow-origin" || true)
echo "  CORS: ${CORS:-<none>}"
CODE=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$BACK/api/pipelines" || true)
echo "  GET /api/pipelines without token -> $CODE (expected 401)"

echo "[5] direct Supabase signIn harness"
if [ -n "$KEY" ]; then
  (cd frontend && node --input-type=module -e "
import { createClient } from '@supabase/supabase-js';
const url = process.env.VITE_SUPABASE_URL || '$URL';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '$KEY';
const c = createClient(url, key);
const r = await c.auth.signInWithPassword({email:'phase1-nonexistent@example.com', password:'wrong'});
if (r.error && r.error.message.includes('Invalid login credentials')) console.log('  PASS supabase JS valid key');
else if (r.error) console.log('  FAIL', r.error.message);
else console.log('  UNEXPECTED success');
" 2>&1 | sed "s/$KEY/<REDACTED>/g" || true)
else echo "  SKIP"; fi

if [ $FAIL -eq 0 ]; then echo "== LOOP GREEN =="; exit 0; else echo "== LOOP RED =="; exit 1; fi
