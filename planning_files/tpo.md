# TPO 2026 — Marketplace Inmobiliario

Trabajo Práctico Integrador de **Aplicaciones Interactivas** (UADE). Se
resuelve en equipos de 2 personas, a lo largo del cuatrimestre, con dos
entregas (ver `cronograma-2026-propuesta.md`: Clase 8 y Clase 16).

Este documento describe **el alcance funcional** del TPO: el dominio del
problema, quiénes lo usan, qué pueden hacer y qué pantallas hacen falta
para eso.

## El problema

Un marketplace inmobiliario: vendedores publican propiedades en venta o
alquiler; interesados las buscan, consultan y piden conocerlas en
persona.

**Referencias** (para bajar la idea a algo conocido, no para copiar
funcionalidad exacta): portales inmobiliarios como **Zonaprop** o
**Argenprop** (búsqueda y filtrado de propiedades, ficha de detalle) +
la lógica de **MercadoLibre** de que cada vendedor tiene su propia página
dentro de la plataforma con sus publicaciones y reputación.

## El dominio

Los conceptos centrales del negocio, con la información mínima que cada
uno guarda (obligatoria salvo que diga "opcional").

### Inmobiliaria

Perfil público de un vendedor: muestra sus datos, sus reseñas y el
listado de propiedades disponibles. Se crea junto con su registro.

- Nombre de fantasía (**único** — no puede repetirse entre inmobiliarias)
- Descripción
- Logo (opcional)
- Teléfono de contacto
- Email de contacto
- Dirección de la oficina (opcional)
- Fecha de creación

El teléfono queda público en el sitio del vendedor: coordinar una visita
o seguir una consulta en detalle se resuelve por fuera de la plataforma
(llamada o WhatsApp) — una respuesta y listo alcanza como intercambio
dentro de la app.

### Reseña

La opinión de un interesado sobre una inmobiliaria, visible en su perfil
público.

- Nombre de quien la escribe
- Contenido
- Calificación (entero de 1 a 5)
- Fecha de creación

### Propiedad

La publicación central del dominio.

- Título
- Descripción
- Tipo: `Casa` / `Departamento` / `Terreno` / `Local`
- Operación: `Venta` / `Alquiler`
- Precio (numérico, mayor a 0)
- Moneda: `ARS` / `USD`
- Dirección (calle y altura)
- Localidad/zona o barrio
- Superficie cubierta en m² (no aplica a Terreno)
- Superficie total/del terreno en m²
- Ambientes, dormitorios y baños (opcionales, no aplican a Terreno)
- Antigüedad en años (opcional)
- Tags (amenities, multi-selección): pileta, cochera, apto profesional,
  admite mascotas, balcón, etc.
- Galería de fotos (mínimo una): múltiples imágenes ordenables, con una
  marcada como portada
- Inmobiliaria dueña (relación)
- Estado (ver máquina de estados abajo)
- Fechas de creación/actualización

Se puede encontrar por tipo, operación, precio, zona, ambientes y
amenities combinados, por texto libre en título/descripción, y ordenar
por precio, fecha de publicación o superficie.

**Ciclo de vida**:

```
BORRADOR ──→ PUBLICADA ──→ RESERVADA ──→ VENDIDA / ALQUILADA
                 │↕
                 PAUSADA
                 │
                 └──→ CANCELADA   (desde cualquier estado activo)
```

Publicada admite pausarse y republicarse sin perder historial. Vendida,
Alquilada o Cancelada siguen admitiendo comentarios nuevos, pero ya no se
editan sus datos principales (título, precio, etc.).

Cada cambio de estado queda registrado (estado anterior, estado nuevo,
fecha y hora) — ese historial es la base del reporte de "tiempo promedio
en mercado" del dashboard.

### Comentario

Una pregunta puntual que un interesado le hace a una propiedad.

- Nombre de quien pregunta
- Contenido
- Fecha de creación
- Respuesta del vendedor (opcional, un único nivel — no hay hilos de
  respuestas). Queda visible ahí mismo, en la propiedad.

### Solicitud de visita

El pedido de un interesado para conocer una propiedad en persona.

- Nombre de quien la pide
- Teléfono de quien la pide (para que el vendedor la contacte y coordine)
- Propiedad (relación)
- Fecha y hora propuesta (no puede ser en el pasado)
- Mensaje (opcional — ej. motivo o disponibilidad horaria)
- Estado: `Pendiente → Confirmada → Realizada`, o `Cancelada`/`Rechazada` en
  cualquier momento
- Fecha de creación

### Actividad

El feed que le avisa al vendedor lo que pasó en su inmobiliaria: nueva
consulta, nueva solicitud de visita, cambio de estado de una propiedad,
nueva reseña. Cada evento genera una notificación in-app (por ejemplo, un
contador de novedades sin leer en la navegación) y queda marcado como
leído o no leído.

### Dashboard de reportes

Información agregada para el vendedor, a partir de sus propiedades y del
historial de estados:

