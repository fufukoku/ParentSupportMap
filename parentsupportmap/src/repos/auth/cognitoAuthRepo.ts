import { Amplify } from "aws-amplify";
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchUserAttributes,
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
const adminEmailsRaw = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) ?? "";

if (!userPoolId || !userPoolClientId) {
  throw new Error("Missing Cognito env vars: VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_USER_POOL_CLIENT_ID");
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

function deriveRole(email: string): Role {
  const adminEmails = adminEmailsRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase()) ? "admin" : "user";
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
    const email = attrs.email ?? "";
    const userId = current.username || email || "user";

    if (!email) return null;

    return {
      userId,
      email,
      role: deriveRole(email),
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
        const res = await signIn({
          username: identifier.trim(),
          password,
        });

        if (res.nextStep?.signInStep && res.nextStep.signInStep !== "DONE") {
          throw new Error("Additional sign-in step is required and is not supported in this flow yet.");
        }

        const session = await buildSession();
        if (!session) throw new Error("Failed to create session.");
        return session;
      } catch (err: any) {
        throw new Error(mapError(err));
      }
    },

    async logout() {
      await signOut();
    },

    async register({ email, password }: RegisterInput) {
      try {
        await signUp({
          username: email.trim(),
          password,
          options: {
            userAttributes: {
              email: email.trim(),
            },
          },
        });

        return { email: email.trim() };
      } catch (err: any) {
        throw new Error(mapError(err));
      }
    },

    async confirmSignUp({ email, code }: ConfirmSignUpInput) {
      try {
        await confirmSignUp({
          username: email.trim(),
          confirmationCode: code.trim(),
        });
      } catch (err: any) {
        throw new Error(mapError(err));
      }
    },
  };
}