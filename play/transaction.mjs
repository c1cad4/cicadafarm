import { MERCHANT, CURRENCIES, ITEMS } from "../multiplayer/commerce.js";
export function buildTransaction(library, q) {
  const c = CURRENCIES[q.currency],
    item = ITEMS[q.item];
  if (
    q.recipient !== MERCHANT ||
    !c ||
    !item ||
    q.mint !== c.mint ||
    q.decimals !== c.decimals ||
    BigInt(q.raw) !== BigInt(c.raw) * BigInt(item.factor) ||
    !/^swarm-[a-f0-9-]{36}$/.test(q.id)
  )
    throw Error("Invalid payment quote");
  const { PublicKey, Transaction, TransactionInstruction, SystemProgram } =
      library,
    payer = new PublicKey(q.wallet),
    recipient = new PublicKey(q.recipient);
  const tx = new Transaction({ feePayer: payer, recentBlockhash: q.blockhash });
  if (!q.mint)
    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: recipient,
        lamports: BigInt(q.raw),
      }),
    );
  else {
    const token = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      ata = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      mint = new PublicKey(q.mint);
    const address = (owner) =>
        PublicKey.findProgramAddressSync(
          [owner.toBytes(), token.toBytes(), mint.toBytes()],
          ata,
        )[0],
      from = address(payer),
      to = address(recipient);
    tx.add(
      new TransactionInstruction({
        programId: ata,
        keys: [
          { pubkey: payer, isSigner: true, isWritable: true },
          { pubkey: to, isSigner: false, isWritable: true },
          { pubkey: recipient, isSigner: false, isWritable: false },
          { pubkey: mint, isSigner: false, isWritable: false },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
          { pubkey: token, isSigner: false, isWritable: false },
        ],
        data: Uint8Array.of(1),
      }),
    );
    const data = new Uint8Array(10);
    data[0] = 12;
    new DataView(data.buffer).setBigUint64(1, BigInt(q.raw), true);
    data[9] = q.decimals;
    tx.add(
      new TransactionInstruction({
        programId: token,
        keys: [
          { pubkey: from, isSigner: false, isWritable: true },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: to, isSigner: false, isWritable: true },
          { pubkey: payer, isSigner: true, isWritable: false },
        ],
        data,
      }),
    );
  }
  tx.add(
    new TransactionInstruction({
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
      data: new TextEncoder().encode(q.id),
    }),
  );
  return tx;
}
