import { auth } from "@/lib/auth";
import { ConflictError } from "@/lib/errors";
import type { RegisterSellerInput } from "@/lib/validations/auth";
import * as agencyRepository from "@/repositories/agency.repository";
import { withTransaction } from "@/repositories/executor";
import * as userRepository from "@/repositories/user.repository";

// SERVICE layer: seller onboarding. The TPO asks for the account and the agency
// to be created in a single step, so a user must never be left without agency.

export async function registerSeller(input: RegisterSellerInput) {
  const email = input.email.toLowerCase().trim();
  const fantasyName = input.fantasyName.trim();

  if (await agencyRepository.findByFantasyName(fantasyName)) {
    throw new ConflictError(
      "El nombre de fantasía ya está en uso por otra inmobiliaria.",
      { field: "fantasyName" }
    );
  }

  if (await userRepository.findByEmail(email)) {
    throw new ConflictError("El correo electrónico ya está registrado.", {
      field: "email",
    });
  }

  // Better Auth's sign-up writes with its own connection, outside any
  // transaction of ours. So the rows it would write (user + credential account)
  // are written here, in ONE transaction with the agency, with the password
  // hashed by Better Auth itself so its login can verify it. If the agency
  // can't be created (e.g. someone took the name a moment ago), nothing stays.
  const { password } = await auth.$context;
  const passwordHash = await password.hash(input.password);

  return withTransaction(async (tx) => {
    const createdUser = await userRepository.create(
      { id: crypto.randomUUID(), name: input.name.trim(), email },
      tx
    );
    await userRepository.createCredentialAccount(
      createdUser.id,
      passwordHash,
      tx
    );
    const agency = await agencyRepository.create(
      {
        userId: createdUser.id,
        fantasyName,
        description: input.description?.trim() || `Inmobiliaria ${fantasyName}`,
        phone: input.phone?.trim() ?? "",
        email,
        address: input.address?.trim() || null,
        logoUrl: input.logoUrl || null,
      },
      tx
    );

    return { user: createdUser, agency };
  });
}
