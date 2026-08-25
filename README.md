# LIBERTECH — Módulo de Validación Capa 0

Módulo de admisibilidad de casos para Fundación LIBERTECH.

## Seguridad
- Protegido por PIN gate (módulo SEG v1.0)
- Log de accesos persistente
- PIN por defecto: ver constante `CORRECT_PIN` en `src/App.jsx`

## Deploy
```bash
npm install
npm run build
```

Vercel detecta Vite automáticamente.

## Integración con liber-tech.org
Opción recomendada: subdominio `validacion.liber-tech.org` → CNAME a Vercel.

## Stack
- React 18 + Vite
- Persistent Storage API (window.storage)
- No requiere backend para el prototipo

## Estructura del formulario
Secciones A–H + Declaración formal + Scoring automático + Hypothesis Neutrality (H1–H7)

---
Fundación LIBERTECH × NeuroEthics Research Lab × PAI LABS · Ago 2026
