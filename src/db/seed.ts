/**
 * Demo data for local development.
 *
 *   bun run db:seed             seed an empty database
 *   bun run db:seed -- --reset  WIPE every table first, then seed
 *
 * It is a script, not a migration: it talks to Drizzle directly (it needs to
 * back-date rows, which the services deliberately don't allow) and creates the
 * sellers through Better Auth so their passwords are hashed like in production.
 */
import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  activities,
  agencies,
  comments,
  properties,
  propertyImages,
  propertyStateHistory,
  reviews,
  user,
  visitRequests,
  type Currency,
  type NewActivity,
  type OperationType,
  type PropertyStatus,
  type PropertyType,
  type VisitRequestStatus,
} from "@/models";

const DEMO_PASSWORD = "habitat123";
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

// --- sellers ---------------------------------------------------------------------

const SELLERS = [
  {
    name: "Lucía Fernández",
    email: "lucia@inmobiliariadelsol.com",
    fantasyName: "Inmobiliaria del Sol",
    description:
      "Más de 15 años acompañando familias en la compra, venta y alquiler en Capital Federal y zona norte.",
    phone: "011-5555-5555",
    address: "Av. Santa Fe 3200, Palermo, CABA",
  },
  {
    name: "Martín Gómez",
    email: "martin@costapropiedades.com",
    fantasyName: "Costa Propiedades",
    description:
      "Especialistas en la Costa Atlántica: Pinamar, Ostende, Valeria del Mar y Cariló.",
    phone: "02254-48-1234",
    address: "Av. Bunge 1050, Pinamar",
  },
  {
    name: "Valentina Ruiz",
    email: "valentina@urbanonorte.com",
    fantasyName: "Urbano Norte",
    description:
      "Departamentos y locales comerciales en Belgrano, Núñez y Colegiales.",
    phone: "011-4777-3030",
    address: null,
  },
];

// --- properties ------------------------------------------------------------------
// `history` is the lifecycle in chronological order: [status, days ago]. The
// first entry is the creation, the last one must match `status`.

type SeedProperty = {
  seller: number;
  title: string;
  description: string;
  propertyType: PropertyType;
  operationType: OperationType;
  status: PropertyStatus;
  price: number;
  currency: Currency;
  totalArea: number;
  coveredArea: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  age: number | null;
  address: string;
  neighborhood: string;
  tags: string[];
  history: [PropertyStatus, number][];
};

