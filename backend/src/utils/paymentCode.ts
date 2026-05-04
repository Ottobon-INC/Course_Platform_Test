import { prisma } from "../services/prisma";

import crypto from 'crypto';

// Charset excluding ambiguous characters (0/O, 1/I/L)
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const MAX_RETRIES = 5;

/**
 * Generate a random segment of given length from CHARSET
 */
function randomSegment(length: number): string {
  let result = "";
  const bytes = new Uint8Array(length);
  // Use Node's crypto for secure randomness
  crypto.randomFillSync(bytes);
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

/**
 * Generate a unique payment code in format: OTT-XXXX-XXXX
 * Checks uniqueness against the registrations table.
 * Retries up to MAX_RETRIES times on collision.
 */
export async function generateUniquePaymentCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const part1 = randomSegment(4);
    const part2 = randomSegment(4);
    const code = `OTT-${part1}-${part2}`;

    // Check for collision
    const existing = await prisma.registration.findFirst({
      where: { paymentCode: code },
      select: { registrationId: true },
    });

    if (!existing) {
      return code;
    }

    console.warn(`Payment code collision on attempt ${attempt + 1}: ${code}`);
  }

  throw new Error(
    "Failed to generate a unique payment code after maximum retries"
  );
}
