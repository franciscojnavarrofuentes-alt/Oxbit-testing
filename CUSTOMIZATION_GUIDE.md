# Guía de Personalización de PacoDEX

## 🎨 Cómo Hacer Modificaciones a Tu DEX

Esta guía te enseña cómo personalizar tu DEX sin romper nada.

---

## 📁 Archivos Principales a Modificar

### 1. Configuración General (`public/config.js`)

**Este es el archivo MÁS IMPORTANTE.** Controla TODO el comportamiento del DEX.

```javascript
window.__RUNTIME_CONFIG__ = {
  // Información del Broker
  "VITE_ORDERLY_BROKER_ID": "pacrypto",  // Tu ID de broker en Orderly
  "VITE_ORDERLY_BROKER_NAME": "PacoDEX", // Nombre de tu DEX

  // URLs Sociales
  "VITE_TELEGRAM_URL": "https://t.me/tu_canal",
  "VITE_DISCORD_URL": "https://discord.gg/tu_server",
  "VITE_TWITTER_URL": "https://x.com/tu_usuario",

  // SEO
  "VITE_SEO_SITE_NAME": "PacoDEX",
  "VITE_SEO_SITE_DESCRIPTION": "Tu descripción aquí",
  "VITE_SEO_SITE_URL": "https://pacryptodex.com",

  // Menús habilitados
  "VITE_ENABLED_MENUS": "Trading,Portfolio,Markets,Swap,Points",

  // Símbolos disponibles
  "VITE_SYMBOL_LIST": "PERP_ETH_USDC,PERP_BTC_USDC,PERP_SOL_USDC",

  // Chains soportadas
  "VITE_ORDERLY_MAINNET_CHAINS": "1,42161,56,900900900",

  // ... más opciones
}
```

**Para hacer cambios:** Solo edita este archivo y haz commit. NO necesitas rebuillear!

### 2. Colores y Tema (`app/styles/theme.css`)

Personaliza los colores de tu DEX:

```css
:root {
  /* Colores principales */
  --orderly-color-primary: #2f3ca0;        /* Color primario */
  --orderly-color-primary-light: #4a5aba;  /* Variante clara */
  --orderly-color-primary-darken: #1f2870; /* Variante oscura */

  /* Trading colors */
  --orderly-color-trading-profit: #6DC4B1;  /* Color para ganancias */
  --orderly-color-trading-loss: #D15A55;    /* Color para pérdidas */

  /* Fondos */
  --orderly-color-base-100: #0F1114;        /* Fondo principal */
  --orderly-color-base-200: #1A1D23;        /* Fondo secundario */

  /* Bordes */
  --orderly-color-border: #2A2E39;

  /* Texto */
  --orderly-color-text-primary: #FFFFFF;
  --orderly-color-text-secondary: #A0A0A0;
}
```

**Cambios comunes:**
- Cambiar color primario del DEX
- Cambiar colores de profit/loss
- Ajustar colores de fondo

### 3. Logos (`public/`)

Reemplaza estos archivos con tus propios logos:

```
public/
├── logo.webp              # Logo principal (navbar)
├── logo-secondary.webp    # Logo secundario (footer, etc)
├── favicon.webp           # Favicon del sitio
```

**Requisitos:**
- Formato: WebP (recomendado) o PNG
- Logo principal: ~200x50px
- Favicon: 32x32px o 48x48px

### 4. Menús Personalizados (`public/config.js`)

Agrega links externos al menú:

```javascript
"VITE_CUSTOM_MENUS": "Comprar Crypto, https://www.onramper.com/buy | Docs, https://docs.tusite.com"
```

Formato: `Nombre1, URL1 | Nombre2, URL2`

---

## 🚀 Flujo de Trabajo para Hacer Cambios

### Cambios Simples (config.js, logos, tema)

```bash
# 1. Edita los archivos
nano public/config.js  # o usa tu editor preferido

# 2. Commit y push
git add -A
git commit -m "Update: cambié colores y logos"
git push origin main

# 3. GitHub Actions despliega automáticamente (2-3 min)
# 4. Visita https://pacryptodex.com
```

### Cambios de Código (componentes React)

```bash
# 1. Clonar el repo localmente (si no lo tienes)
git clone https://github.com/franciscojnavarrofuentes-alt/pacodex.git
cd pacodex

# 2. Instalar dependencias
yarn install

# 3. Correr en desarrollo
yarn dev
# Abre http://localhost:5173

# 4. Hacer cambios en app/
# Por ejemplo: app/components/CustomLeftNav.tsx

# 5. Ver cambios en vivo (hot reload)

# 6. Cuando estés satisfecho, hacer build
yarn build:spa

# 7. Commit y push
git add -A
git commit -m "Feature: agregué nueva funcionalidad"
git push origin main
```

---

## 🎯 Modificaciones Comunes

### 1. Cambiar Descripción del DEX

**Archivo:** `public/config.js`
```javascript
"VITE_APP_DESCRIPTION": "Tu nueva descripción aquí"
```

### 2. Agregar/Quitar Símbolos de Trading

**Archivo:** `public/config.js`
```javascript
"VITE_SYMBOL_LIST": "PERP_ETH_USDC,PERP_BTC_USDC,PERP_SOL_USDC,PERP_DOGE_USDC"
```

Ver lista completa de símbolos: https://orderly.network/markets

### 3. Cambiar Chains Soportadas

