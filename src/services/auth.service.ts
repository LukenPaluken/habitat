import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { ConflictError, ValidationError } from "@/lib/errors";
import type { RegisterSellerInput } from "@/lib/validations/auth";
import * as agencyRepository from "@/repositories/agency.repository";
import * as userRepository from "@/repositories/user.repository";

// SERVICE layer: seller onboarding. The TPO asks for the account and the agency
// to be created in a single step, so a user must never be left without agency.

export async function registerSeller(
  input: RegisterSellerInput,
  requestHeaders: Headers
) {
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

  let createdUser;
  try {
    // Better Auth owns credentials: it hashes the password and creates the user.
    const authResponse = await auth.api.signUpEmail({
      body: { email, password: input.password, name: input.name.trim() },
      headers: requestHeaders,
    });
    createdUser = authResponse?.user;
  } catch (error) {
    if (error instanceof APIError) throw new ValidationError(error.message);
    throw error;
  }

  if (!createdUser) {
    throw new Error("No se pudo crear la cuenta de usuario.");
  }

  try {
    const agency = await agencyRepository.create({
      userId: createdUser.id,
      fantasyName,
      description: input.description?.trim() || `Inmobiliaria ${fantasyName}`,
      phone: input.phone?.trim() ?? "",
      email,
      address: input.address?.trim() || null,
      logoUrl: input.logoUrl || null,
    });

    return { user: createdUser, agency };
  } catch (error) {
    // Compensate: without its agency the new account would be orphaned.
    await userRepository.deleteById(createdUser.id);
    throw error;
  }
}
