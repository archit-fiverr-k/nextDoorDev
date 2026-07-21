import bcrypt from "bcryptjs";

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  return bcrypt.compareSync(password, storedHash);
}
