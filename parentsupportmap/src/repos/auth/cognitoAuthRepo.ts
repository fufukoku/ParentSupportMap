import { Amplify } from "aws-amplify";
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
} from "aws-amplify/auth";
import type {
  AuthRepo,
  ConfirmSignUpInput,
  LoginInput,
  RegisterInput,
  Role,
  Session,
} from "./types";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string | undefined;

if (!userPoolId || !userPoolClientId) {
  throw new Error(
    "Missing Cognito env vars: VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_USER_POOL_CLIENT_ID"
  );
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
      },
    },
  },
});

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseGroups(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).toLowerCase());
  }
  if (typeof raw === "string" && raw.trim()) {
    return [raw.trim().toLowerCase()];
  }
  return [];
}

function deriveRoleFromGroups(groups: string[]): Role {
  return groups.includes("admin") ? "admin" : "user";
}

function mapError(err: any): string {
  const name = err?.name || "";
  const message = err?.message || "";

  if (name === "UsernameExistsException") return "This email is already registered.";
  if (name === "InvalidPasswordException") return "Password does not meet the requirements.";
  if (name === "UserNotFoundException") return "Account not found.";
  if (name === "NotAuthorizedException") return "Incorrect email or password.";
  if (name === "CodeMismatchException") return "Verification code is incorrect.";
  if (name === "ExpiredCodeException") return "Verification code has expired.";
  if (name === "UserNotConfirmedException") return "Please verify your email first.";
  if (name === "TooManyRequestsException") return "Too many attempts. Please try again later.";

  return message || "Authentication failed.";
}

async function buildSession(): Promise<Session | null> {
  try {
    const current = await getCurrentUser();
    const attrs = await fetchUserAttributes();
    const authSession = await fetchAuthSession();

    const email = attrs.email ? normalizeEmail(attrs.email) : "";
    if (!email) return null;

    const idPayload = authSession.tokens?.idToken?.payload;
    const groups = parseGroups(idPayload?.["cognito:groups"]);
    const role = deriveRoleFromGroups(groups);

    return {
      userId: current.username || email,
      email,
      role,
    };
  } catch {
    return null;
  }
}

export function cognitoAuthRepo(): AuthRepo {
  return {
    async getSession() {
      return await buildSession();
    },

    async login({ identifier, password }: LoginInput) {
      try {
        const email = normalizeEmail(identifier);

        const res = await signIn({
          username: email,
          password,
        });

        if (res.nextStep?.signInStep && res.nextStep.signInStep !== "DONE") {
          throw new Error(`Additional sign-in step is required: ${res.nextStep.signInStep}`);
        }

        const session = await buildSession();
        if (!session) throw new Error("Failed to create session.");
        return session;
      } catch (err: any) {
        console.error("Cognito login error:", err);
        throw new Error(mapError(err));
      }
    },

    async logout() {
      await signOut();
    },

    async register({ email, password }: RegisterInput) {
      try {
        const normalizedEmail = normalizeEmail(email);

        await signUp({
          username: normalizedEmail,
          password,
          options: {
            userAttributes: {
              email: normalizedEmail,
            },
          },
        });

        return { email: normalizedEmail };
      } catch (err: any) {
        console.error("Cognito register error:", err);
        throw new Error(mapError(err));
      }
    },

    async confirmSignUp({ email, code }: ConfirmSignUpInput) {
      try {
        await confirmSignUp({
          username: normalizeEmail(email),
          confirmationCode: code.trim(),
        });
      } catch (err: any) {
        console.error("Cognito confirmSignUp error:", err);
        throw new Error(mapError(err));
      }
    },
  };
}