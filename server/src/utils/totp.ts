import { generateSecret, generateURI, verifySync } from 'otplib';

export { generateSecret };

export function createOtpauthUrl(email: string, secret: string) {
  return generateURI({
    strategy: 'totp',
    issuer: 'ClearPath',
    label: email,
    secret,
  });
}

export function verifyTotpCode(token: string, secret: string): boolean {
  const result = verifySync({
    secret,
    token: token.replace(/\s/g, ''),
    epochTolerance: 1,
  });
  return result.valid === true;
}
