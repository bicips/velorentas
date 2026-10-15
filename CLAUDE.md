# VeloRentas (Bicips)

Aplicación de gestión de alquiler de bicicletas para el Camino de Santiago.

## Stack
- JavaScript vanilla, sin herramientas de build ni frameworks
- SPA publicada en GitHub Pages
- Backend en Supabase
- Debe funcionar offline

---

## REGLAS INNEGOCIABLES

### Disponibilidad y asignación de bicicletas
- El calendario/timeline de bicicletas libres y ocupadas funciona SOLO por
  número de bicicletas en stock por modelo + talla.
- La disponibilidad se calcula contando unidades: stock total (modelo+talla)
  menos reservas activas que solapan en esas fechas.
- La asignación de una bicicleta concreta (código/QR de flota) a una reserva
  se hace SIEMPRE de forma MANUAL.
- La asignación manual es un paso operativo independiente: NUNCA debe
  modificar ni condicionar el cálculo de disponibilidad del calendario.
- Prohibido asignar bicicletas automáticamente, ni como "sugerencia
  autoejecutada", ni al crear, confirmar o finalizar una reserva.
- Cualquier cambio que toque esta lógica requiere mi aprobación explícita
  antes de implementarse.

### Bicicletas averiadas
- Las bicicletas con estado "averiada" se EXCLUYEN del stock disponible.
- El stock disponible por modelo + talla = unidades totales
  - unidades averiadas
  - reservas activas que solapan en esas fechas.
- Al marcar una bicicleta como averiada, el calendario debe recalcularse
  de inmediato para reflejar el stock reducido.
- Al repararla y volver a estado operativo, vuelve a sumar al stock.
- Una bicicleta averiada no puede asignarse manualmente a ninguna reserva.

### Aviso de falta de disponibilidad
- Si el stock disponible de un modelo + talla es insuficiente para las
  reservas activas, la app DEBE mostrar un aviso visible.
- El aviso indica siempre:
  - el modelo y la talla afectados
  - la fecha (o rango de fechas) en la que falta disponibilidad
  - cuántas unidades faltan en cada fecha
- Se comprueba al marcar una bicicleta como averiada, al crear o modificar
  una reserva y al cargar el calendario.
- El aviso solo informa: NUNCA cancela, mueve ni reasigna reservas ni
  bicicletas automáticamente. La decisión es siempre manual.
