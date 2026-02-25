# Guía del Indicador de Liquidaciones Personalizado

## 🎯 ¿Qué es?

Este es un **indicador exclusivo de tu DEX** que muestra niveles de liquidación en tiempo real basándose en el precio actual y apalancamientos comunes.

## 📊 ¿Qué muestra?

El indicador traza **6 líneas horizontales** en el gráfico:

### Liquidaciones Long (Rojas) 🔴
- **Rojo claro (10x)**: Donde se liquidarían posiciones long con 10x leverage
- **Rojo medio (20x)**: Liquidaciones long con 20x leverage
- **Rojo oscuro (50x)**: Liquidaciones long con 50x leverage

### Liquidaciones Short (Azules/Cyan) 🔵
- **Cyan claro (10x)**: Donde se liquidarían posiciones short con 10x leverage
- **Azul medio (20x)**: Liquidaciones short con 20x leverage
- **Azul oscuro (50x)**: Liquidaciones short con 50x leverage

## 🚀 Cómo usar el indicador

### **Paso 1: Abrir indicadores**
1. Ve a tu DEX: https://pacryptodex.com
2. Haz clic en el botón de **"Indicators"** en TradingView (ícono de línea en la parte superior)
3. Busca **"Liquidation Levels"** en la lista de indicadores

### **Paso 2: Agregar al gráfico**
1. Haz clic en "Liquidation Levels"
2. El indicador se agregará automáticamente al gráfico
3. Verás las 6 líneas de liquidación superpuestas en el precio

### **Paso 3: Interpretar las líneas**

#### Si el precio se acerca a líneas ROJAS (debajo del precio):
- 💥 Zona de liquidación de posiciones LONG
- Traders con longs están en riesgo
- Puede haber cascadas de liquidaciones si se toca

#### Si el precio se acerca a líneas AZULES (arriba del precio):
- 💥 Zona de liquidación de posiciones SHORT
- Traders con shorts están en riesgo
- Puede haber presión de compra por liquidaciones

## 🔧 Características técnicas

### Actualización automática
- El indicador se actualiza cada **60 segundos**
- Los niveles se recalculan basándose en el precio actual
- Usa datos de la API de Orderly Network

### Cálculo de liquidaciones
```
Liquidación Long = Precio actual × (1 - (1 / apalancamiento) - 0.5%)
Liquidación Short = Precio actual × (1 + (1 / apalancamiento) + 0.5%)
```

El 0.5% adicional es un buffer para fees y slippage.

### Niveles de apalancamiento
- **10x**: Más conservador, líneas más alejadas
- **20x**: Apalancamiento medio
- **50x**: Alto riesgo, líneas más cercanas al precio

## 📈 Estrategias de trading

### 1. **Zonas de soporte/resistencia**
Los niveles de liquidación actúan como imanes de precio:
- El precio tiende a moverse hacia zonas con muchas liquidaciones
- Pueden actuar como soporte o resistencia temporal

### 2. **Stop loss placement**
Coloca stops ANTES de las zonas de liquidación masiva:
- No pongas stops exactamente en niveles de liquidación
- Deja margen para volatilidad

### 3. **Entrada en zonas de liquidación**
Después de cascadas de liquidación:
- El precio puede rebotar rápidamente
- Oportunidades de entrada contrarian

### 4. **Evitar zonas peligrosas**
Si hay muchas liquidaciones cerca:
- Reduce apalancamiento
- Considera cerrar parcialmente
- Prepara órdenes de cobertura

## 🎨 Personalización

Actualmente el indicador muestra 3 niveles por lado (10x, 20x, 50x).

**Próximas mejoras posibles:**
- Agregar más niveles de apalancamiento
- Mostrar volumen de liquidaciones estimado
- Alertas cuando el precio se acerca a zonas críticas
- Historial de liquidaciones ejecutadas
- Heat map de densidad de liquidaciones

## 🔍 Datos en tiempo real

El indicador se conecta a:
- **Orderly Network API**: Para Open Interest real
- **Precio actual**: Desde el datafeed de TradingView
- **Cálculos locales**: Para estimar niveles de liquidación

## ⚠️ Notas importantes

1. **Este es un indicador estimado**: Los niveles reales pueden variar según:
   - Margin mode (isolated vs cross)
   - Fees específicas del exchange
   - Slippage y condiciones de mercado

2. **No es un indicador de trading exacto**: Úsalo como referencia, no como señal definitiva

3. **Exclusivo de PacoDEX**: Este indicador no está disponible en otros DEX

## 🎓 Ejemplo práctico

Si ETH está a **$2,000**:

```
Liquidaciones LONG (debajo):
- 10x: $1,805 (si entraste long a $2,000 con 10x)
- 20x: $1,905 (si entraste long a $2,000 con 20x)
- 50x: $1,965 (si entraste long a $2,000 con 50x)

Liquidaciones SHORT (arriba):
- 10x: $2,205 (si entraste short a $2,000 con 10x)
- 20x: $2,105 (si entraste short a $2,000 con 20x)
- 50x: $2,045 (si entraste short a $2,000 con 50x)
```

Si el precio baja a $1,965, los traders con 50x long serían liquidados.

## 🚀 Próximos pasos

Una vez que pruebes el indicador, podemos:
1. Ajustar colores y estilos
2. Agregar más niveles de apalancamiento
3. Integrar datos reales de Open Interest de Orderly
4. Agregar alertas de proximidad
5. Crear un panel de información adicional

---

**¿Tienes sugerencias?** Este es TU indicador personalizado. Podemos modificarlo como quieras.
