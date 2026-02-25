# Configuración de GitHub Pages para PacoDEX

## 🎯 Objetivo
Configurar GitHub Pages para que tu DEX funcione en https://pacryptodex.com

## 📋 Pasos de Configuración

### 1. Habilitar GitHub Pages

1. Ve a: https://github.com/franciscojnavarrofuentes-alt/pacodex/settings/pages

2. En **"Source"**:
   - Selecciona: **GitHub Actions**
   - (No selecciones "Deploy from a branch")

3. Guarda los cambios

### 2. Configurar el Dominio Custom

1. En la misma página (GitHub Pages settings)

2. En **"Custom domain"**:
   - Ingresa: `pacryptodex.com`
   - Click "Save"

3. ✅ Marca **"Enforce HTTPS"** (después de que se valide el dominio)

### 3. Configurar DNS en tu Proveedor de Dominio

Ve a tu proveedor de dominio (donde compraste pacryptodex.com) y configura:

#### Opción A: Usando A Records (Recomendado)

Agrega estos 4 registros A:
```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

#### Opción B: Usando CNAME (si prefieres www)

```
Type: CNAME
Name: www
Value: franciscojnavarrofuentes-alt.github.io
```

#### Para www.pacryptodex.com (opcional pero recomendado)

```
Type: CNAME
Name: www
Value: franciscojnavarrofuentes-alt.github.io
```

### 4. Esperar Propagación DNS

- Tiempo: 5-30 minutos (puede tomar hasta 24 horas)
- Verificar: `dig pacryptodex.com` en terminal

### 5. Primer Deployment

El workflow se ejecutará automáticamente cuando:
- ✅ Hagas push a la rama `main`
- ✅ Hagas cambios a cualquier archivo

Para forzar el primer deployment:
```bash
git commit --allow-empty -m "Trigger first deployment"
git push origin main
```

### 6. Verificar Deployment

1. Ve a: https://github.com/franciscojnavarrofuentes-alt/pacodex/actions

2. Verás el workflow "Deploy to GitHub Pages" ejecutándose

3. Cuando termine (✅ verde):
   - Si tienes dominio configurado: https://pacryptodex.com
   - Si no: https://franciscojnavarrofuentes-alt.github.io/pacodex

---

## 🔧 Troubleshooting

### El dominio no funciona

1. **Verifica DNS**:
   ```bash
   dig pacryptodex.com
   ```
   Debe mostrar las IPs de GitHub Pages

2. **Espera más tiempo**: DNS puede tardar hasta 24h

3. **Verifica en GitHub**:
   - Settings → Pages → Custom domain debe mostrar ✅ verde

### El sitio muestra 404

1. **Verifica que el workflow terminó**:
   - Actions → último workflow debe estar ✅

2. **Verifica la rama**: Debe ser `main`

3. **Verifica el CNAME**:
   ```bash
   cat CNAME
   # Debe mostrar: pacryptodex.com
   ```

### Los cambios no se reflejan

1. **Espera 2-3 minutos** después del push

2. **Limpia caché del navegador**: Ctrl+Shift+R

3. **Verifica que el workflow se ejecutó**:
   - Actions → debe haber un nuevo workflow

---

## 📝 Comandos Útiles

### Ver estado del sitio
```bash
curl -I https://pacryptodex.com
```

### Ver DNS
```bash
dig pacryptodex.com
nslookup pacryptodex.com
```

### Verificar certificado SSL
```bash
openssl s_client -connect pacryptodex.com:443 -servername pacryptodex.com
```

---

## 🎉 Una vez configurado

Tu sitio estará disponible en:
- ✅ https://pacryptodex.com (dominio custom)
- ✅ Auto-deploy en cada push a `main`
- ✅ HTTPS forzado
- ✅ CDN global de GitHub

**Tiempo total de configuración:** 5-10 minutos + tiempo de propagación DNS

---

## 🚀 Próximos Pasos

Una vez que tu DEX esté funcionando en el nuevo repo:

1. **Prueba que todo funciona**:
   - Trading
   - Wallet connection
   - Portfolio
   - Todas las páginas

2. **Actualiza enlaces**:
   - Twitter
   - Discord
   - Cualquier sitio que apunte al DEX

3. **Empieza a hacer modificaciones**:
   - Ver `CUSTOMIZATION_GUIDE.md` para aprender a personalizar
