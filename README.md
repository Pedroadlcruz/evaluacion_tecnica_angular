# Poke SPA

SPA Angular (standalone) que consume PokeAPI para listar Pokémons con paginación real, ver detalles y gestionar favoritos con alias.

## Requisitos previos

- Node.js >= 20.19 (recomendado LTS 20.x)
- npm >= 10
- Angular CLI ~21.0.x

## Instalación

```bash
git clone <repo>
cd evaluacion_tecnica_angular   # o al directorio raíz del proyecto
npm install
```

## Ejecución

```bash
npm start            # alias de ng serve
# o
ng serve
```

App local: http://localhost:4200

## Tests

```bash
npm test   # usa ng test (Vitest) - requiere Node 20+
```

## Rutas principales

- /pokemon
- /favoritos

## Estructura relevante

- `src/app/app.routes.ts` rutas standalone
- `src/app/core` modelos y servicios (PokeAPI, favoritos)
- `src/app/pokemon` páginas y componentes de listado/detalle
- `src/app/favorites` página y componentes de favoritos/alias

## Características

- Listado paginado desde PokeAPI (limit/offset)
- Modal de detalles con >10 características
- Favoritos en `sessionStorage` (máx. 10), edición de alias con validaciones
- Observables/async pipe (sin Promises/async-await)
- UI con Angular Material
