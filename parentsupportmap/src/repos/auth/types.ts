export type Role = "user" | "admin";

export type Session = {
  userId: string;
  email: string;
  role: Role;
};

export type RegisterInput = {
  email: string;
  userId: string;
  password: string;
};

export type LoginInput = {
  // 允许用 email 或 userId 登录
  identifier: string;
  password: string;
};

export type AuthUserRecord = {
  email: string;
  userId: string;
  password: string; // demo: 明文（以后接后端换成hash）
  role: Role;
};

export type AuthRepo = {
  getSession(): Session | null;
  login(input: LoginInput): Session;
  logout(): void;
  register(input: RegisterInput): Session;
};
