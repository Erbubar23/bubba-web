# 🌐 bubba-web | Portafolio Personal Dinámico de Erbubar23

Sitio web y portafolio interactivo de Erick Buendia Barrientos ([@Erbubar23](https://github.com/Erbubar23)).

## ✨ Características Principales

- **Sincronización 100% Automática**: Se conecta directamente a la API REST de GitHub (`api.github.com/users/Erbubar23/repos`). Cada vez que creas o actualizas un repositorio público, aparece en la web sin que tengas que editar código a mano.
- **Filtros Dinámicos por Lenguaje**: Genera automáticamente los botones de filtrado (C++, Python, etc.) con base en los lenguajes reales de tus repositorios.
- **Búsqueda en Tiempo Real**: Busca por nombre de proyecto, tecnologías o descripción.
- **Ordenamiento Inteligente**: Por actividad reciente (`pushed_at`), fecha de creación, estrellas o nombre alfabético.
- **Estadísticas en Vivo**: Contador de repositorios, estrellas totales, forks y seguidores.
- **Diseño Moderno & Audio/Hardware Aesthetic**: Tema oscuro de alto contraste con Tailwind CSS y Lucide Icons.
- **Resiliencia & Cache Inteligente**: Sistema de caché en `localStorage` con expiración automática para prevenir bloqueos por límite de tasa (rate-limits) de la API de GitHub, con botón de recarga forzada.

## 🚀 Despliegue en GitHub Pages

Este repositorio ya incluye `.github/workflows/deploy.yml` para desplegar automáticamente con GitHub Actions:

1. Ve a **Settings > Pages** en el repositorio `bubba-web` en GitHub.
2. En **Build and deployment > Source**, selecciona **GitHub Actions**.
3. ¡Listo! Tu portafolio estará visible en:
   `https://erbubar23.github.io/bubba-web/`