const PROPERTIES: SeedProperty[] = [
  {
    seller: 0,
    title: "Departamento 2 ambientes con vista",
    description:
      "Luminoso departamento de 2 ambientes con balcón corrido y vista abierta. Cocina separada, placard completo y muy buena ubicación cerca del subte.",
    propertyType: "Departamento",
    operationType: "Alquiler",
    status: "PUBLICADA",
    price: 400,
    currency: "USD",
    totalArea: 48,
    coveredArea: 45,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    age: 12,
    address: "Av. Santa Fe 3300",
    neighborhood: "Palermo",
    tags: ["balcón", "apto profesional", "admite mascotas"],
    history: [
      ["BORRADOR", 40],
      ["PUBLICADA", 38],
    ],
  },
  {
    seller: 0,
    title: "Departamento 3 ambientes a estrenar",
    description:
      "Departamento a estrenar de 3 ambientes con amenities: SUM, parrilla y pileta. Cochera cubierta opcional.",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "PUBLICADA",
    price: 185000,
    currency: "USD",
    totalArea: 72,
    coveredArea: 66,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    age: 0,
    address: "Av. Cabildo 2100",
    neighborhood: "Belgrano",
    tags: ["pileta", "cochera", "balcón"],
    history: [
      ["BORRADOR", 25],
      ["PUBLICADA", 22],
    ],
  },
  {
    seller: 0,
    title: "Casa con jardín y pileta",
    description:
      "Casa de 4 ambientes en lote propio con jardín, quincho y pileta. Dos cocheras. Ideal familia numerosa.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "RESERVADA",
    price: 320000,
    currency: "USD",
    totalArea: 380,
    coveredArea: 210,
    rooms: 5,
    bedrooms: 4,
    bathrooms: 3,
    age: 8,
    address: "Echeverría 2450",
    neighborhood: "Belgrano",
    tags: ["pileta", "cochera", "quincho", "jardín"],
    history: [
      ["BORRADOR", 90],
      ["PUBLICADA", 88],
      ["RESERVADA", 6],
    ],
  },
  {
    seller: 0,
    title: "Monoambiente luminoso en Recoleta",
    description:
      "Monoambiente amplio con cocina integrada, a metros de Plaza Francia. Ideal inversión o primera vivienda.",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "VENDIDA",
    price: 78000,
    currency: "USD",
    totalArea: 34,
    coveredArea: 32,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    age: 30,
    address: "Junín 1500",
    neighborhood: "Recoleta",
    tags: ["apto profesional"],
    history: [
      ["BORRADOR", 150],
      ["PUBLICADA", 148],
      ["RESERVADA", 120],
      ["VENDIDA", 105],
    ],
  },
  {
    seller: 0,
    title: "Departamento 2 ambientes en Caballito",
    description:
      "Departamento al frente con balcón, muy luminoso, en edificio con seguridad 24hs y laundry.",
    propertyType: "Departamento",
    operationType: "Alquiler",
    status: "ALQUILADA",
    price: 450000,
    currency: "ARS",
    totalArea: 52,
    coveredArea: 50,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    age: 15,
    address: "Av. Rivadavia 5100",
    neighborhood: "Caballito",
    tags: ["balcón", "admite mascotas"],
    history: [
      ["BORRADOR", 75],
      ["PUBLICADA", 74],
      ["RESERVADA", 60],
      ["ALQUILADA", 55],
    ],
  },
  {
    seller: 0,
    title: "Terreno en esquina",
    description:
      "Terreno en esquina de 300 m² con todos los servicios, a una cuadra de la avenida principal. Apto construcción en altura.",
    propertyType: "Terreno",
    operationType: "Venta",
    status: "PAUSADA",
    price: 95000,
    currency: "USD",
    totalArea: 300,
    coveredArea: null,
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    age: null,
    address: "Zapiola 1800",
    neighborhood: "Colegiales",
    tags: [],
    history: [
      ["BORRADOR", 60],
      ["PUBLICADA", 58],
      ["PAUSADA", 15],
    ],
  },
  {
    seller: 0,
    title: "Casa en construcción (borrador)",
    description:
      "Casa en construcción de 3 ambientes, entrega estimada en seis meses. Aún falta cargar fotos y precio final.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "BORRADOR",
    price: 210000,
    currency: "USD",
    totalArea: 250,
    coveredArea: 140,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    age: 0,
    address: "Virrey del Pino 3300",
    neighborhood: "Belgrano",
    tags: ["jardín"],
    history: [["BORRADOR", 2]],
  },
  {
    seller: 1,
    title: "Casa con pileta a 3 cuadras del mar",
    description:
      "Hermosa casa de 4 ambientes con pileta, parrilla y deck. Totalmente amoblada. A tres cuadras de la playa.",
    propertyType: "Casa",
    operationType: "Venta",
    status: "PUBLICADA",
    price: 120000,
    currency: "USD",
    totalArea: 600,
    coveredArea: 180,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    age: 10,
    address: "Calle de las Gaviotas 450",
    neighborhood: "Ostende",
    tags: ["pileta", "parrilla", "cochera", "admite mascotas"],
    history: [
      ["BORRADOR", 50],
      ["PUBLICADA", 48],
    ],
  },
  {
    seller: 1,
    title: "Casa de veraneo para alquilar",
    description:
      "Casa para 8 personas, 4 dormitorios, jardín y parrilla. Alquiler por temporada con opción anual.",
    propertyType: "Casa",
    operationType: "Alquiler",
    status: "PUBLICADA",
    price: 1800,
    currency: "USD",
    totalArea: 500,
    coveredArea: 160,
    rooms: 5,
    bedrooms: 4,
    bathrooms: 2,
    age: 6,
    address: "Av. del Plata 900",
    neighborhood: "Valeria del Mar",
    tags: ["parrilla", "jardín", "admite mascotas"],
    history: [
      ["BORRADOR", 35],
      ["PUBLICADA", 34],
    ],
  },
  {
    seller: 1,
    title: "Local comercial sobre Av. Bunge",
    description:
      "Local de 60 m² con vidriera sobre la avenida principal, baño y depósito. Excelente zona comercial en temporada.",
    propertyType: "Local",
    operationType: "Alquiler",
    status: "PUBLICADA",
    price: 950000,
    currency: "ARS",
    totalArea: 60,
    coveredArea: 60,
    rooms: 2,
    bedrooms: null,
    bathrooms: 1,
    age: 20,
    address: "Av. Bunge 1180",
    neighborhood: "Pinamar",
    tags: ["apto profesional"],
    history: [
      ["BORRADOR", 20],
      ["PUBLICADA", 19],
    ],
  },
  {
    seller: 1,
    title: "Lote a 200 metros del mar",
    description:
      "Lote de 450 m² en zona residencial tranquila, con luz y agua. Posibilidad de financiación.",
    propertyType: "Terreno",
    operationType: "Venta",
    status: "VENDIDA",
    price: 60000,
    currency: "USD",
    totalArea: 450,
    coveredArea: null,
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    age: null,
    address: "Calle 12 y 3",
    neighborhood: "Cariló",
    tags: [],
    history: [
      ["BORRADOR", 130],
      ["PUBLICADA", 128],
      ["VENDIDA", 70],
    ],
  },
  {
    seller: 1,
    title: "Departamento frente al mar",
    description:
      "Departamento de 2 ambientes con vista directa al mar, balcón y cochera. Edificio con pileta climatizada.",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "CANCELADA",
    price: 140000,
    currency: "USD",
    totalArea: 58,
    coveredArea: 54,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    age: 5,
    address: "Av. Libertador 300",
    neighborhood: "Pinamar",
    tags: ["pileta", "cochera", "balcón"],
    history: [
      ["BORRADOR", 80],
      ["PUBLICADA", 79],
      ["CANCELADA", 30],
    ],
  },
  {
    seller: 2,
    title: "Local en esquina sobre Cabildo",
    description:
      "Local de 90 m² con doble frente en esquina, entrepiso y baño. Alto tránsito peatonal.",
    propertyType: "Local",
    operationType: "Alquiler",
    status: "PUBLICADA",
    price: 1200,
    currency: "USD",
    totalArea: 95,
    coveredArea: 90,
    rooms: 3,
    bedrooms: null,
    bathrooms: 1,
    age: 25,
    address: "Av. Cabildo 1900",
    neighborhood: "Belgrano",
    tags: ["apto profesional"],
    history: [
      ["BORRADOR", 28],
      ["PUBLICADA", 27],
    ],
  },
  {
    seller: 2,
    title: "Departamento 4 ambientes con cochera",
    description:
      "Amplio departamento de 4 ambientes con dependencia de servicio, balcón terraza y dos cocheras.",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "PUBLICADA",
    price: 260000,
    currency: "USD",
    totalArea: 130,
    coveredArea: 118,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    age: 18,
    address: "Av. del Libertador 7400",
    neighborhood: "Núñez",
    tags: ["cochera", "balcón", "pileta"],
    history: [
      ["BORRADOR", 45],
      ["PUBLICADA", 44],
    ],
  },
];

