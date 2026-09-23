/*
 * Seed de datos de prueba — TPO 
 * -------------------------------------------------------
 Crea 4 inmobiliarias, 20 propiedades (cubriendo los 7 estados del ciclo
 de vida, los 4 tipos y las 2 operaciones), con su historial de estados,
 imágenes, consultas, solicitudes de visita, reseñas y el feed de
 actividad correspondiente a cada evento.
 
 */
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";

//  ruta a la instancia de drizzle
import { db } from "./index";

import {
  agencies,
  reviews,
  properties,
  propertyImages,
  propertyStateHistory,
  comments,
  visitRequests,
  activities,
} from "./schema";

// Tabla de usuarios manejada por Better Auth
import { user } from "./auth-schema";

// ---------------------------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------------------------

/**
 * true  → el seed crea usuarios "vendedor" de prueba desde cero. Es lo más
 *         simple para levantar una base limpia, pero esos usuarios NO van
 *         a poder loguearse por la UI (no se crea la fila de `account` con
 *         password que maneja Better Auth). Sirve para probar todo lo que
 *         no requiere estar logueado como vendedor.
 *
 * false → asume que ya registraste vendedores por el signup normal de la
 *         app. Completá EXISTING_SELLER_USER_IDS con sus ids reales, en el
 *         mismo orden que el array SELLERS de más abajo.
 */
const SEED_USERS = true;

const EXISTING_SELLER_USER_IDS: string[] = [
  // "id-real-del-user-1", // Inmobiliaria del Sol
  // "id-real-del-user-2", // Costa Brava Propiedades
  // "id-real-del-user-3", // Terrazas del Bosque
  // "id-real-del-user-4", // Grupo Atlántico Inmobiliaria
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) =>
  new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
