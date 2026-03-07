export type Role = "user" | "admin";

export type Session = {
  userId: string;
  email: string;
  role: Role;
};

export type RegisterInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type ConfirmSignUpInput = {
  email: string;
  code: string;
};

export type AuthRepo = {
  getSession(): Promise<Session | null>;
  login(input: LoginInput): Promise<Session>;
  logout(): Promise<void>;
  register(input: RegisterInput): Promise<{ email: string }>;
  confirmSignUp(input: ConfirmSignUpInput): Promise<void>;
};