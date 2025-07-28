import { NextRequest } from "next/server";
import { verifyToken } from "./auth";

export const getAuthUser = (request: NextRequest) => {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
};

export const requireAuth = (request: NextRequest) => {
  const user = getAuthUser(request);

  if (!user) {
    throw new Error("No autorizado");
  }

  return user;
};

export const requireAdmin = (request: NextRequest) => {
  const user = requireAuth(request);

  if (user.role !== "ADMIN") {
    throw new Error("Se requieren permisos de administrador");
  }

  return user;
};
