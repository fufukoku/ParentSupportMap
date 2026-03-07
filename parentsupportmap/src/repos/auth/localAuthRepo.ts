import type {
  AuthRepo,
  ConfirmSignUpInput,
  LoginInput,
  RegisterInput,
  Session,
} from "./types";

export function localAuthRepo(): AuthRepo {
  return {
    async getSession(): Promise<Session | null> {
      return null;
    },

    async login(_input: LoginInput): Promise<Session> {
      throw new Error("localAuthRepo is disabled. Use cognitoAuthRepo instead.");
    },

    async logout(): Promise<void> {
      return;
    },

    async register(_input: RegisterInput): Promise<{ email: string }> {
      throw new Error("localAuthRepo is disabled. Use cognitoAuthRepo instead.");
    },

    async confirmSignUp(_input: ConfirmSignUpInput): Promise<void> {
      throw new Error("localAuthRepo is disabled. Use cognitoAuthRepo instead.");
    },
  };
}