# fronted-rc

Frontend base para plataforma de ranking academico usando Next.js 16, TypeScript y Tailwind CSS.

## Configuracion
1. Crea archivo `.env.local` desde `.env.local.example`.
2. Ajusta `NEXT_PUBLIC_API_URL` si tu backend corre en otra URL.
3. Instala dependencias (ya instaladas en este scaffold):
	`npm install`
4. Ejecuta el servidor de desarrollo:
	`npm run dev`

## Rutas base creadas
- /
- /login
- /admin
- /docente
- /alumno
- /ranking

## Estructura inicial
- `src/app`: rutas y paginas.
- `src/components`: componentes reutilizables.
- `src/features`: modulos por dominio.
- `src/lib`: cliente API y utilidades.
- `src/types`: tipos TypeScript compartidos.