// --- helpers ---------------------------------------------------------------------

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function wipe() {
  await db.execute(sql`
    TRUNCATE TABLE activities, reviews, visit_requests, comments,
      property_state_history, property_images, properties, agencies,
      session, account, verification, "user"
    RESTART IDENTITY CASCADE
  `);
  console.log("Existing data wiped (--reset).");
}

async function createSellers() {
  const created = [];
  for (const seller of SELLERS) {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: seller.email,
        password: DEMO_PASSWORD,
        name: seller.name,
      },
    });

    const [agency] = await db
      .insert(agencies)
      .values({
        userId: user.id,
        fantasyName: seller.fantasyName,
        description: seller.description,
        phone: seller.phone,
        email: seller.email,
        address: seller.address,
        createdAt: daysAgo(200),
      })
      .returning();
    created.push(agency);
  }
  return created;
}

async function createProperties(sellerAgencies: { id: string }[]) {
  const created = [];

  for (const spec of PROPERTIES) {
    const agencyId = sellerAgencies[spec.seller].id;
    const [property] = await db
      .insert(properties)
      .values({
        agencyId,
        title: spec.title,
        description: spec.description,
        propertyType: spec.propertyType,
        operationType: spec.operationType,
        status: spec.status,
        price: String(spec.price),
        currency: spec.currency,
        totalArea: spec.totalArea,
        coveredArea: spec.coveredArea,
        rooms: spec.rooms,
        bedrooms: spec.bedrooms,
        bathrooms: spec.bathrooms,
        age: spec.age,
        address: spec.address,
        neighborhood: spec.neighborhood,
        tags: spec.tags,
        createdAt: daysAgo(spec.history[0][1]),
        updatedAt: daysAgo(spec.history[spec.history.length - 1][1]),
      })
      .returning();

    // Audit log: one row per status the property went through.
    await db.insert(propertyStateHistory).values(
      spec.history.map(([newState, ago], index) => ({
        propertyId: property.id,
        previousState: index === 0 ? null : spec.history[index - 1][0],
        newState,
        createdAt: daysAgo(ago),
      }))
    );

    // Gallery: first image is the cover.
    const imageCount = spec.propertyType === "Terreno" ? 2 : 3;
    await db.insert(propertyImages).values(
      Array.from({ length: imageCount }, (_, index) => ({
        propertyId: property.id,
        imageUrl: `https://picsum.photos/seed/${slug(spec.title)}-${index + 1}/1200/800`,
        order: index,
        isCover: index === 0,
      }))
    );

    created.push({ ...property, spec });
  }

  return created;
}

