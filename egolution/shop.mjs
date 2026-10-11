import { ITEMS, MERCHANT } from "./commerce.js";
import { t } from "./i18n.mjs";
import { buildTransaction } from "./transaction.mjs";
const API = "https://cicadafarm-swarm.dmitry-suh.workers.dev/egolution/api";
const $ = (s) => document.querySelector(s);
const safeGet = (store, key) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (store, key, value) => {
  try {
    value === null ? store.removeItem(key) : store.setItem(key, value);
  } catch {}
};
export function setupShop({ toast, setShell, setPreview }) {
  let provider = null,
    token = safeGet(sessionStorage, "egolution-session"),
    inventory = { owned: [], equipped: null },
    quote = null,
    busy = false,
    pending = null;
  try {
    pending = JSON.parse(safeGet(localStorage, "egolution-pending"));
  } catch {}
  const status = (message) => ($("#shopStatus").textContent = message);
  async function api(path, body) {
    const r = await fetch(`${API}/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json();
    if (!r.ok || r.status === 202) {
      const e = Error(data.error || t("offline"));
      e.status = r.status;
      throw e;
    }
    return data;
  }
  function refresh() {
    const list = $("#items");
    list.replaceChildren();
    for (const [id, item] of Object.entries(ITEMS)) {
      const row = document.createElement("article");
      row.className = "item";
      const icon = document.createElement("span");
      icon.className = "orb";
      icon.textContent = item.icon;
      const detail = document.createElement("div");
      detail.className = "detail";
      const title = document.createElement("b");
      title.textContent = t(id);
      const price = document.createElement("small");
      price.textContent = `${(1000 * item.factor).toLocaleString(document.documentElement.lang)} ROBOTCYB${inventory.owned.includes(id) ? " · " + t("owned") : ""}`;
      detail.append(title, price);
      const preview = document.createElement("button");
      preview.textContent = t("preview");
      preview.onclick = () => {
        setPreview(id);
        $("#shop").close();
        toast(t(id));
        setTimeout(() => setPreview(null), 4500);
      };
      const buy = document.createElement("button");
      buy.textContent = t(inventory.owned.includes(id) ? "equip" : "buy");
      buy.disabled = busy || (!inventory.owned.includes(id) && !!pending);
      buy.onclick = () =>
        run(async () => {
          if (!token) throw Error(t("walletHint"));
          if (inventory.owned.includes(id)) {
            inventory = await api("equip", { item: id });
            setShell(inventory.equipped);
            status(t("equip") + " · " + t(id));
          } else {
            quote = await api("quote", { item: id, currency: "ROBOTCYB" });
            $("#invoiceText").textContent =
              `${t(id)} · ${Number(quote.raw) / 10 ** quote.decimals} ROBOTCYB`;
            $("#invoice").hidden = false;
          }
        });
      row.append(icon, detail, preview, buy);
      list.append(row);
    }
    $("#disconnect").hidden = !token;
    $("#retry").hidden = !pending;
    $("#pay").disabled = busy || !!pending;
    $("#merchant").textContent = MERCHANT;
  }
  async function run(fn) {
    if (busy) return;
    busy = true;
    refresh();
    try {
      await fn();
    } catch (e) {
      status(e.message);
      if (e.status === 401) {
        token = null;
        inventory = { owned: [], equipped: null };
        safeSet(sessionStorage, "egolution-session", null);
        setShell(null);
      }
    } finally {
      busy = false;
      refresh();
    }
  }
  async function connect(which) {
    await run(async () => {
      provider =
        which === "phantom"
          ? window.phantom?.solana ||
            (window.solana?.isPhantom && window.solana)
          : window.solflare;
      if (!provider?.connect) throw Error(t("unsupported"));
      const result = await provider.connect(),
        wallet = (result?.publicKey || provider.publicKey).toString();
      const challenge = await api("challenge", { wallet });
      if (
        !challenge.message.startsWith(
          "Egolution wallet sign-in\nWallet: " + wallet + "\n",
        )
      )
        throw Error("Unexpected sign-in request");
      const signed = await provider.signMessage(
          new TextEncoder().encode(challenge.message),
          "utf8",
        ),
        sig = signed.signature || signed;
      const login = await api("login", {
        id: challenge.id,
        signature: btoa(String.fromCharCode(...sig)),
      });
      token = login.token;
      safeSet(sessionStorage, "egolution-session", token);
      inventory = await api("me");
      setShell(inventory.equipped);
      $("#walletLabel").textContent =
        `${wallet.slice(0, 6)}…${wallet.slice(-6)}`;
      status("✓ " + t("owned"));
      if (pending) status(t("retry"));
    });
  }
  $("#phantom").onclick = () => connect("phantom");
  $("#solflare").onclick = () => connect("solflare");
  $("#disconnect").onclick = () => {
    token = null;
    provider = null;
    inventory = { owned: [], equipped: null };
    quote = null;
    $("#invoice").hidden = true;
    safeSet(sessionStorage, "egolution-session", null);
    setShell(null);
    $("#walletLabel").textContent = t("walletHint");
    refresh();
  };
  $("#classic").onclick = () =>
    run(async () => {
      if (token) inventory = await api("equip", { item: null });
      setShell(null);
      setPreview(null);
    });
  $("#cancelQuote").onclick = () => {
    quote = null;
    $("#invoice").hidden = true;
  };
  let libraryPromise;
  async function library() {
    if (window.solanaWeb3) return window.solanaWeb3;
    libraryPromise ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("./vendor/solana-web3.min.js", import.meta.url).href;
      script.onload = () => resolve(window.solanaWeb3);
      script.onerror = () => {
        libraryPromise = null;
        script.remove();
        reject(Error("Wallet library unavailable"));
      };
      document.head.append(script);
    });
    return libraryPromise;
  }
  async function claim() {
    if (!pending) return;
    inventory = await api("claim", {
      id: pending.id,
      signature: pending.signature,
    });
    setShell(inventory.equipped);
    pending = null;
    safeSet(localStorage, "egolution-pending", null);
    quote = null;
    $("#invoice").hidden = true;
    status("✓ " + t("owned"));
  }
  $("#retry").onclick = () => run(claim);
  $("#pay").onclick = () =>
    run(async () => {
      if (!quote || pending || !provider?.signAndSendTransaction)
        throw Error(t("walletHint"));
      if (Date.now() > quote.expires)
        throw Error("Quote expired. Select the shell again.");
      const wallet = provider.publicKey?.toString();
      if (wallet !== quote.wallet)
        throw Error("Wallet changed. Connect again.");
      const tx = buildTransaction(await library(), quote);
      const sent = await provider.signAndSendTransaction(tx),
        signature = typeof sent === "string" ? sent : sent.signature;
      if (!signature)
        throw Error(
          "No transaction receipt returned. Check your wallet before retrying.",
        );
      pending = { id: quote.id, signature, wallet: quote.wallet };
      safeSet(localStorage, "egolution-pending", JSON.stringify(pending));
      $("#invoice").hidden = true;
      status(t("retry"));
      await claim();
    });
  refresh();
  if (token)
    run(async () => {
      inventory = await api("me");
      setShell(inventory.equipped);
      $("#walletLabel").textContent =
        `${inventory.wallet.slice(0, 6)}…${inventory.wallet.slice(-6)}`;
      if (pending) status(t("retry"));
    });
  return { refresh };
}
