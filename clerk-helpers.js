// Clerk backend helpers.
// Uses CLERK_SECRET_KEY to look up user data server-side.
// Safe to import in any backend module (server.js, renewal-job.js, etc.).

import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Returns the primary email address for a given Clerk user ID, or null if not found.
export async function getEmailForUser(clerkUserId) {
  try {
    const user = await clerk.users.getUser(clerkUserId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    return primary?.emailAddress ?? null;
  } catch {
    return null;
  }
}