- Cantidad de propiedades por estado actual (Publicada, Reservada,
  Vendida, Alquilada, Pausada, Cancelada)
- Evolución en el tiempo: publicaciones nuevas y ventas/alquileres
  concretados por mes
- Tiempo promedio en mercado: días entre `Publicada` y
  `Vendida`/`Alquilada`

## Usuarios

### Vendedor

Administra una inmobiliaria y sus propiedades. Se registra con:

- Nombre y apellido
- Email (único, se usa para iniciar sesión)
- Contraseña
- Teléfono de contacto (opcional)

Al registrarse crea, en el mismo paso, su inmobiliaria. Puede tener una
sola.

### Interesado

Busca propiedades y contacta al vendedor que le interesa. Se identifica
con lo mínimo necesario en el momento de actuar: su nombre para comentar,
o su nombre y teléfono para pedir una visita — nada de antemano.

## Qué puede hacer cada usuario

### El Vendedor puede

- Registrarse y crear su inmobiliaria, con un nombre de fantasía propio y
  único
- Editar los datos de su inmobiliaria
- Eliminar su inmobiliaria, una vez que no tiene propiedades Publicadas ni
  Reservadas
- Publicar una propiedad nueva
- Editar una propiedad
- Pausar una propiedad y volver a publicarla más adelante
- Dar de baja una propiedad
- Avanzar el estado de una propiedad a medida que avanza la operación
- Responder las consultas que recibe en sus propiedades
- Confirmar o rechazar las solicitudes de visita que recibe, con los
  datos de contacto de quien la pidió
- Recibir una notificación in-app por cada consulta, solicitud de visita
  o reseña nueva, y revisar su feed de actividad
- Ver el dashboard de reportes de su inmobiliaria

### El Interesado puede

- Buscar y filtrar propiedades
- Ver el detalle completo de una propiedad
- Consultar sobre una propiedad, dejando su nombre
- Leer la respuesta del vendedor a su consulta
- Pedir una visita a una propiedad, dejando nombre y teléfono
- Ver el perfil público de una inmobiliaria y sus propiedades publicadas
- Dejar una reseña calificando a una inmobiliaria

## Pantallas mínimas

Las pantallas necesarias para habilitar las acciones de arriba.

### Para el Vendedor

Una vez logueado, navega entre páginas propias (cada una con su propia
ruta):

- **Registro / Login**: crea la cuenta y la inmobiliaria en el mismo
  paso; después, inicia sesión con email y contraseña.
- **Mis propiedades**: ABM de propiedades (crear, editar, pausar,
  republicar, dar de baja, avanzar estado) y edición de los datos de la
  inmobiliaria.
- **Solicitudes de visita**: listado de las recibidas (con nombre y
  teléfono de quien la pidió), con acciones para confirmar/rechazar cada
  una.
- **Consultas**: preguntas recibidas en sus propiedades, para responder.
- **Actividad**: feed de novedades, con notificación in-app (contador de
  sin leer) por cada consulta, visita o reseña nueva.
- **Reportes**: dashboard con los indicadores de su inmobiliaria.

### Para el Interesado

- **Listado de propiedades (home)**: filtros, búsqueda de texto,
  resultados ordenables y paginados.
- **Detalle de propiedad**: fotos, atributos, consultas con sus
  respuestas, botón para pedir una visita.
- **Sitio del vendedor**: datos de contacto de la inmobiliaria, sus
  propiedades publicadas, y sus reseñas.

## Reglas de negocio

- Un Vendedor tiene como máximo una Inmobiliaria.
- El nombre de fantasía de una Inmobiliaria es único en toda la
  plataforma.
- Una Inmobiliaria se puede eliminar cuando no tiene propiedades
  `Publicada` ni `Reservada`.
- Una Propiedad con visitas `Confirmada` pendientes solo admite agregar
  comentarios, no eliminarse ni editar sus datos principales.
- El precio de una Propiedad tiene que ser mayor a 0.
- La superficie (cubierta y total), cuando se informa, tiene que ser
  mayor a 0.
- La fecha de una Solicitud de visita tiene que ser futura.
- La calificación de una Reseña es un entero entre 1 y 5.
- El contenido de un Comentario o de una Reseña es obligatorio.
- Las transiciones de estado (Propiedad y Solicitud de visita) se validan
  siempre del lado del servidor, más allá de lo que muestre la interfaz.

## Criterios de UX mínimos

- Formularios con validaciones y feedback visible
- Estados de carga y vacío en listados
- Confirmación para acciones destructivas
- Soporte mobile

## Mockups (referencia)

### Registro / Login del vendedor

```txt
+----------------------------------------------------+
|  [Logo]                                            |
|                                                    |
|  Email       [__________________________]          |
|  Password    [__________________________] [👁]      |
|                                                    |
|  [ Ingresar ]   ¿No tenés cuenta? [Registrate]     |
|                                                    |
|  Registro: nombre, email, password +               |
|  nombre de fantasía de tu inmobiliaria              |
|                                                    |
|  (Error/validación)                                |
+----------------------------------------------------+
```