**Archivo:** `public/config.js`
```javascript
// Mainnet chains
"VITE_ORDERLY_MAINNET_CHAINS": "1,42161,56,900900900",  // Ethereum, Arbitrum, BSC, Mode

// Testnet chains
"VITE_ORDERLY_TESTNET_CHAINS": "421614,97",  // Arbitrum Sepolia, BSC Testnet
```

Chain IDs:
- Ethereum: 1
- Arbitrum: 42161
- BSC: 56
- Polygon: 137
- Optimism: 10
- Base: 8453
- Mode: 900900900

### 4. Cambiar Idioma por Defecto

**Archivo:** `public/config.js`
```javascript
"VITE_SEO_SITE_LANGUAGE": "es",  // Español
"VITE_SEO_SITE_LOCALE": "es_ES"
```

Idiomas disponibles: en, zh, ja, es, ko, vi, de, fr, ru, id, tr, it, pt, uk, pl, nl

### 5. Habilitar/Deshabilitar Features

**Archivo:** `public/config.js`
```javascript
// Deshabilitar mainnet (solo testnet)
"VITE_DISABLE_MAINNET": "true",

// Deshabilitar wallets Solana
"VITE_DISABLE_SOLANA_WALLETS": "true",

// Habilitar Abstract wallet
"VITE_ENABLE_ABSTRACT_WALLET": "true"
```

### 6. Cambiar Menú del Navbar

**Archivo:** `public/config.js`
```javascript
// Mostrar solo estos menús
"VITE_ENABLED_MENUS": "Trading,Portfolio,Markets,Swap"

// Orden: como aparecen en el string
```

Opciones: Trading, Portfolio, Markets, Swap, Points, Vaults, Rewards, Leaderboard

### 7. Personalizar Colores del Chart

**Archivo:** `public/config.js`
```javascript
"VITE_TRADING_VIEW_COLOR_CONFIG": "{
  \"upColor\": \"#00ff00\",      // Color de velas alcistas
  \"downColor\": \"#ff0000\",    // Color de velas bajistas
  \"pnlUpColor\": \"#00ff00\",
  \"pnlDownColor\": \"#ff0000\",
  \"chartBG\": \"#131722\"       // Fondo del chart
}"
```

---

## 📝 Estructura de Componentes

Si quieres hacer cambios más profundos en el código:

```
app/
├── App.tsx                      # Componente raíz
├── main.tsx                     # Entry point
├── pages/                       # Páginas del DEX
│   ├── Index.tsx                # Home page
│   ├── perp/                    # Trading perpetuos
│   │   ├── Index.tsx            # Página principal de trading
│   │   └── Symbol.tsx           # Trading de símbolo específico
│   ├── portfolio/               # Portafolio
│   ├── markets/                 # Mercados
│   └── ...
├── components/
│   ├── CustomLeftNav.tsx        # Navbar lateral personalizado
│   ├── orderlyProvider/         # Provider de Orderly SDK
│   └── ...
├── utils/
│   ├── config.tsx               # Configuración de UI
│   ├── runtime-config.ts        # Lee window.__RUNTIME_CONFIG__
│   └── ...
└── styles/
    ├── theme.css                # Variables de tema
    └── index.css                # Estilos globales
```

---

## 🔧 Comandos de Desarrollo

```bash
# Desarrollo local
yarn dev               # Corre en http://localhost:5173

# Build
yarn build            # Build normal
yarn build:spa        # Build para GitHub Pages (con rutas estáticas)

# Linting
yarn lint             # Check code style
yarn typecheck        # Check TypeScript errors

# Preview build
yarn preview          # Preview del build en local
```

---

## ⚠️ Cosas Importantes

### NO Edites (a menos que sepas lo que haces):

- `vite.config.ts` - Configuración de build
- `build.ts` - Script de generación de rutas estáticas
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `app/components/orderlyProvider/` - Integración con Orderly SDK

### SÍ Edita con Confianza:

- `public/config.js` - Configuración runtime
- `app/styles/theme.css` - Colores y tema
- Logos en `public/`
- `app/components/CustomLeftNav.tsx` - Navbar custom
- `public/locales/*.json` - Traducciones

---

## 🐛 Debugging

### El sitio no carga

1. Verifica consola del navegador (F12)
2. Verifica que el build terminó: GitHub Actions → ✅
3. Limpia caché: Ctrl+Shift+R

### Cambios no se reflejan

1. Espera 2-3 minutos después del push
2. Verifica que el workflow se ejecutó en Actions
3. Limpia caché del navegador

### Errores de TypeScript

```bash
yarn typecheck
# Muestra errores de tipos
```

### Errores de Build

```bash
yarn build:spa
# Si falla, revisa el error
```

---

## 📚 Recursos

- **Orderly Docs**: https://docs.orderly.network
- **Orderly SDK**: https://www.npmjs.com/package/@orderly.network/react-app
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Vite Docs**: https://vitejs.dev

---

## 🎉 ¡Experimenta!

El mejor way de aprender es experimentando. Haz cambios pequeños, prueba en local con `yarn dev`, y cuando funcione, haz push.

**No tengas miedo de romper cosas** - todo está en git, siempre puedes volver atrás:

```bash
# Ver historial
git log

# Volver a un commit anterior
git reset --hard <commit-hash>

# O crear nueva rama para experimentos
git checkout -b experimento
# Haz cambios...
# Si funciona: git checkout main && git merge experimento
# Si no: git checkout main (los cambios se descartan)
```

¡Éxito con tu DEX! 🚀
