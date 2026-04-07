import { createId } from "./createId";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  region?: string;
  createdAt: string;
  avatar?: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: number;
}

const SESSION_KEY = "e2_session";
const USERS_KEY = "e2_users";

type StoredUser = User & { password: string };

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, val: unknown) => {
  localStorage.setItem(key, JSON.stringify(val));
};

const getUsers = () => readJson<StoredUser[]>(USERS_KEY, []);

const findUser = (email: string) =>
  getUsers().find((u) => u.email === email.trim().toLowerCase());

const toSession = (user: StoredUser): Session => ({
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    country: user.country,
    region: user.region,
    createdAt: user.createdAt,
  },
  token: `offline-${user.id}`,
  expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
});

export function getSession(): Session | null {
  const s = readJson<Session | null>(SESSION_KEY, null);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return s;
}

export function getUser(): User | null {
  return getSession()?.user ?? null;
}

export function login(email: string, password: string): { session: Session | null; error: string | null } {
  const normalEmail = email.trim().toLowerCase();
  let user = findUser(normalEmail);

  if (!user) {
    const newUser: StoredUser = {
      id: createId(),
      email: normalEmail,
      password,
      firstName: "",
      lastName: "",
      createdAt: new Date().toISOString(),
    };
    const users = getUsers();
    users.push(newUser);
    writeJson(USERS_KEY, users);
    user = newUser;
  } else if (user.password !== password) {
    return { session: null, error: "Incorrect password for this account." };
  }

  const session = toSession(user);
  writeJson(SESSION_KEY, session);
  return { session, error: null };
}

export function signup(
  email: string,
  password: string,
  metadata: { firstName: string; lastName: string; country: string; region: string }
): { session: Session | null; error: string | null } {
  const normalEmail = email.trim().toLowerCase();
  if (findUser(normalEmail)) {
    return { session: null, error: "This email is already registered." };
  }

  const newUser: StoredUser = {
    id: createId(),
    email: normalEmail,
    password,
    firstName: metadata.firstName,
    lastName: metadata.lastName,
    country: metadata.country,
    region: metadata.region,
    createdAt: new Date().toISOString(),
  };

  const users = getUsers();
  users.push(newUser);
  writeJson(USERS_KEY, users);

  const session = toSession(newUser);
  writeJson(SESSION_KEY, session);
  return { session, error: null };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateProfile(updates: Partial<Omit<StoredUser, "id" | "password" | "email">>) {
  const session = getSession();
  if (!session) return;

  const users = getUsers();
  const idx = users.findIndex((u) => u.id === session.user.id);
  if (idx === -1) return;

  users[idx] = { ...users[idx], ...updates };
  writeJson(USERS_KEY, users);

  const newSession: Session = {
    ...session,
    user: { ...session.user, ...updates },
  };
  writeJson(SESSION_KEY, newSession);
}

export function changePassword(current: string, next: string): { error: string | null } {
  const session = getSession();
  if (!session) return { error: "Not authenticated." };

  const users = getUsers();
  const user = users.find((u) => u.id === session.user.id);
  if (!user) return { error: "User not found." };
  if (user.password !== current) return { error: "Current password is incorrect." };

  user.password = next;
  writeJson(USERS_KEY, users);
  return { error: null };
}
