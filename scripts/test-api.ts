/**
 * Automated API Smoke Test Suite for Habitat Backend
 * Tests all implemented endpoints against the running server.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(
      `  \x1b[31m✖\x1b[0m ${testName}${detail ? ` (${detail})` : ""}`
    );
    failed++;
  }
}

async function runTests() {
  console.log(
    `\n🧪 \x1b[1mStarting Habitat API Verification Suite\x1b[0m (${BASE_URL})\n`
  );

  let cookieHeader = "";
  let agencyId = "";
  let propertyId = "";
  let commentId = "";
  let visitId = "";
  let activityId = "";

  // ---------------------------------------------------------------------------
  // 1. AUTH & SELLER REGISTRATION
  // ---------------------------------------------------------------------------
  console.log(
    "\x1b[34m[1/7] Testing Authentication & Single-Step Registration\x1b[0m"
  );

  // A. Register new seller
  const randomSuffix = Math.floor(Math.random() * 10000);
  const testEmail = `test.vendedor.${randomSuffix}@test.com`;
  const testFantasyName = `Inmobiliaria Test ${randomSuffix}`;

  const regRes = await fetch(`${BASE_URL}/api/auth/register-seller`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Juan Test",
      email: testEmail,
      password: "password123",
      fantasyName: testFantasyName,
      phone: "+54 11 5555-1234",
      description: "Inmobiliaria de prueba automatizada",
    }),
  });
  const regData = await regRes.json();
  assert(
    regRes.status === 201 && regData.success === true,
    "POST /api/auth/register-seller (atomic user + agency)"
  );

  // B. Verify duplicate fantasy name rejection
  const dupRes = await fetch(`${BASE_URL}/api/auth/register-seller`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Otro Vendedor",
      email: `otro.${randomSuffix}@test.com`,
      password: "password123",
      fantasyName: testFantasyName, // same fantasy name
      phone: "+54 11 9999-8888",
    }),
  });
  assert(
    dupRes.status === 409,
    "POST /api/auth/register-seller rejects duplicate fantasy name (409)"
  );

  // C. Login with seeded demo agency
  const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "vendedor@delsol.com",
      password: "password123",
    }),
  });
  const rawSetCookie = loginRes.headers.get("set-cookie");
  if (rawSetCookie) {
    cookieHeader = rawSetCookie.split(";")[0];
  }
  assert(
    loginRes.status === 200,
    "POST /api/auth/sign-in/email (demo agency login)"
  );

  // ---------------------------------------------------------------------------
  // 2. AGENCY MANAGEMENT
  // ---------------------------------------------------------------------------
  console.log(
    "\n\x1b[34m[2/7] Testing Agency Endpoints (/api/agencies)\x1b[0m"
  );

  // A. Get current agency profile
  const meRes = await fetch(`${BASE_URL}/api/agencies/me`, {
    headers: { Cookie: cookieHeader },
  });
  const meData = await meRes.json();
  agencyId = meData?.agency?.id;
  assert(
    meRes.status === 200 &&
      meData.agency?.fantasyName === "Inmobiliaria del Sol",
    "GET /api/agencies/me (authenticated profile & inventory counts)"
  );

  // B. Update agency profile
  const patchAgencyRes = await fetch(`${BASE_URL}/api/agencies/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      description: "Descripción actualizada por test suite automatizado.",
    }),
  });
  const patchAgencyData = await patchAgencyRes.json();
  assert(
    patchAgencyRes.status === 200 &&
      patchAgencyData.agency?.description.includes("test suite"),
    "PATCH /api/agencies/me (update profile)"
  );

  // C. Get public agency profile with aggregated ratings and properties
  const publicAgencyRes = await fetch(`${BASE_URL}/api/agencies/${agencyId}`);
  const publicAgencyData = await publicAgencyRes.json();
  propertyId = publicAgencyData?.properties?.[0]?.id;
  assert(
    publicAgencyRes.status === 200 &&
      publicAgencyData.stats?.averageRating > 0 &&
      Array.isArray(publicAgencyData.properties),
    `GET /api/agencies/${agencyId} (public storefront with ratings & listings)`
  );

  // D. Test delete protection with active properties
  const deleteRes = await fetch(`${BASE_URL}/api/agencies/me`, {
    method: "DELETE",
    headers: { Cookie: cookieHeader },
  });
  assert(
    deleteRes.status === 400,
    "DELETE /api/agencies/me blocks deletion when active properties exist (400)"
  );

  // ---------------------------------------------------------------------------
  // 3. COMMENTS & Q&A
  // ---------------------------------------------------------------------------
  console.log(
    "\n\x1b[34m[3/7] Testing Comments & Inquiries (/api/properties/[id]/comments)\x1b[0m"
  );

  if (propertyId) {
    // A. Visitor posts question
    const postCommentRes = await fetch(
      `${BASE_URL}/api/properties/${propertyId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: "Comprador Interesado",
          content: "¿Aceptan crédito hipotecario para esta propiedad?",
        }),
      }
    );
    const postCommentData = await postCommentRes.json();
    commentId = postCommentData?.comment?.id;
    assert(
      postCommentRes.status === 201 && postCommentData.success === true,
      "POST /api/properties/[id]/comments (visitor inquiry without account)"
    );

    // B. List comments for property
    const listCommentsRes = await fetch(
      `${BASE_URL}/api/properties/${propertyId}/comments`
    );
    const listCommentsData = await listCommentsRes.json();
    assert(
      listCommentsRes.status === 200 && listCommentsData.comments.length > 0,
      "GET /api/properties/[id]/comments (list Q&A)"
    );

    // C. Agency replies to comment
    if (commentId) {
      const replyRes = await fetch(
        `${BASE_URL}/api/comments/${commentId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          body: JSON.stringify({
            sellerReply: "Hola! Sí, la propiedad es apta crédito bancario.",
          }),
        }
      );
      const replyData = await replyRes.json();
      assert(
        replyRes.status === 200 && replyData.comment?.sellerReply !== null,
        "POST /api/comments/[id]/reply (seller reply authorization)"
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 4. VISIT REQUESTS
  // ---------------------------------------------------------------------------
  console.log("\n\x1b[34m[4/7] Testing Visit Requests (/api/visits)\x1b[0m");

  if (propertyId) {
    // A. Visitor schedules visit with future date
    const futureDate = new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000
    ).toISOString();
    const postVisitRes = await fetch(
      `${BASE_URL}/api/properties/${propertyId}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: "Agustina Test",
          requesterPhone: "+54 11 4455-6677",
          proposedDate: futureDate,
          message: "Quisiera ver el departamento por la mañana",
        }),
      }
    );
    const postVisitData = await postVisitRes.json();
    visitId = postVisitData?.visit?.id;
    assert(
      postVisitRes.status === 201 && postVisitData.success === true,
      "POST /api/properties/[id]/visits (request visit with future date)"
    );

    // B. Rejection of past visit date
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const badVisitRes = await fetch(
      `${BASE_URL}/api/properties/${propertyId}/visits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: "Test",
          requesterPhone: "+54 11 1111-2222",
          proposedDate: pastDate,
        }),
      }
    );
    assert(
      badVisitRes.status === 400,
      "POST /api/properties/[id]/visits rejects past date (400)"
    );

    // C. Agency lists received visits
    const listVisitsRes = await fetch(`${BASE_URL}/api/agencies/me/visits`, {
      headers: { Cookie: cookieHeader },
    });
    const listVisitsData = await listVisitsRes.json();
    assert(
      listVisitsRes.status === 200 && Array.isArray(listVisitsData.visits),
      "GET /api/agencies/me/visits (agency visit management list)"
    );

    // D. Agency confirms visit request (state machine)
    if (visitId) {
      const patchVisitRes = await fetch(
        `${BASE_URL}/api/visits/${visitId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ status: "Confirmada" }),
        }
      );
      const patchVisitData = await patchVisitRes.json();
      assert(
        patchVisitRes.status === 200 &&
          patchVisitData.visit?.status === "Confirmada",
        "PATCH /api/visits/[id]/status (state machine transition to Confirmada)"
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 5. REVIEWS & RATINGS
  // ---------------------------------------------------------------------------
  console.log(
    "\n\x1b[34m[5/7] Testing Agency Reviews (/api/agencies/[id]/reviews)\x1b[0m"
  );

  if (agencyId) {
    // A. Visitor posts 5-star review
    const postReviewRes = await fetch(
      `${BASE_URL}/api/agencies/${agencyId}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: "Cliente Satisfecho",
          content: "Excelente atención y cordialidad en todo momento!",
          rating: 5,
        }),
      }
    );
    const postReviewData = await postReviewRes.json();
    assert(
      postReviewRes.status === 201 && postReviewData.success === true,
      "POST /api/agencies/[id]/reviews (visitor posts 5-star review)"
    );

    // B. Rejection of invalid rating (e.g. 6 stars)
    const badReviewRes = await fetch(
      `${BASE_URL}/api/agencies/${agencyId}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: "Tester",
          content: "Rating inválido",
          rating: 6,
        }),
      }
    );
    assert(
      badReviewRes.status === 400,
      "POST /api/agencies/[id]/reviews rejects rating > 5 (400)"
    );

    // C. List reviews and computed stats
    const listReviewsRes = await fetch(
      `${BASE_URL}/api/agencies/${agencyId}/reviews`
    );
    const listReviewsData = await listReviewsRes.json();
    assert(
      listReviewsRes.status === 200 &&
        listReviewsData.stats?.totalReviews > 0 &&
        listReviewsData.stats?.ratingCounts[5] > 0,
      "GET /api/agencies/[id]/reviews (aggregated stats & star distribution)"
    );
  }

  // ---------------------------------------------------------------------------
  // 6. ACTIVITY FEED & NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log(
    "\n\x1b[34m[6/7] Testing Activity Feed & Notifications (/api/agencies/me/activities)\x1b[0m"
  );

  // A. Get activity feed & unread counter
  const activitiesRes = await fetch(`${BASE_URL}/api/agencies/me/activities`, {
    headers: { Cookie: cookieHeader },
  });
  const activitiesData = await activitiesRes.json();
  activityId = activitiesData?.activities?.[0]?.id;
  assert(
    activitiesRes.status === 200 &&
      typeof activitiesData.unreadCount === "number",
    `GET /api/agencies/me/activities (unread badge counter: ${activitiesData.unreadCount})`
  );

  // B. Mark single activity as read
  if (activityId) {
    const markOneRes = await fetch(
      `${BASE_URL}/api/agencies/me/activities/${activityId}/read`,
      {
        method: "PATCH",
        headers: { Cookie: cookieHeader },
      }
    );
    assert(
      markOneRes.status === 200,
      "PATCH /api/agencies/me/activities/[id]/read (mark single notification as read)"
    );
  }

  // C. Mark all activities as read
  const markAllRes = await fetch(
    `${BASE_URL}/api/agencies/me/activities/read-all`,
    {
      method: "PATCH",
      headers: { Cookie: cookieHeader },
    }
  );
  const markAllData = await markAllRes.json();
  assert(
    markAllRes.status === 200 && typeof markAllData.updatedCount === "number",
    "PATCH /api/agencies/me/activities/read-all (bulk mark as read)"
  );

  // ---------------------------------------------------------------------------
  // 7. REPORTS & DASHBOARD METRICS
  // ---------------------------------------------------------------------------
  console.log(
    "\n\x1b[34m[7/7] Testing Reports & Analytics Dashboard (/api/agencies/me/reports)\x1b[0m"
  );

  const reportsRes = await fetch(`${BASE_URL}/api/agencies/me/reports`, {
    headers: { Cookie: cookieHeader },
  });
  const reportsData = await reportsRes.json();
  assert(
    reportsRes.status === 200 &&
      reportsData.reports?.propertiesByStatus?.PUBLICADA !== undefined &&
      Array.isArray(reportsData.reports?.monthlyEvolution) &&
      typeof reportsData.reports?.averageDaysOnMarket === "number",
    `GET /api/agencies/me/reports (properties by status, monthly chart, avg days on market: ${reportsData.reports?.averageDaysOnMarket}d)`
  );

  // ---------------------------------------------------------------------------
  // FINAL REPORT
  // ---------------------------------------------------------------------------
  console.log(
    "\n------------------------------------------------------------------"
  );
  console.log(
    `\x1b[1mTest Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m of ${passed + failed} total assertions.`
  );
  console.log(
    "------------------------------------------------------------------\n"
  );

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log(
      "🎉 \x1b[32mAll backend endpoints and business rules verified successfully!\x1b[0m\n"
    );
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test suite runner error:", err);
  process.exit(1);
});
