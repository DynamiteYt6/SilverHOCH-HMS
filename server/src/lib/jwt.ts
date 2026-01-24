// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET!;

// export function signToken(payload: object) {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
// }

// export function verifyToken(token: string) {
//   return jwt.verify(token, JWT_SECRET);
// }

import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// 👇 define exactly what YOUR app puts in the token
export interface AuthTokenPayload {
  id: string;
  role: string;
}

export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

  return {
    id: decoded.id as string,
    role: decoded.role as string,
  };
}
