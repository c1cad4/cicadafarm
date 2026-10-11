export const MERCHANT = "ARxc7VD9vXBWLtrRxEGyM3cwRPmqxcWu6s9gjgUvzwwP";
export const CURRENCIES = {
  ROBOTCYB: {
    mint: "8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump",
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    decimals: 6,
    raw: "1000000000",
  },
};
export const ITEMS = {
  glass: { icon: "◯", name: "Crystal shell", factor: 1 },
  galaxy: { icon: "✦", name: "Galaxy shell", factor: 2 },
  mist: { icon: "≈", name: "Aurora shell", factor: 3 },
};
export function decode58(s) {
  if (typeof s !== "string" || s.length > 100) throw Error("Invalid base58");
  const abc = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const c of s) {
    const v = abc.indexOf(c);
    if (v < 0) throw Error("Invalid base58");
    n = n * 58n + BigInt(v);
  }
  const out = [];
  while (n) {
    out.unshift(Number(n % 256n));
    n /= 256n;
  }
  for (let i = 0; s[i] === "1"; i++) out.unshift(0);
  return Uint8Array.from(out);
}
export function walletAddress(s) {
  try {
    return decode58(s).length === 32;
  } catch {
    return false;
  }
}
export function verifyPayment(tx, q) {
  if (
    !tx?.meta ||
    tx.meta.err ||
    !Number.isFinite(tx.blockTime) ||
    tx.blockTime * 1000 < q.created - 30000 ||
    tx.blockTime * 1000 > q.expires
  )
    return false;
  const message = tx.transaction?.message;
  if (!message) return false;
  const keys = message.accountKeys || [];
  if (!keys.some((k) => k.pubkey === q.wallet && k.signer)) return false;
  const instructions = [
    ...(message.instructions || []),
    ...(tx.meta.innerInstructions || []).flatMap((x) => x.instructions || []),
  ];
  if (!instructions.some((i) => i.program === "spl-memo" && i.parsed === q.id))
    return false;
  const raw = BigInt(q.raw);
  const currency = CURRENCIES[q.currency];
  if (!currency) return false;
  const balance = (rows, owner) =>
    (rows || [])
      .filter(
        (b) =>
          b.mint === currency.mint &&
          b.owner === owner &&
          b.uiTokenAmount.decimals === currency.decimals,
      )
      .reduce((a, b) => a + BigInt(b.uiTokenAmount.amount), 0n);
  return (
    balance(tx.meta.postTokenBalances, MERCHANT) -
      balance(tx.meta.preTokenBalances, MERCHANT) >=
      raw &&
    balance(tx.meta.preTokenBalances, q.wallet) -
      balance(tx.meta.postTokenBalances, q.wallet) >=
      raw
  );
}
