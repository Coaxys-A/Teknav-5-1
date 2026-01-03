export function requireRole(role: "OWNER" | "ADMIN" | "WRITER" | "USER" = "USER") {
  const session = (global as any).__FAKE_SESSION__ || { role: "OWNER" };
  const order = ["USER", "WRITER", "ADMIN", "OWNER"];
  if (order.indexOf(session.role) < order.indexOf(role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export function requireAny(roles: ("OWNER" | "ADMIN" | "WRITER" | "USER")[]) {
  const session = (global as any).__FAKE_SESSION__ || { role: "OWNER" };
  if (!roles.includes(session.role)) throw new Error("Forbidden");
  return session;
}
