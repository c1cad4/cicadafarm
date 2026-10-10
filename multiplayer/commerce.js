export const MERCHANT = "AHBz386tP36ZrABN7STzxV66u1f7CwnaqrFBnevb4ff8";
export const CURRENCIES = {
  SOL: { mint: null, decimals: 9, raw: "1000000" },
  CICADAFARM: {
    mint: "9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump",
    decimals: 6,
    raw: "1000000000",
  },
  ROBOTCYB: {
    mint: "8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump",
    decimals: 6,
    raw: "1000000000",
  },
};
export const ITEMS = {
  halo: { icon: "◯", name: "Nebula halo", factor: 1 },
  crown: { icon: "♛", name: "Pollen crown", factor: 2 },
  orbit: { icon: "✧", name: "Neon orbit", factor: 3 },
  banner: { icon: "⚑", name: "Country banner", factor: 1 },
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
  if (q.currency === "SOL") {
    const sent = instructions
      .filter(
        (i) =>
          i.program === "system" &&
          i.parsed?.type === "transfer" &&
          i.parsed.info.source === q.wallet &&
          i.parsed.info.destination === MERCHANT,
      )
      .reduce((a, i) => a + BigInt(i.parsed.info.lamports), 0n);
    const idx = keys.findIndex((k) => k.pubkey === MERCHANT);
    return (
      sent >= raw &&
      idx >= 0 &&
      BigInt(tx.meta.postBalances[idx]) - BigInt(tx.meta.preBalances[idx]) >=
        raw
    );
  }
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
export function cleanChat(value) {
  return typeof value === "string"
    ? value
        .replace(/[\p{C}<>]/gu, "")
        .trim()
        .slice(0, 180)
    : "";
}
