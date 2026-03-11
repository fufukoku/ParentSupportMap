import { fetchAuthSession } from "aws-amplify/auth";

export async function getAccessToken(): Promise<string | null> {
  const session = await fetchAuthSession();
  return session.tokens?.accessToken?.toString() ?? null;
}

export async function buildAdminAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("You are not signed in.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}