El Interesado navega sin pasar por acá: escribe su nombre para comentar,
o nombre y teléfono para pedir una visita, directamente donde hace la
acción.

### Listado de propiedades

```txt
+----------------------------------------------------------------------------------+
| [Tipo ⌄] [Operación ⌄]   [Buscar ____________]        [Ingresar como vendedor] |
+----------------------------------------------------------------------------------+
| Precio [Rango ⌄]  Zona [___]  Ambientes [⌄]  Amenities [ + ]                    |
+----------------------------------------------------------------------------------+
| # | Título                | Tipo    | Operación | Precio      | Zona            |
| 1 | Depto 2 amb con vista | Depto   | Alquiler  | USD 400/mes | Centro          |
| 2 | Casa con pileta       | Casa    | Venta     | USD 120.000 | Ostende         |
+----------------------------------------------------------------------------------+
| Paginación ◀ 1 2 3 ▶                                                              |
+----------------------------------------------------------------------------------+
```

### Detalle de propiedad

```txt
+---------------------------------------------------------------+
| [← Volver]                                  [Pedir visita]    |
+---------------------------------------------------------------+
| [ Foto principal ]                                             |
| [mini] [mini] [mini] [mini]  ← galería, click cambia la principal |
| Depto 2 amb con vista — Alquiler — USD 400/mes                |
| Centro · 45m² · 2 ambientes · [pileta] [cochera]               |
| Descripción...                                                |
+---------------------------------------------------------------+
| Consultas                                                     |
|  - @ana (hoy 10:22): ¿Admite mascotas?                        |
|    ↳ Vendedor: No, disculpá.                                  |
|  [Agregar consulta ____________________________] (Enviar)     |
+---------------------------------------------------------------+
```

### Sitio del vendedor

```txt
+---------------------------------------------------------------+
| [Logo] Inmobiliaria del Sol          ★★★★☆ (12 reseñas)        |
| Descripción                                                    |
| 📞 011-5555-5555   ✉️ info@inmobiliariadelsol.com               |
+---------------------------------------------------------------+
| Sus propiedades                                                |
|  - Depto 2 amb con vista — Alquiler — USD 400/mes              |
|  - Casa con pileta — Venta — USD 120.000                       |
+---------------------------------------------------------------+
| Reseñas                                                        |
|  - @juan: "Muy buena atención" ★★★★★                           |
+---------------------------------------------------------------+
```

### Navegación del vendedor (una página por sección)

```txt
+---------------------------------------------------------------+
| [Logo] Mis propiedades | Visitas | Consultas | Actividad🔔3 | Reportes |
+---------------------------------------------------------------+
```

### Mis propiedades

```txt
+---------------------------------------------------------------+
| Mis propiedades                             [+ Nueva propiedad]|
+---------------------------------------------------------------+
| Depto 2 amb con vista   Alquiler   USD 400/mes    Publicada    |
|   [Editar] [Pausar] [Marcar reservada] [Dar de baja]           |
| Casa con pileta         Venta      USD 120.000    Reservada    |
|   [Editar] [Marcar vendida] [Dar de baja]                      |
+---------------------------------------------------------------+
```

### Solicitudes de visita

```txt
+---------------------------------------------------------------+
| Solicitudes de visita                                          |
+---------------------------------------------------------------+
| Depto 2 amb con vista                                          |
|  @maria — 011-4444-4444 — sáb 16/8 15hs — Pendiente             |
|  [Confirmar] [Rechazar]                                        |
| Casa con pileta                                                |
|  @pedro — 011-3333-3333 — dom 17/8 11hs — Confirmada            |
+---------------------------------------------------------------+
```

### Consultas

```txt
+---------------------------------------------------------------+
| Consultas                                                      |
+---------------------------------------------------------------+
| Depto 2 amb con vista                                          |
|  @ana: "¿Admite mascotas?" (hoy 10:22)                         |
|  [Responder ____________________________] (Enviar)             |
| Casa con pileta                                                |
|  @luis: "¿Tiene garage?" — respondida ✓                        |
+---------------------------------------------------------------+
```

### Actividad

```txt
+---------------------------------------------------------------+
| Actividad                                          🔔 3 nuevas |
+---------------------------------------------------------------+
|  ● Nueva consulta en "Depto 2 amb con vista" (hace 10 min)     |
|  ● Nueva solicitud de visita — Casa con pileta (hace 2 h)      |
|  ○ Nueva reseña de @juan (ayer, ya leída)                      |
+---------------------------------------------------------------+
```

### Reportes

```txt
+---------------------------------------------------------------+
| Reportes                                                        |
+---------------------------------------------------------------+
| Propiedades por estado                                         |
|  Publicada 5   Reservada 1   Vendida 3   Pausada 1              |
|                                                                  |
| Publicaciones y ventas/alquileres por mes                      |
|  Jun ▂▃   Jul ▃▅   Ago ▅▇                                       |
|                                                                  |
| Tiempo promedio en mercado: 45 días                             |
+---------------------------------------------------------------+
```
