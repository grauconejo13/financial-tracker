import jwt from 'jsonwebtoken';

export function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

export function decodeToken(token: string): { userId: string; exp: number } | null {
  return jwt.decode(token) as { userId: string; exp: number } | null;
}