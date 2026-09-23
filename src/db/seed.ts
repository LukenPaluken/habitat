import { db } from "./index";
import {
  agencies,
  properties,
  propertyImages,
  propertyStateHistory,
  comments,
  visitRequests,
  reviews,
  activities,
} from "./schema";
import { user, session, account } from "./auth-schema";
import { auth } from "@/lib/auth";

async function runSeed() {
  console.log("Starting database seeding...");

  // 1. Clean existing records in dependency order
  console.log("Cleaning old records...");
  await db.delete(activities);
  await db.delete(reviews);
  await db.delete(visitRequests);
  await db.delete(comments);
  await db.delete(propertyStateHistory);
  await db.delete(propertyImages);
  await db.delete(properties);
  await db.delete(agencies);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);

  // 2. Create Agency 1 (Inmobiliaria del Sol)
  console.log("Creating Agency 1 (Inmobiliaria del Sol)...");
  const authUser1 = await auth.api.signUpEmail({
    body: {
      name: "Carlos Soler",
      email: "vendedor@delsol.com",
      password: "password123",
    },
  });

  const [agency1] = await db
    .insert(agencies)
    .values({
      userId: authUser1.user.id,
      fantasyName: "Inmobiliaria del Sol",
      description:
        "Especialistas en propiedades residenciales y comerciales en Zona Norte y CABA. Más de 15 años de trayectoria conectando personas con su hogar ideal.",
      phone: "+54 11 4788-9900",
      email: "contacto@inmobiliariadelsol.com",
      address: "Av. del Libertador 6250, Belgrano, CABA",
      logoUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop&q=80",
    })
    .returning();

  // 3. Create Agency 2 (Torres & Asociados)
  console.log("🏢 Creating Agency 2 (Torres & Asociados Propiedades)...");
  const authUser2 = await auth.api.signUpEmail({
    body: {
      name: "Florencia Torres",
      email: "contacto@torrespropiedades.com",
      password: "password123",
    },
  });

  const [agency2] = await db
    .insert(agencies)
    .values({
      userId: authUser2.user.id,
      fantasyName: "Torres & Asociados Propiedades",
      description:
        "Boutique inmobiliaria con enfoque personalizado. Tasaciones profesionales y asesoramiento legal y financiero integral.",
      phone: "+54 11 4822-1133",
      email: "info@torrespropiedades.com",
      address: "Av. Santa Fe 3120, Palermo, CABA",
      logoUrl:
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&auto=format&fit=crop&q=80",
    })
    .returning();

  // 4. Create Properties
  console.log("Seeding properties...");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Property 1 - Palermo Depto
  const [prop1] = await db
    .insert(properties)
    .values({
      agencyId: agency1.id,
      title: "Semipiso 3 ambientes con balcón aterrazado y amenities",
      description:
        "Hermoso departamento al frente con orientación este. Gran luminosidad, cocina integrada con isla, suite con vestidor, cochera fija cubierta y baulera. Edificio con piscina climatizada, gimnasio y SUM.",
      propertyType: "Departamento",
      operationType: "Venta",
      status: "PUBLICADA",
      price: "165000.00",
      currency: "USD",
      totalArea: 78,
      coveredArea: 68,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 2,
      age: 4,
      address: "Gorriti 4800",
      neighborhood: "Palermo",
      tags: [
        "pileta",
        "cochera",
        "balcon",
        "sum",
        "gimnasio",
        "seguridad 24hs",
      ],
      createdAt: thirtyDaysAgo,
    })
    .returning();

  // Property 2 - Nordelta Casa
  const [prop2] = await db
    .insert(properties)
    .values({
      agencyId: agency1.id,
      title: "Espectacular casa moderna al lago con pileta y muelle",
      description:
        "Diseño vanguardista de doble altura. Living comedor apaisado con vistas al lago principal. Galería con parrilla cerrada, jardín parquizado con riego automático y muelle propio.",
      propertyType: "Casa",
      operationType: "Venta",
      status: "PUBLICADA",
      price: "420000.00",
      currency: "USD",
      totalArea: 650,
      coveredArea: 320,
      rooms: 5,
      bedrooms: 4,
      bathrooms: 4,
      age: 2,
      address: "Los Alisos 142",
      neighborhood: "Nordelta",
      tags: [
        "pileta",
        "cochera",
        "parrilla",
        "seguridad 24hs",
        "admite mascotas",
        "jardin",
      ],
      createdAt: fortyFiveDaysAgo,
    })
    .returning();

  // Property 3 - Belgrano Alquiler
  const [prop3] = await db
    .insert(properties)
    .values({
      agencyId: agency1.id,
      title: "Depto 2 ambientes amoblado con vista abierta",
      description:
        "Excelente departamento totalmente equipado listo para ingresar. Living comedor con salida a balcón, cocina independiente, dormitorio con placard completo y baño completo.",
      propertyType: "Departamento",
      operationType: "Alquiler",
      status: "PUBLICADA",
      price: "650.00",
      currency: "USD",
      totalArea: 48,
      coveredArea: 44,
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      age: 6,
      address: "Av. Cabildo 2150",
      neighborhood: "Belgrano",
      tags: ["balcon", "seguridad 24hs", "apto profesional"],
      createdAt: sixtyDaysAgo,
    })
    .returning();

  // Property 4 - Local Recoleta
  const [prop4] = await db
    .insert(properties)
    .values({
      agencyId: agency1.id,
      title: "Local comercial en esquina de alto tránsito peatonal",
      description:
        "Excelente local con doble vidriera sobre avenida. Salón principal sin columnas, depósito en subsuelo y dos baños. Apto para rubro gastronómico, indumentaria o farmacia.",
      propertyType: "Local",
      operationType: "Alquiler",
      status: "PUBLICADA",
      price: "1250000.00",
      currency: "ARS",
      totalArea: 110,
      coveredArea: 110,
      rooms: 2,
      bathrooms: 2,
      age: 12,
      address: "Av. Las Heras 2300",
      neighborhood: "Recoleta",
      tags: ["apto profesional", "esquina", "vidriera"],
      createdAt: thirtyDaysAgo,
    })
    .returning();

  // Property 5 - Pilar Terreno
  const [prop5] = await db
    .insert(properties)
    .values({
      agencyId: agency1.id,
      title: "Lote perimetral arbolado en Barrio Cerrado",
      description:
        "Excelente lote listo para construir. Orientación noroeste con añosa arboleda. Todos los servicios subterráneos (luz, gas natural, fibra óptica y cloacas).",
      propertyType: "Terreno",
      operationType: "Venta",
      status: "PUBLICADA",
      price: "58000.00",
      currency: "USD",
      totalArea: 800,
      address: "Km 50 Panamericana",
      neighborhood: "Pilar",
      tags: ["seguridad 24hs", "pileta", "club house"],
      createdAt: sixtyDaysAgo,
    })
    .returning();

  // Property 6 - Villa Urquiza (Reservada)
  const [prop6] = await db
    .insert(properties)
    .values({
      agencyId: agency1.id,
      title: "Moderno monoambiente divisible con balcón",
      description:
        "Unidad muy luminosa en piso alto. Cocina equipada con bajo mesada y alacena, placard con interiores y baño completo con bañera.",
      propertyType: "Departamento",
      operationType: "Alquiler",
      status: "RESERVADA",
      price: "420000.00",
      currency: "ARS",
      totalArea: 38,
      coveredArea: 34,
      rooms: 1,
      bedrooms: 1,
      bathrooms: 1,
      age: 1,
      address: "Triunvirato 4100",
      neighborhood: "Villa Urquiza",
      tags: ["balcon", "sum", "laundry"],
      createdAt: thirtyDaysAgo,
    })
    .returning();

  // Property 7 - San Isidro Casa (Vendida con 45 días de tiempo de mercado)
  const [prop7] = await db
    .insert(properties)
    .values({
      agencyId: agency1.id,
      title: "Casa de estilo colonial con jardín y pileta en San Isidro",
      description:
        "Impecable propiedad desarrollada en dos plantas. Living con hogar a leña, cocina comedor diario, 3 dormitorios en planta alta y quincho independiente.",
      propertyType: "Casa",
      operationType: "Venta",
      status: "VENDIDA",
      price: "340000.00",
      currency: "USD",
      totalArea: 420,
      coveredArea: 240,
      rooms: 5,
      bedrooms: 3,
      bathrooms: 3,
      age: 18,
      address: "Diego Palma 950",
      neighborhood: "San Isidro",
      tags: ["pileta", "jardin", "parrilla", "cochera"],
      createdAt: ninetyDaysAgo,
      updatedAt: fortyFiveDaysAgo,
    })
    .returning();

  // Property 8 - Agency 2: Puerto Madero
  const [prop8] = await db
    .insert(properties)
    .values({
      agencyId: agency2.id,
      title: "Piso de lujo con vista al dique y cochera doble",
      description:
        "Semipiso premium en torre de categoría. Palier privado, master suite con hidromasaje, balcón terraza, dependencia de servicio. Amenities de primer nivel.",
      propertyType: "Departamento",
      operationType: "Alquiler",
      status: "PUBLICADA",
      price: "2400.00",
      currency: "USD",
      totalArea: 160,
      coveredArea: 145,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 3,
      age: 5,
      address: "Juana Manso 1600",
      neighborhood: "Puerto Madero",
      tags: [
        "pileta",
        "cochera",
        "balcon",
        "gimnasio",
        "seguridad 24hs",
        "sum",
      ],
      createdAt: thirtyDaysAgo,
    })
    .returning();

  // 5. Insert Images for Properties
  console.log("Seeding property images...");

  await db.insert(propertyImages).values([
    // Images for Prop 1 (Palermo)
    {
      propertyId: prop1.id,
      imageUrl:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },
    {
      propertyId: prop1.id,
      imageUrl:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80",
      order: 1,
      isCover: false,
    },
    {
      propertyId: prop1.id,
      imageUrl:
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1000&auto=format&fit=crop&q=80",
      order: 2,
      isCover: false,
    },

    // Images for Prop 2 (Nordelta)
    {
      propertyId: prop2.id,
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },
    {
      propertyId: prop2.id,
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80",
      order: 1,
      isCover: false,
    },

    // Images for Prop 3 (Belgrano)
    {
      propertyId: prop3.id,
      imageUrl:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },

    // Images for Prop 4 (Local Recoleta)
    {
      propertyId: prop4.id,
      imageUrl:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },

    // Images for Prop 5 (Pilar Terreno)
    {
      propertyId: prop5.id,
      imageUrl:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },

    // Images for Prop 6 (Villa Urquiza)
    {
      propertyId: prop6.id,
      imageUrl:
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },

    // Images for Prop 7 (San Isidro)
    {
      propertyId: prop7.id,
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },

    // Images for Prop 8 (Puerto Madero)
    {
      propertyId: prop8.id,
      imageUrl:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80",
      order: 0,
      isCover: true,
    },
  ]);

  // 6. State History Records
  console.log("Seeding property state history...");

  await db.insert(propertyStateHistory).values([
    // History for Prop 6 (Reservada)
    {
      propertyId: prop6.id,
      previousState: "BORRADOR",
      newState: "PUBLICADA",
      createdAt: thirtyDaysAgo,
    },
    {
      propertyId: prop6.id,
      previousState: "PUBLICADA",
      newState: "RESERVADA",
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },

    // History for Prop 7 (Vendida: 45 days on market)
    {
      propertyId: prop7.id,
      previousState: "BORRADOR",
      newState: "PUBLICADA",
      createdAt: ninetyDaysAgo,
    },
    {
      propertyId: prop7.id,
      previousState: "PUBLICADA",
      newState: "RESERVADA",
      createdAt: sixtyDaysAgo,
    },
    {
      propertyId: prop7.id,
      previousState: "RESERVADA",
      newState: "VENDIDA",
      createdAt: fortyFiveDaysAgo,
    },
  ]);

  // 7. Seed Comments & Seller Replies
  console.log("Seeding comments and replies...");

  await db.insert(comments).values([
    {
      propertyId: prop1.id,
      authorName: "Martín Gómez",
      content:
        "¿Aceptan permuta por departamento de menor valor en Colegiales?",
      sellerReply:
        "Hola Martín, los propietarios evalúan permutas de hasta el 40% del valor. Si querés contactanos al teléfono de la inmobiliaria para coordinar.",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      propertyId: prop1.id,
      authorName: "Lucía Fernández",
      content: "¿Cuánto pagan de expensas actualmente y qué incluyen?",
      sellerReply:
        "Hola Lucía, las expensas del último mes fueron de $180.000 e incluyen Aysa, seguridad 24hs y mantenimiento de amenities.",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      propertyId: prop2.id,
      authorName: "Esteban Rossi",
      content: "¿El lote tiene salida a laguna navegable para kayaks?",
      sellerReply:
        "Sí Esteban, tiene muelle propio y acceso directo a la laguna central para embarcaciones sin motor.",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      propertyId: prop3.id,
      authorName: "Camila Díaz",
      content: "¿Se aceptan mascotas de tamaño mediano?",
      sellerReply: null, // Unanswered inquiry
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
  ]);

  // 8. Seed Visit Requests
  console.log("Seeding visit requests...");

  const futureDate1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  futureDate1.setHours(16, 0, 0, 0);

  const futureDate2 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  futureDate2.setHours(11, 30, 0, 0);

  const futureDate3 = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  futureDate3.setHours(15, 0, 0, 0);

  await db.insert(visitRequests).values([
    {
      propertyId: prop1.id,
      requesterName: "Agustina Benítez",
      requesterPhone: "+54 9 11 5566-7788",
      proposedDate: futureDate1,
      message:
        "Buenas tardes, me gustaría coordinar para ver el departamento este fin de semana.",
      status: "Confirmada",
    },
    {
      propertyId: prop2.id,
      requesterName: "Mariano Castro",
      requesterPhone: "+54 9 11 4433-2211",
      proposedDate: futureDate2,
      message: "Hola, queremos ir en familia a conocer la casa y el barrio.",
      status: "Pendiente",
    },
    {
      propertyId: prop3.id,
      requesterName: "Valeria Paz",
      requesterPhone: "+54 9 11 8899-0011",
      proposedDate: futureDate3,
      message: "Trabajo cerca de Cabildo, me queda perfecto ese horario.",
      status: "Pendiente",
    },
  ]);

  // 9. Seed Reviews
  console.log("Seeding agency reviews...");

  await db.insert(reviews).values([
    {
      agencyId: agency1.id,
      authorName: "Gonzalo Herrera",
      content:
        "Excelente atención por parte de Carlos. Nos asesoró en todo el proceso de compra de nuestro primer departamento y fue súper transparente.",
      rating: 5,
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      agencyId: agency1.id,
      authorName: "Sofía Pereyra",
      content:
        "Muy profesionales y puntuales en las visitas. Respuestas rápidas por WhatsApp para coordinar los trámites.",
      rating: 5,
      createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      agencyId: agency1.id,
      authorName: "Rodrigo Morales",
      content:
        "Buena experiencia en el alquiler de un local. Todo según lo pactado en el contrato.",
      rating: 4,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      agencyId: agency2.id,
      authorName: "Daniela Varela",
      content:
        "Florencia tiene un trato impecable y un catálogo de propiedades de primera categoría en Puerto Madero y Recoleta.",
      rating: 5,
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    },
  ]);

  // 10. Seed Activities
  console.log("Seeding agency activities...");

  await db.insert(activities).values([
    {
      agencyId: agency1.id,
      type: "new_comment",
      content:
        'Nueva consulta de Camila Díaz en "Depto 2 ambientes amoblado con vista abierta"',
      isRead: false,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      agencyId: agency1.id,
      type: "new_visit",
      content:
        'Nueva solicitud de visita de Mariano Castro para "Espectacular casa moderna al lago con pileta y muelle"',
      isRead: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      agencyId: agency1.id,
      type: "new_review",
      content:
        'Nueva reseña de Rodrigo Morales (4 estrellas): "Buena experiencia en el alquiler..."',
      isRead: true,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      agencyId: agency1.id,
      type: "property_state_change",
      content:
        'La propiedad "Moderno monoambiente divisible con balcón" cambió de estado a RESERVADA',
      isRead: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log("Database seeding completed successfully!");
  console.log("");
  console.log("Demo Credentials:");
  console.log("-----------------------------------------");
  console.log("Agency 1: Inmobiliaria del Sol");
  console.log("  Email:    vendedor@delsol.com");
  console.log("  Password: password123");
  console.log("");
  console.log("Agency 2: Torres & Asociados Propiedades");
  console.log("  Email:    contacto@torrespropiedades.com");
  console.log("  Password: password123");
  console.log("-----------------------------------------");
}

runSeed()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
