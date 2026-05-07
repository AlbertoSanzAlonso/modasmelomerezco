# Integración NACEX - Guía rápida

## Configuración
- Los datos de acceso y entorno están en `src/constants/nacex.ts`.
- La contraseña se debe poner en la variable de entorno `NACEX_PASSWORD` (no se sube al repo).

## Endpoints disponibles (modo pruebas)
- `/api/nacex?method=get_puntos_shop&cp=XXXXX` → Devuelve puntos de recogida (mock).
- `/api/nacex?method=crear_envio` → Simula la creación de un envío (mock).
- `/api/nacex?method=estado_envio&tracking=XXXX` → Simula la consulta de estado (mock).

## Pasar a entorno real
1. Cambia `entorno` a `produccion` en `src/constants/nacex.ts`.
2. Sustituye los mocks por llamadas reales a la API de NACEX (ver documentación oficial).
3. Solicita a NACEX la activación del usuario y la impresión de etiquetas.

## Notas
- Los endpoints están preparados para extenderse fácilmente con la lógica real.
- No subas la contraseña al repositorio.
- Consulta la documentación oficial de NACEX para detalles de la API.