const byTitle = <T extends { title: string }>(list: T[], title: string): T => {
  const found = list.find((item) => item.title === title);
  if (!found) throw new Error(`Seed property not found: ${title}`);
  return found;
};

async function createInteractions(
  sellerAgencies: { id: string }[],
  created: Awaited<ReturnType<typeof createProperties>>
) {
  const depto = byTitle(created, "Departamento 2 ambientes con vista");
  const casaMar = byTitle(created, "Casa con pileta a 3 cuadras del mar");
  const casaJardin = byTitle(created, "Casa con jardín y pileta");
  const tresAmb = byTitle(created, "Departamento 3 ambientes a estrenar");
  const local = byTitle(created, "Local en esquina sobre Cabildo");

  // Comments (some already answered).
  const seededComments = await db
    .insert(comments)
    .values([
      {
        propertyId: depto.id,
        authorName: "Ana",
        content: "¿Admite mascotas?",
        sellerReply: "Sí, admite mascotas pequeñas.",
        createdAt: daysAgo(9),
      },
      {
        propertyId: depto.id,
        authorName: "Pablo",
        content: "¿Las expensas están incluidas en el precio?",
        createdAt: daysAgo(1),
      },
      {
        propertyId: casaMar.id,
        authorName: "Luis",
        content: "¿Tiene garage cubierto?",
        sellerReply: "Sí, para dos autos.",
        createdAt: daysAgo(12),
      },
      {
        propertyId: casaMar.id,
        authorName: "Carolina",
        content: "¿Se puede visitar este fin de semana?",
        createdAt: daysAgo(0.2),
      },
      {
        propertyId: tresAmb.id,
        authorName: "Jorge",
        content: "¿Aceptan financiación o permuta?",
        createdAt: daysAgo(3),
      },
      {
        propertyId: local.id,
        authorName: "Marina",
        content: "¿Tiene habilitación gastronómica?",
        createdAt: daysAgo(5),
      },
    ])
    .returning();

  // Visit requests, one per status.
  const seededVisits = await db
    .insert(visitRequests)
    .values([
      {
        propertyId: depto.id,
        requesterName: "María",
        requesterPhone: "011-4444-4444",
        proposedDate: daysFromNow(3),
        message: "Puedo por la tarde, después de las 15hs.",
        status: "Pendiente" as VisitRequestStatus,
        createdAt: daysAgo(1),
      },
      {
        propertyId: casaMar.id,
        requesterName: "Pedro",
        requesterPhone: "011-3333-3333",
        proposedDate: daysFromNow(5),
        status: "Confirmada" as VisitRequestStatus,
        createdAt: daysAgo(4),
      },
      {
        propertyId: casaJardin.id,
        requesterName: "Sofía",
        requesterPhone: "011-6666-1212",
        proposedDate: daysAgo(10),
        status: "Realizada" as VisitRequestStatus,
        createdAt: daysAgo(20),
      },
      {
        propertyId: tresAmb.id,
        requesterName: "Diego",
        requesterPhone: "011-5000-9999",
        proposedDate: daysFromNow(2),
        message: "Somos dos personas.",
        status: "Rechazada" as VisitRequestStatus,
        createdAt: daysAgo(6),
      },
      {
        propertyId: local.id,
        requesterName: "Florencia",
        requesterPhone: "011-7000-8000",
        proposedDate: daysFromNow(7),
        status: "Cancelada" as VisitRequestStatus,
        createdAt: daysAgo(8),
      },
    ])
    .returning();

  // Reviews.
  const reviewRows = [
    [0, "Juan", "Muy buena atención, todo claro desde el primer día.", 5, 30],
    [0, "Camila", "Rápidos para responder y muy transparentes.", 5, 18],
    [
      0,
      "Roberto",
      "Buena inmobiliaria, aunque tardaron en las escrituras.",
      4,
      9,
    ],
    [0, "Elena", "Me asesoraron muy bien en el alquiler.", 5, 3],
    [1, "Gustavo", "Excelente conocimiento de la zona.", 5, 25],
    [1, "Natalia", "Nos mostraron varias casas sin presionar.", 4, 14],
    [1, "Hernán", "La casa no era exactamente como en las fotos.", 2, 6],
    [2, "Lorena", "Muy profesionales con el local comercial.", 5, 11],
    [2, "Ricardo", "Atención correcta, nada para destacar.", 3, 4],
  ] as const;

  const seededReviews = await db
    .insert(reviews)
    .values(
      reviewRows.map(([seller, authorName, content, rating, ago]) => ({
        agencyId: sellerAgencies[seller].id,
        authorName,
        content,
        rating,
        createdAt: daysAgo(ago),
      }))
    )
    .returning();

  // Activity feed: one notification per interaction above, plus the status
  // changes. Anything older than a week is already read.
  const feed: NewActivity[] = [];
  const agencyOf = (propertyId: string) =>
    created.find((property) => property.id === propertyId)!.agencyId;
  const titleOf = (propertyId: string) =>
    created.find((property) => property.id === propertyId)!.title;
  const isRead = (date: Date) => Date.now() - date.getTime() > 7 * DAY;

  for (const comment of seededComments) {
    feed.push({
      agencyId: agencyOf(comment.propertyId),
      type: "new_comment",
      propertyId: comment.propertyId,
      referenceId: comment.id,
      content: `${comment.authorName} hizo una consulta en "${titleOf(comment.propertyId)}".`,
      isRead: isRead(comment.createdAt),
      createdAt: comment.createdAt,
    });
  }
  for (const visit of seededVisits) {
    feed.push({
      agencyId: agencyOf(visit.propertyId),
      type: "new_visit",
      propertyId: visit.propertyId,
      referenceId: visit.id,
      content: `${visit.requesterName} solicitó una visita a "${titleOf(visit.propertyId)}".`,
      isRead: isRead(visit.createdAt),
      createdAt: visit.createdAt,
    });
  }
  for (const review of seededReviews) {
    feed.push({
      agencyId: review.agencyId,
      type: "new_review",
      referenceId: review.id,
      content: `${review.authorName} dejó una reseña de ${review.rating} ${
        review.rating === 1 ? "estrella" : "estrellas"
      }.`,
      isRead: isRead(review.createdAt),
      createdAt: review.createdAt,
    });
  }
  for (const property of created) {
    const { history } = property.spec;
    if (history.length < 2) continue;
    const [newState, ago] = history[history.length - 1];
    feed.push({
      agencyId: property.agencyId,
      type: "property_state_change",
      propertyId: property.id,
      referenceId: property.id,
      content: `La propiedad "${property.title}" cambió su estado a ${newState}.`,
      isRead: isRead(daysAgo(ago)),
      createdAt: daysAgo(ago),
    });
  }

  await db.insert(activities).values(feed);

  return {
    comments: seededComments.length,
    visits: seededVisits.length,
    reviews: seededReviews.length,
    activities: feed.length,
  };
}

async function main() {
  if (process.argv.includes("--reset")) {
    await wipe();
  }

  // Users count too: a seed that failed halfway can leave users without agency.
  const [{ agencyCount }] = await db
    .select({ agencyCount: count() })
    .from(agencies);
  const [{ userCount }] = await db.select({ userCount: count() }).from(user);
  if (agencyCount + userCount > 0) {
    console.log(
      "The database already has data. Run `bun run db:seed -- --reset` to wipe it and seed again."
    );
    return;
  }

  const sellerAgencies = await createSellers();
  const createdProperties = await createProperties(sellerAgencies);
  const totals = await createInteractions(sellerAgencies, createdProperties);

  console.log(`
Seed complete:
  agencies    ${sellerAgencies.length}
  properties  ${createdProperties.length}
  comments    ${totals.comments}
  visits      ${totals.visits}
  reviews     ${totals.reviews}
  activities  ${totals.activities}

Demo logins (password for all: ${DEMO_PASSWORD}):
${SELLERS.map((seller) => `  ${seller.email}  (${seller.fantasyName})`).join("\n")}
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
