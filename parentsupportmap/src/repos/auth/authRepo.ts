import type { RegisterInput, Session } from "./types";

export type AuthRepo = {
  getSession(): Session | null;
  login(emailOrUserId: string, password: string): Session;
  logout(): void;

  // 注册只允许 user
  registerUser(input: RegisterInput): void;

  // 预留：未来换 Supabase/AWS 时会用到
  // upsertAdmin?(): void
};
