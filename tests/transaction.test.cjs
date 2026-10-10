const test = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
test("wallet transaction uses exact merchant, memo and amounts for SOL and both SPL mints", async () => {
  const context = { TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, crypto };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(
      require.resolve("../play/vendor/solana-web3.min.js"),
      "utf8",
    ),
    context,
  );
  const lib = context.solanaWeb3,
    { buildTransaction } = await import("../play/transaction.mjs"),
    { MERCHANT, CURRENCIES } = await import("../multiplayer/commerce.js");
  for (const [currency, c] of Object.entries(CURRENCIES)) {
    const quote = {
      wallet: "11111111111111111111111111111111",
      recipient: MERCHANT,
      mint: c.mint,
      decimals: c.decimals,
      raw: c.raw,
      currency,
      item: "halo",
      id: "swarm-12345678-1234-1234-1234-123456789012",
      blockhash: "11111111111111111111111111111111",
    };
    const tx = buildTransaction(lib, quote);
    assert.equal(tx.feePayer.toString(), quote.wallet);
    assert.equal(
      new TextDecoder().decode(tx.instructions.at(-1).data),
      quote.id,
    );
    assert.ok(
      tx.serialize({ requireAllSignatures: false, verifySignatures: false })
        .length > 100,
    );
    if (currency === "SOL") {
      assert.equal(tx.instructions[0].keys[1].pubkey.toString(), MERCHANT);
      assert.equal(
        new DataView(
          tx.instructions[0].data.buffer,
          tx.instructions[0].data.byteOffset,
        ).getBigUint64(4, true),
        BigInt(c.raw),
      );
    } else {
      assert.equal(tx.instructions.length, 3);
      assert.equal(tx.instructions[0].data[0], 1);
      assert.equal(tx.instructions[0].keys[2].pubkey.toString(), MERCHANT);
      const transfer = tx.instructions[1];
      assert.equal(transfer.keys[1].pubkey.toString(), c.mint);
      assert.equal(transfer.data[0], 12);
      assert.equal(
        new DataView(
          transfer.data.buffer,
          transfer.data.byteOffset,
        ).getBigUint64(1, true),
        BigInt(c.raw),
      );
      assert.equal(transfer.data[9], c.decimals);
    }
  }
});
