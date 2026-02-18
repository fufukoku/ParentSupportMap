import type { AuthRepo, AuthUserRecord, LoginInput, RegisterInput, Session } from "./types";

const LS_SESSION_KEY = "psm_session";
const LS_USERS_KEY = "psm_users";

function readUsers(): AuthUserRecord[] {
  const raw = localStorage.getItem(LS_USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AuthUserRecord[];
  } catch {
    return [];
  }
}

function writeUsers(users: AuthUserRecord[]) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

function readSession(): Session | null {
  const raw = localStorage.getItem(LS_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (!session) localStorage.removeItem(LS_SESSION_KEY);
  else localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));
}

function ensureAdminSeed() {
  // ✅ 管理员不注册：这里模拟“后端写入”
  // 你可以把管理员账号放 .env.local 里，未来接后端再移除
  const adminEmail = "admin@demo.local";
  const adminUserId = "admin";
  const adminPass = "admin1234";

  const users = readUsers();
  const exists = users.some((u) => u.role === "admin" && u.userId === adminUserId);
  if (!exists) {
    users.push({ email: adminEmail, userId: adminUserId, password: adminPass, role: "admin" });
    writeUsers(users);
  }
}

export function localAuthRepo(): AuthRepo {
  ensureAdminSeed();

  return {
    getSession() {
      return readSession();
    },

    login({ identifier, password }: LoginInput) {
      const users = readUsers();
      const found = users.find(
        (u) => (u.email === identifier || u.userId === identifier) && u.password === password
      );
      if (!found) throw new Error("Invalid credentials");

      const session: Session = { userId: found.userId, email: found.email, role: found.role };
      writeSession(session);
      return session;
    },

    logout() {
      writeSession(null);
    },

    register({ email, userId, password }: RegisterInput) {
      const users = readUsers();

      if (!email.includes("@")) throw new Error("Invalid email");
      if (userId.trim().length < 3) throw new Error("User ID too short");
      if (password.length < 6) throw new Error("Password too short");

      if (users.some((u) => u.email === email)) throw new Error("Email already registered");
      if (users.some((u) => u.userId === userId)) throw new Error("User ID already taken");

      const record: AuthUserRecord = { email, userId, password, role: "user" };
      users.push(record);
      writeUsers(users);

      const session: Session = { userId, email, role: "user" };
      writeSession(session);
      return session;
    },
  };
}
