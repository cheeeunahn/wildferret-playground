// Password hashing. PBKDF2-SHA256 through Web Crypto, which both Workers and
// Node have. 100,000 iterations is the most Workers allows.

export const ITERATIONS = 100_000;

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));

async function derive(password, salt, iterations) {
  // NFKC, so the same password typed on another keyboard or IME matches.
  const material = new TextEncoder().encode(password.normalize('NFKC'));
  const key = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

// `{ hash, salt, iterations }` to store for a new password.
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: toHex(await derive(password, salt, ITERATIONS)), salt: toHex(salt), iterations: ITERATIONS };
}

// Compares every byte whatever the result, so timing says nothing about how
// close a guess was.
export async function verifyPassword(password, stored) {
  const expected = fromHex(stored.hash);
  const actual = await derive(password, fromHex(stored.salt), stored.iterations);
  let difference = expected.length ^ actual.length;
  for (let i = 0; i < actual.length; i += 1) difference |= actual[i] ^ (expected[i] ?? 0);
  return difference === 0;
}

// Spends the same time as a real check, for IDs that do not exist: otherwise
// a fast "no" would reveal which IDs are taken.
export async function wastePasswordCheck(password) {
  await derive(password, new Uint8Array(16), ITERATIONS);
}