const isUnread = (d: Date) => d.getTime() > daysAgo(3).getTime();
const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/600`;

type PropertyStatus = NonNullable<(typeof properties.$inferInsert)["status"]>;
type VisitStatus = NonNullable<(typeof visitRequests.$inferInsert)["status"]>;

// ---------------------------------------------------------------------------
// DATOS: vendedores + inmobiliarias
// ---------------------------------------------------------------------------

const SELLERS = [
  {
    sellerName: "Marcos Dellacasa",
    sellerEmail: "marcos.dellacasa@example.com",
    agency: {
      fantasyName: "Inmobiliaria del Sol",
      description:
        "Especialistas en Pinamar hace más de 15 años: casas, departamentos y terrenos para vivir todo el año o pasar el verano.",
      phone: "02254-42-5555",
      email: "info@inmobiliariadelsol.com.ar",
      address: "Bunge 1200, Pinamar",
      logoUrl: null as string | null,
    },
  },
  {
    sellerName: "Julieta Ferrero",
    sellerEmail: "julieta.ferrero@example.com",
    agency: {
      fantasyName: "Costa Brava Propiedades",
      description:
        "Propiedades entre los pinos de Cariló: casas de alto standing, alquileres de temporada y terrenos arbolados.",
      phone: "02254-57-0101",
      email: "contacto@costabravapropiedades.com.ar",
      address: "Divisadero 100, Cariló",
      logoUrl: null as string | null,
    },
  },
  {
    sellerName: "Ramiro Aguirre",
    sellerEmail: "ramiro.aguirre@example.com",
    agency: {
      fantasyName: "Terrazas del Bosque",
      description:
        "Venta y alquiler en Valeria del Mar: departamentos a estrenar, casas de fin de semana y locales comerciales.",
      phone: "02254-49-3333",
      email: "hola@terrazasdelbosque.com.ar",
      address: "Job 500, Valeria del Mar",
      logoUrl: null as string | null,
    },
  },
  {
    sellerName: "Carla Nervi",
    sellerEmail: "carla.nervi@example.com",
    agency: {
      fantasyName: "Grupo Atlántico Inmobiliaria",
      description:
        "Más de 20 años acompañando operaciones inmobiliarias en Mar del Plata: departamentos, locales y casas en los mejores barrios.",
      phone: "0223-495-8080",
      email: "info@grupoatlantico.com.ar",
      address: "Av. Colón 3000, Mar del Plata",
      logoUrl: null as string | null,
    },
  },
];

// ---------------------------------------------------------------------------
// DATOS: propiedades
// ---------------------------------------------------------------------------

type PropertySeed = Omit<
  typeof properties.$inferInsert,
  "id" | "agencyId" | "createdAt" | "updatedAt"
> & { agencyIndex: number };

const PROPERTY_SEEDS: PropertySeed[] = [
  // ---- 0: Inmobiliaria del Sol (Pinamar) ----
  {
    agencyIndex: 0,
    title: "Depto 2 ambientes a metros de la playa",
    description:
      "Departamento de 2 ambientes totalmente reciclado, a pocas cuadras del mar. Ideal para alquiler todo el año.",
    propertyType: "Departamento",
    operationType: "Alquiler",
    status: "PUBLICADA",
    price: "450000.00",
    currency: "ARS",
    totalArea: 48,
    coveredArea: 45,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    age: 12,
    address: "Av. Bunge 1450",
    neighborhood: "Centro, Pinamar",
    tags: ["balcón", "admite mascotas"],
  },
  {
    agencyIndex: 0,
    title: "Casa con pileta a dos cuadras del mar",
    description:
      "Casa de 3 dormitorios con pileta y parque, a dos cuadras del mar. Ambientes amplios y muy luminosos.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "RESERVADA",
    price: "185000.00",
    currency: "USD",
    totalArea: 400,
    coveredArea: 160,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    age: 9,
    address: "Rivadavia 220",
    neighborhood: "Pinamar Norte",
    tags: ["pileta", "cochera", "parrilla"],
  },
  {
    agencyIndex: 0,
    title: "Casa a estrenar con jardín",
    description:
      "Casa a estrenar con jardín y cochera doble, terminaciones de primera calidad.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "VENDIDA",
    price: "210000.00",
    currency: "USD",
    totalArea: 350,
    coveredArea: 140,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    age: 1,
    address: "Del Odiseo 88",
    neighborhood: "Pinamar",
    tags: ["jardín", "cochera"],
  },
  {
    agencyIndex: 0,
    title: "Monoambiente luminoso",
    description:
      "Monoambiente luminoso, ideal para uso permanente o inversión. A metros del centro comercial.",
    propertyType: "Departamento",
    operationType: "Alquiler",
    status: "PAUSADA",
    price: "320000.00",
    currency: "ARS",
    totalArea: 28,
    coveredArea: 26,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    age: 20,
    address: "Jason 700",
    neighborhood: "Centro, Pinamar",
    tags: ["amoblado"],
  },
  {
    agencyIndex: 0,
    title: "Lote en zona residencial",
    description:
      "Lote en zona residencial tranquila, apto para construir la casa que soñás.",
    propertyType: "Terreno",
    operationType: "Venta",
    status: "BORRADOR",
    price: "60000.00",
    currency: "USD",
    totalArea: 600,
    coveredArea: null,
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    age: null,
    address: "Circunvalación km 3",
    neighborhood: "Pinamar",
    tags: [],
  },

  // ---- 1: Costa Brava Propiedades (Cariló) ----
  {
    agencyIndex: 1,
    title: "Casa entre pinos para temporada",
    description:
      "Casa entre pinos para alquiler de temporada, con pileta y parrilla techada. Capacidad para 8 personas.",
    propertyType: "Casa",
    operationType: "Alquiler",
    status: "PUBLICADA",
    price: "2500.00",
    currency: "USD",
    totalArea: 500,
    coveredArea: 180,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 3,
    age: 15,
    address: "Av. Cerezo 340",
    neighborhood: "Cariló",
    tags: ["pileta", "parrilla", "vista al mar"],
  },
  {
    agencyIndex: 1,
    title: "Casa de estilo bosque con doble altura",
    description:
      "Casa de estilo bosque con doble altura, living integrado y amplio parque arbolado.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "PUBLICADA",
    price: "450000.00",
    currency: "USD",
    totalArea: 800,
    coveredArea: 220,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 3,
    age: 6,
    address: "Boyero 120",
    neighborhood: "Cariló",
    tags: ["pileta", "cochera", "seguridad 24hs"],
  },
  {
    agencyIndex: 1,
    title: "Departamento de categoría con vista al bosque",
    description:
      "Departamento de categoría con vista al bosque, totalmente amoblado y equipado.",
    propertyType: "Departamento",
    operationType: "Alquiler",
    status: "ALQUILADA",
    price: "1800.00",
    currency: "USD",
    totalArea: 65,
    coveredArea: 60,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    age: 4,
    address: "Divisadero 50",
    neighborhood: "Cariló",
    tags: ["balcón", "amoblado"],
  },
  {
    agencyIndex: 1,
    title: "Terreno arbolado cerca del centro comercial",
    description:
      "Terreno arbolado a metros del centro comercial de Cariló, listo para construir.",
    propertyType: "Terreno",
    operationType: "Venta",
    status: "PUBLICADA",
    price: "95000.00",
    currency: "USD",
    totalArea: 900,
    coveredArea: null,
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    age: null,
    address: "Castaño 210",
    neighborhood: "Cariló",
    tags: [],
  },
  {
    agencyIndex: 1,
    title: "Casa con detalles de diseño",
    description:
      "Casa con detalles de diseño, pileta climatizada y cochera para dos autos.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "CANCELADA",
    price: "320000.00",
    currency: "USD",
    totalArea: 600,
    coveredArea: 190,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 3,
    age: 10,
    address: "Alelí 90",
    neighborhood: "Cariló",
    tags: ["pileta", "cochera"],
  },

  // ---- 2: Terrazas del Bosque (Valeria del Mar) ----
  {
    agencyIndex: 2,
    title: "Departamento a estrenar frente a la plaza",
    description:
      "Departamento a estrenar frente a la plaza principal, con balcón terraza y cochera.",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "PUBLICADA",
    price: "130000.00",
    currency: "USD",
    totalArea: 55,
    coveredArea: 52,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    age: 0,
    address: "Marco Polo 300",
    neighborhood: "Valeria del Mar",
    tags: ["balcón", "cochera"],
  },
  {
    agencyIndex: 2,
    title: "Casa de temporada con quincho",
    description:
      "Casa de temporada con quincho y parque cercado, ideal para grupos familiares.",
    propertyType: "Casa",
    operationType: "Alquiler",
    status: "RESERVADA",
    price: "1200000.00",
    currency: "ARS",
    totalArea: 350,
    coveredArea: 130,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    age: 18,
    address: "Los Horneros 45",
    neighborhood: "Valeria del Mar",
    tags: ["quincho", "parrilla", "admite mascotas"],
  },
  {
    agencyIndex: 2,
    title: "Local comercial en paseo peatonal",
    description:
      "Local comercial en el paseo peatonal, excelente visibilidad y gran afluencia de público.",
    propertyType: "Local",
    operationType: "Alquiler",
    status: "PUBLICADA",
    price: "550000.00",
    currency: "ARS",
    totalArea: 60,
    coveredArea: 60,
    rooms: null,
    bedrooms: null,
    bathrooms: 1,
    age: 25,
    address: "Paseo Libertad 10",
    neighborhood: "Valeria del Mar",
    tags: ["apto profesional"],
  },
  {
    agencyIndex: 2,
    title: "Departamento de un ambiente cerca del mar",
    description:
      "Departamento de un ambiente a pocas cuadras del mar, apto profesional.",
    propertyType: "Departamento",
    operationType: "Alquiler",
    status: "PAUSADA",
    price: "380000.00",
    currency: "ARS",
    totalArea: 32,
    coveredArea: 30,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    age: 15,
    address: "Job 220",
    neighborhood: "Valeria del Mar",
    tags: ["balcón", "apto profesional"],
  },
  {
    agencyIndex: 2,
    title: "Casa con potencial de ampliación",
    description:
      "Casa con potencial de ampliación, terreno amplio en zona residencial.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "BORRADOR",
    price: "140000.00",
    currency: "USD",
    totalArea: 300,
    coveredArea: 90,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    age: 30,
    address: "Micomicona 15",
    neighborhood: "Valeria del Mar",
    tags: ["cochera"],
  },

  // ---- 3: Grupo Atlántico Inmobiliaria (Mar del Plata) ----
  {
    agencyIndex: 3,
    title: "Departamento con balcón y cochera",
    description:
      "Departamento con balcón y cochera fija, muy luminoso, a metros de la playa.",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "VENDIDA",
    price: "145000.00",
    currency: "USD",
    totalArea: 70,
    coveredArea: 65,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    age: 10,
    address: "Av. Colón 3200",
    neighborhood: "Centro, Mar del Plata",
    tags: ["balcón", "cochera"],
  },
  {
    agencyIndex: 3,
    title: "Local a la calle en zona céntrica",
    description:
      "Local a la calle en zona céntrica, ideal para comercio o inversión.",
    propertyType: "Local",
    operationType: "Venta",
    status: "PUBLICADA",
    price: "180000.00",
    currency: "USD",
    totalArea: 90,
    coveredArea: 90,
    rooms: null,
    bedrooms: null,
    bathrooms: 1,
    age: 40,
    address: "San Martín 2500",
    neighborhood: "Centro, Mar del Plata",
    tags: ["apto profesional"],
  },
  {
    agencyIndex: 3,
    title: "Casa de dos plantas con parrilla",
    description:
      "Casa de dos plantas con parrilla y parque, a metros de la playa.",
    propertyType: "Casa",
    operationType: "Alquiler",
    status: "ALQUILADA",
    price: "500000.00",
    currency: "ARS",
    totalArea: 250,
    coveredArea: 140,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    age: 22,
    address: "Falucho 1800",
    neighborhood: "Los Troncos, Mar del Plata",
    tags: ["parrilla", "cochera", "admite mascotas"],
  },
  {
    agencyIndex: 3,
    title: "Departamento con vista al mar",
    description:
      "Departamento con vista al mar, balcón corrido y cochera cubierta.",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "RESERVADA",
    price: "210000.00",
    currency: "USD",
    totalArea: 80,
    coveredArea: 75,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    age: 5,
    address: "Bulevar Marítimo 456",
    neighborhood: "La Perla, Mar del Plata",
    tags: ["vista al mar", "balcón"],
  },
  {
    agencyIndex: 3,
    title: "Terreno para desarrollo",
    description:
      "Terreno para desarrollo inmobiliario, gran superficie en zona de crecimiento.",
    propertyType: "Terreno",
    operationType: "Venta",
    status: "CANCELADA",
    price: "250000.00",
    currency: "USD",
    totalArea: 1200,
    coveredArea: null,
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    age: null,
    address: "Ruta 88 km 5",
    neighborhood: "Mar del Plata",
    tags: [],
  },
];

// ---------------------------------------------------------------------------
// DATOS: pools para consultas, visitas y reseñas
// ---------------------------------------------------------------------------

const COMMENT_POOL: { author: string; content: string; reply?: string }[] = [
  {
    author: "Ana",
    content: "¿Admite mascotas?",
    reply: "No, la propiedad no admite mascotas, disculpá.",
  },
  {
    author: "Juan",
    content: "¿Tiene cochera?",
    reply: "Sí, cuenta con cochera cubierta para un auto.",
  },
  {
    author: "Sofía",
    content: "¿Está disponible para visitar este fin de semana?",
  },
  {
    author: "Martín",
    content: "¿El precio incluye expensas?",
    reply: "No, las expensas se abonan aparte.",
  },
  { author: "Carla", content: "¿Cuántos metros cuadrados cubiertos tiene?" },
  {
    author: "Nico",
    content: "¿Se puede pagar en pesos?",
    reply: "Sí, tomamos el valor al tipo de cambio del día.",
  },
  { author: "Vale", content: "¿La propiedad está amoblada?" },
  { author: "Pedro", content: "¿Hace cuánto que está publicada?" },
];

const VISITOR_POOL = [
  { name: "María López", phone: "011-4444-4444" },
  { name: "Pedro Gómez", phone: "011-3333-3333" },
  { name: "Lucía Fernández", phone: "0223-555-1212" },
  { name: "Diego Torres", phone: "011-2222-1111" },
  { name: "Rocío Medina", phone: "02254-60-7070" },
];

const REVIEW_POOL = [
  {
    author: "Juan Pérez",
    rating: 5,
    content: "Muy buena atención, todo el proceso fue rápido y transparente.",
  },
  {
    author: "Lucía Gómez",
    rating: 4,
    content: "Buena comunicación, aunque tardaron en responder al principio.",
  },
  {
    author: "Martín Sosa",
    rating: 5,
    content: "Recomendable, nos ayudaron a encontrar justo lo que buscábamos.",
  },
  {
    author: "Carolina Díaz",
    rating: 3,
    content: "La propiedad estaba bien pero coordinar la visita fue lento.",
  },
  {
    author: "Fede Ríos",
    rating: 5,
    content: "Excelente trato de principio a fin.",
  },
  {
    author: "Agustina Paz",
    rating: 2,
    content: "Esperaba más información sobre la propiedad antes de ir a verla.",
  },
];

// ---------------------------------------------------------------------------
// LÓGICA: historial de estados y solicitudes de visita según el estado
// ---------------------------------------------------------------------------

function transitions(status: PropertyStatus, i: number) {
  const j = i % 5;
  const mk = (
    previousState: PropertyStatus,
    newState: PropertyStatus,
    d: number
  ) => ({
    previousState,
    newState,
    createdAt: daysAgo(Math.max(d - j, 1)),
  });
  switch (status) {
    case "BORRADOR":
      return [];
    case "PUBLICADA":
      return [mk("BORRADOR", "PUBLICADA", 45)];
    case "PAUSADA":
      return [mk("BORRADOR", "PUBLICADA", 60), mk("PUBLICADA", "PAUSADA", 12)];
    case "RESERVADA":
      return [mk("BORRADOR", "PUBLICADA", 50), mk("PUBLICADA", "RESERVADA", 9)];
    case "VENDIDA":
      return [
        mk("BORRADOR", "PUBLICADA", 130),
        mk("PUBLICADA", "RESERVADA", 40),
        mk("RESERVADA", "VENDIDA", 6),
      ];
    case "ALQUILADA":
      return [
        mk("BORRADOR", "PUBLICADA", 110),
        mk("PUBLICADA", "RESERVADA", 35),
        mk("RESERVADA", "ALQUILADA", 4),
      ];
    case "CANCELADA":
      return [
        mk("BORRADOR", "PUBLICADA", 70),
        mk("PUBLICADA", "CANCELADA", 25),
      ];
    default:
      return [];
  }
}

type VisitPlanItem = {
  status: VisitStatus;
  proposedDate: Date;
  message?: string;
  createdAtDaysAgo?: number;
};

// Nota: para las visitas "Realizada"/"Cancelada"/"Rechazada" uso una fecha
// propuesta en el pasado a propósito — son visitas históricas que ya
// pasaron, y esa regla de negocio ("no puede ser en el pasado") aplica al
// momento de crear la solicitud, no a datos de ejemplo que simulan hechos
// ya ocurridos.
function visitPlanFor(status: PropertyStatus): VisitPlanItem[] {
  switch (status) {
    case "PUBLICADA":
      return [
        {
          status: "Pendiente",
          proposedDate: daysFromNow(4),
          message: "Podemos ir el fin de semana.",
        },
        { status: "Confirmada", proposedDate: daysFromNow(7) },
      ];
    case "RESERVADA":
      return [
        {
          status: "Realizada",
          proposedDate: daysAgo(10),
          createdAtDaysAgo: 14,
        },
      ];
    case "VENDIDA":
    case "ALQUILADA":
      return [
        {
          status: "Realizada",
          proposedDate: daysAgo(20),
          createdAtDaysAgo: 25,
        },
      ];
    case "PAUSADA":
      return [
        {
          status: "Cancelada",
          proposedDate: daysFromNow(2),
          createdAtDaysAgo: 15,
        },
      ];
    case "CANCELADA":
      return [
        {
          status: "Rechazada",
          proposedDate: daysFromNow(3),
          createdAtDaysAgo: 20,
        },
      ];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1) Limpieza de corridas anteriores ---------------------------------------
  const agencyNames = SELLERS.map((s) => s.agency.fantasyName);
  if (SEED_USERS) {
    const emails = SELLERS.map((s) => s.sellerEmail);
    // Borrar el usuario cascadea a su inmobiliaria y a todo lo que cuelga de ella
    await db.delete(user).where(inArray(user.email, emails));
  } else {
    await db.delete(agencies).where(inArray(agencies.fantasyName, agencyNames));
  }

  // 2) Usuarios vendedor ------------------------------------------------------
  let sellerUserIds: string[];
  if (SEED_USERS) {
    const userRows = SELLERS.map((s) => ({
      id: randomUUID(),
      name: s.sellerName,
      email: s.sellerEmail,
      emailVerified: true,
      image: null as string | null,
      createdAt: daysAgo(200),
      updatedAt: daysAgo(200),
    }));
    // Si tu auth-schema.ts tiene otros nombres de columna, TypeScript te lo
    // va a marcar acá abajo: ajustá este objeto según corresponda.
    await db.insert(user).values(userRows);
    sellerUserIds = userRows.map((u) => u.id);
  } else {
    if (EXISTING_SELLER_USER_IDS.length !== SELLERS.length) {
      throw new Error(
        `SEED_USERS está en false: completá EXISTING_SELLER_USER_IDS con ${SELLERS.length} ids (uno por vendedor, en el mismo orden que SELLERS).`
      );
    }
    sellerUserIds = EXISTING_SELLER_USER_IDS;
  }

  // 3) Inmobiliarias -----------------------------------------------------------
  const agencyIds = SELLERS.map(() => randomUUID());
  const agencyRows = SELLERS.map((s, i) => ({
    id: agencyIds[i],
    userId: sellerUserIds[i],
    ...s.agency,
    createdAt: daysAgo(400 - i * 20),
    updatedAt: daysAgo(30),
  }));
  await db.insert(agencies).values(agencyRows);

  // 4) Reseñas ------------------------------------------------------------------
  const reviewRows: (typeof reviews.$inferInsert)[] = [];
  agencyIds.forEach((agencyId, i) => {
    for (let k = 0; k < 3; k++) {
      const r = REVIEW_POOL[(i * 3 + k) % REVIEW_POOL.length];
      reviewRows.push({
        id: randomUUID(),
        agencyId,
        authorName: r.author,
        content: r.content,
        rating: r.rating,
        createdAt: daysAgo(5 + k * 17 + i * 3),
      });
    }
  });
  await db.insert(reviews).values(reviewRows);

  // 5) Propiedades ---------------------------------------------------------------
  const propertyIds = PROPERTY_SEEDS.map(() => randomUUID());
  const propertyInsertRows = PROPERTY_SEEDS.map((p, i) => {
    const { agencyIndex, ...rest } = p;
    return {
      id: propertyIds[i],
      agencyId: agencyIds[agencyIndex],
      ...rest,
      createdAt: daysAgo(150 - i),
      updatedAt: daysAgo(5 + (i % 10)),
    };
  });
  await db.insert(properties).values(propertyInsertRows);

  // 6) Imágenes, historial, consultas, visitas y actividad -----------------------
  const propertyImageRows: (typeof propertyImages.$inferInsert)[] = [];
  const historyRows: (typeof propertyStateHistory.$inferInsert)[] = [];
  const commentRows: (typeof comments.$inferInsert)[] = [];
  const visitRows: (typeof visitRequests.$inferInsert)[] = [];
  const activityRows: (typeof activities.$inferInsert)[] = [];

  PROPERTY_SEEDS.forEach((p, i) => {
    const propertyId = propertyIds[i];
    const agencyId = agencyIds[p.agencyIndex];

    // Imágenes (2, o 3 en una de cada tres propiedades, para variar)
    const nImages = i % 3 === 0 ? 3 : 2;
    for (let idx = 0; idx < nImages; idx++) {
      propertyImageRows.push({
        id: randomUUID(),
        propertyId,
        imageUrl: img(`prop-${i + 1}-${idx}`),
        order: idx,
        isCover: idx === 0,
      });
    }

    // Historial de estados
    transitions(p.status as PropertyStatus, i).forEach((h) => {
      historyRows.push({
        id: randomUUID(),
        propertyId,
        previousState: h.previousState,
        newState: h.newState,
        createdAt: h.createdAt,
      });
      activityRows.push({
        id: randomUUID(),
        agencyId,
        type: "property_state_change",
        content: `"${p.title}" pasó de ${h.previousState} a ${h.newState}`,
        isRead: !isUnread(h.createdAt),
        createdAt: h.createdAt,
      });
    });

    // Consultas (no hay consultas en propiedades que siguen en Borrador)
    if (p.status !== "BORRADOR") {
      const nComments = 1 + (i % 3); // entre 1 y 3
      for (let k = 0; k < nComments; k++) {
        const c = COMMENT_POOL[(i + k) % COMMENT_POOL.length];
        const createdAt = daysAgo((i % 20) + k * 3);
        commentRows.push({
          id: randomUUID(),
          propertyId,
          authorName: c.author,
          content: c.content,
          sellerReply: c.reply ?? null,
          createdAt,
          updatedAt: createdAt,
        });
        activityRows.push({
          id: randomUUID(),
          agencyId,
          type: "new_comment",
          content: `Nueva consulta de ${c.author} en "${p.title}"`,
          isRead: !isUnread(createdAt),
          createdAt,
        });
      }
    }

    // Solicitudes de visita
    visitPlanFor(p.status as PropertyStatus).forEach((v, k) => {
      const visitor = VISITOR_POOL[(i + k) % VISITOR_POOL.length];
      const createdAt =
        v.createdAtDaysAgo != null ? daysAgo(v.createdAtDaysAgo) : daysAgo(1);
      visitRows.push({
        id: randomUUID(),
        propertyId,
        requesterName: visitor.name,
        requesterPhone: visitor.phone,
        proposedDate: v.proposedDate,
        message: v.message ?? null,
        status: v.status,
        createdAt,
      });
      activityRows.push({
        id: randomUUID(),
        agencyId,
        type: "new_visit",
        content: `Nueva solicitud de visita de ${visitor.name} para "${p.title}"`,
        isRead: !isUnread(createdAt),
        createdAt,
      });
    });
  });

  // Actividad generada por cada reseña
  reviewRows.forEach((r) => {
    activityRows.push({
      id: randomUUID(),
      agencyId: r.agencyId,
      type: "new_review",
      content: `Nueva reseña de ${r.authorName} (${r.rating}★)`,
      isRead: !isUnread(r.createdAt as Date),
      createdAt: r.createdAt as Date,
    });
  });

  await db.insert(propertyImages).values(propertyImageRows);
  if (historyRows.length)
    await db.insert(propertyStateHistory).values(historyRows);
  if (commentRows.length) await db.insert(comments).values(commentRows);
  if (visitRows.length) await db.insert(visitRequests).values(visitRows);
  await db.insert(activities).values(activityRows);

  console.log("Seed completado:");
  console.log(`   ${agencyRows.length} inmobiliarias`);
  console.log(`   ${propertyInsertRows.length} propiedades`);
  console.log(`   ${propertyImageRows.length} imágenes`);
  console.log(`   ${historyRows.length} cambios de estado`);
  console.log(`   ${commentRows.length} consultas`);
  console.log(`   ${visitRows.length} solicitudes de visita`);
  console.log(`   ${reviewRows.length} reseñas`);
  console.log(`   ${activityRows.length} actividades`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error corriendo el seed:", err);
    process.exit(1);
  });
