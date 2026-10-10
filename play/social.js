import { buildTransaction } from "./transaction.mjs";
import { ITEMS, CURRENCIES } from "../multiplayer/commerce.js";
import { sound } from "./audio.js";
const API =
  location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8768"
    : "https://cicadafarm-swarm.dmitry-suh.workers.dev";
const $ = (id) => document.getElementById(id);
const words = {
  en: {
    title: "Chat · Wallet · Style",
    open: "☏ Chat & style",
    phantom: "Connect Phantom",
    solflare: "Connect Solflare",
    logout: "Disconnect",
    login: "Sign in with a wallet to write. Playing and reading are free.",
    send: "Send",
    message: "Message to this garden",
    shop: "Cosmetic workshop",
    currency: "Pay with",
    quote: "Get price",
    pay: "Confirm payment in wallet",
    retry: "Verify receipt",
    equip: "Equip",
    clear: "Remove effect",
    fee: "Permanent cosmetic. No gameplay advantage. Network fees and token-account setup costs are extra. Purchases are mainnet transfers.",
    read: "Chat is public in this room. Do not share private details.",
    none: "No effect",
    wallet: "Signed wallet",
    pending: "Waiting for finalization. Retry verification; do not pay again.",
    confirmed: "Payment verified. Cosmetic saved to your wallet.",
    signing:
      "Approve the sign-in message in your wallet. No funds are transferred.",
    missing: "Install or open the selected wallet to connect.",
    owned: "Owned",
    recipient: "Recipient",
    ttl: "Quote expires",
    x: "X login will be added after OAuth setup.",
    halo: "Nebula halo",
    crown: "Pollen crown",
    orbit: "Neon orbit",
    banner: "Country banner",
    chatError: "Chat: ",
  },
  ru: {
    title: "Чат · Кошелёк · Стиль",
    open: "☏ Чат и стиль",
    phantom: "Войти с Phantom",
    solflare: "Войти с Solflare",
    logout: "Отключить",
    login: "Подпиши вход кошельком, чтобы писать. Игра и чтение бесплатны.",
    send: "Отправить",
    message: "Сообщение в этот сад",
    shop: "Мастерская украшений",
    currency: "Оплата",
    quote: "Узнать цену",
    pay: "Подтвердить оплату в кошельке",
    retry: "Проверить чек",
    equip: "Надеть",
    clear: "Убрать эффект",
    fee: "Постоянное украшение без преимущества в игре. Комиссии сети и создание токен-счёта отдельно. Оплата в основной сети Solana.",
    read: "Чат открыт участникам комнаты. Не публикуй личные данные.",
    none: "Без эффекта",
    wallet: "Кошелёк подтверждён",
    pending: "Ожидаем финализации. Повтори проверку; не оплачивай снова.",
    confirmed: "Оплата проверена. Украшение сохранено для кошелька.",
    signing: "Подтверди сообщение для входа в кошельке. Это не перевод денег.",
    missing: "Установи или открой выбранный кошелёк.",
    owned: "Куплено",
    recipient: "Получатель",
    ttl: "Цена действует до",
    x: "Вход через X добавим после настройки OAuth.",
    halo: "Туманное сияние",
    crown: "Корона пыльцы",
    orbit: "Неоновая орбита",
    banner: "Знамя страны",
    chatError: "Чат: ",
  },
  "zh-CN": {
    title: "聊天 · 钱包 · 外观",
    open: "☏ 聊天与外观",
    phantom: "连接 Phantom",
    solflare: "连接 Solflare",
    logout: "断开",
    login: "签名登录后可发言。游戏与阅读免费。",
    send: "发送",
    message: "发送到此花园",
    shop: "装饰工坊",
    currency: "支付币种",
    quote: "查看价格",
    pay: "在钱包确认付款",
    retry: "验证收据",
    equip: "装备",
    clear: "移除效果",
    fee: "永久装饰，不提供游戏优势。另付网络费及代币账户创建费用，使用 Solana 主网。",
    read: "房间聊天公开，请勿透露隐私。",
    none: "无效果",
    wallet: "已签名钱包",
    pending: "等待最终确认。重试验证，请勿再次付款。",
    confirmed: "付款已验证，装饰已保存到钱包。",
    signing: "在钱包批准登录签名，不会转移资金。",
    missing: "请安装或打开所选钱包。",
    owned: "已拥有",
    recipient: "收款地址",
    ttl: "报价有效期",
    x: "配置 OAuth 后添加 X 登录。",
    halo: "星云光环",
    crown: "花粉王冠",
    orbit: "霓虹轨道",
    banner: "国家旗帜",
    chatError: "聊天：",
  },
};
const t = (k) => (words[document.documentElement.lang] || words.en)[k];
export function socialUI(getSocket) {
  let checkoutConfigured = false;
  let auth = null,
    provider = null,
    busy = false,
    pending = null,
    inventory = { owned: [], equipped: null },
    messages = [];
  try {
    auth = JSON.parse(sessionStorage.getItem("swarmWallet") || "null");
    if (auth?.expires < Date.now()) auth = null;
    pending = JSON.parse(
      localStorage.getItem("swarmPendingPurchase") || "null",
    );
  } catch {}
  const panel = document.createElement("aside");
  panel.id = "socialPanel";
  panel.hidden = true;
  panel.innerHTML =
    '<div class="social-head"><strong id="socialTitle"></strong><button id="socialClose" aria-label="Close">×</button></div><div class="wallet-actions"><button id="phantom"></button><button id="solflare"></button><button id="walletLogout" hidden></button></div><p id="walletInfo"></p><p id="socialRead"></p><ol id="chatLog" aria-label="Chat"></ol><form id="chatForm"><input id="chatInput" maxlength="180" autocomplete="off"><button id="chatSend" type="submit"></button></form><h3 id="shopTitle"></h3><p id="checkoutNotice"></p><div class="shop-controls"><label id="currencyLabel" for="currency"></label><select id="currency"><option>SOL</option><option>CICADAFARM</option><option>ROBOTCYB</option></select></div><div id="shopItems"></div><button id="clearEffect"></button><section id="invoice" hidden><p id="invoiceDetails"></p><button id="payInvoice"></button><button id="verifyInvoice"></button><a id="receiptLink" target="_blank" rel="noopener" hidden>Solscan ↗</a></section><p id="shopFees"></p><p id="socialStatus" role="status" aria-live="polite"></p>';
  document.querySelector(".arena").append(panel);
  const toggle = document.createElement("button");
  toggle.id = "socialToggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  document.querySelector(".bottom").append(toggle);
  const status = (text) => {
    $("socialStatus").textContent = text;
  };
  async function api(path, body) {
    const r = await fetch(API + "/api/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: "Bearer " + auth.token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json();
    if (!r.ok || data.error)
      throw Object.assign(
        Error(
          data.error ===
            "Checkout is awaiting secure RPC setup. No payment sent."
            ? {
                en: "Checkout is being connected. No payment sent.",
                ru: "Оплата пока подключается. Деньги не отправлены.",
                "zh-CN": "付款服务正在配置，未发送资金。",
              }[document.documentElement.lang] || data.error
            : data.error || "Request failed",
        ),
        {
          status: r.status,
        },
      );
    return data;
  }
  function sendAuth() {
    const s = getSocket();
    if (s?.readyState === 1 && auth)
      s.send(JSON.stringify({ type: "auth", token: auth.token }));
  }
  function drawChat() {
    const log = $("chatLog"),
      atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.replaceChildren(
      ...messages.slice(-40).map((m) => {
        const li = document.createElement("li"),
          b = document.createElement("b"),
          span = document.createElement("span");
        b.textContent = m.name + (m.agent ? " [AI]" : "") + ": ";
        span.textContent = m.text;
        li.append(b, span);
        return li;
      }),
    );
    if (atBottom) log.scrollTop = log.scrollHeight;
  }
  function refresh() {
    $("socialTitle").textContent = t("title");
    toggle.textContent = t("open");
    for (const [id, key] of [
      ["phantom", "phantom"],
      ["solflare", "solflare"],
      ["walletLogout", "logout"],
      ["chatSend", "send"],
      ["shopTitle", "shop"],
      ["currencyLabel", "currency"],
      ["clearEffect", "clear"],
      ["shopFees", "fee"],
      ["socialRead", "read"],
      ["payInvoice", "pay"],
      ["verifyInvoice", "retry"],
    ])
      $(id).textContent = t(key);
    $("checkoutNotice").hidden = checkoutConfigured;
    $("checkoutNotice").textContent =
      {
        en: "Purchases are being connected. No funds are sent until checkout is ready.",
        ru: "Покупки пока подключаются. До готовности оплаты деньги не отправляются.",
        "zh-CN": "购买服务正在配置，准备就绪前不会发送资金。",
      }[document.documentElement.lang] || "Purchases are being connected.";
    $("chatInput").placeholder = t("message");
    $("chatInput").setAttribute("aria-label", t("message"));
    $("walletInfo").textContent = auth
      ? t("wallet") +
        ": " +
        auth.wallet.slice(0, 4) +
        "…" +
        auth.wallet.slice(-4)
      : t("login");
    $("chatInput").disabled = !auth;
    $("chatSend").disabled = !auth;
    $("walletLogout").hidden = !auth;
    $("phantom").hidden = !!auth;
    $("solflare").hidden = !!auth;
    $("clearEffect").disabled = !auth || busy;
    $("shopItems").replaceChildren(
      ...Object.entries(ITEMS).map(([id, item]) => {
        const row = document.createElement("div"),
          label = document.createElement("span"),
          btn = document.createElement("button");
        label.textContent = item.icon + " " + t(id);
        const owned = inventory.owned.includes(id),
          cur = $("currency").value,
          c = CURRENCIES[cur];
        const amount =
          Number(BigInt(c.raw) * BigInt(item.factor)) / 10 ** c.decimals;
        btn.textContent = owned
          ? inventory.equipped === id
            ? "✓ " + t("owned")
            : t("equip")
          : `${amount.toLocaleString(document.documentElement.lang)} ${cur} · ${t("quote")}`;
        btn.disabled = !auth || busy || (!!pending && !owned);
        btn.onclick = () => (owned ? equip(id) : quote(id, cur));
        row.append(label, btn);
        return row;
      }),
    );
    $("invoice").hidden = !pending;
    if (pending) {
      const q = pending.quote;
      $("invoiceDetails").textContent =
        `${t(q.item)} · ${Number(q.raw) / 10 ** q.decimals} ${q.currency}\n${t("recipient")}: ${q.recipient}\n${t("ttl")}: ${new Date(q.expires).toLocaleTimeString()}\n${q.id}`;
      $("payInvoice").hidden = !!pending.signature;
      $("verifyInvoice").hidden = !pending.signature;
      $("payInvoice").disabled =
        busy || !auth || q.wallet !== auth.wallet || q.expires < Date.now();
      $("verifyInvoice").disabled = busy || !auth || q.wallet !== auth.wallet;
      $("receiptLink").hidden = !pending.signature;
      if (pending.signature)
        $("receiptLink").href =
          "https://solscan.io/tx/" + encodeURIComponent(pending.signature);
    }
  }
  function persistPending() {
    try {
      if (pending)
        localStorage.setItem("swarmPendingPurchase", JSON.stringify(pending));
      else localStorage.removeItem("swarmPendingPurchase");
    } catch {}
  }
  async function action(fn) {
    if (busy) return;
    busy = true;
    refresh();
    try {
      await fn();
    } catch (e) {
      status(e.message);
    } finally {
      busy = false;
      refresh();
    }
  }
  async function connect(kind) {
    await action(async () => {
      provider = kind === "phantom" ? window.phantom?.solana : window.solflare;
      if (!provider) throw Error(t("missing"));
      await provider.connect();
      const wallet = provider.publicKey.toString();
      const q = await api("challenge", { wallet });
      status(t("signing"));
      const signed = await provider.signMessage(
        new TextEncoder().encode(q.message),
        "utf8",
      );
      const signature = signed.signature || signed;
      const result = await api("login", {
        id: q.id,
        signature: btoa(String.fromCharCode(...signature)),
      });
      auth = { ...result, provider: kind };
      sessionStorage.setItem("swarmWallet", JSON.stringify(auth));
      inventory = await api("me");
      sendAuth();
      status(t("wallet"));
      provider.on?.("accountChanged", logout);
      provider.on?.("disconnect", logout);
    });
  }
  function logout() {
    auth = null;
    provider = null;
    inventory = { owned: [], equipped: null };
    try {
      sessionStorage.removeItem("swarmWallet");
    } catch {}
    const s = getSocket();
    if (s?.readyState === 1) s.send(JSON.stringify({ type: "logout" }));
    refresh();
  }
  async function equip(item) {
    await action(async () => {
      inventory = await api("equip", { item });
      sendAuth();
    });
  }
  async function quote(item, currency) {
    await action(async () => {
      pending = {
        quote: await api("quote", { item, currency }),
        signature: null,
      };
      persistPending();
    });
  }
  async function sdk() {
    if (window.solanaWeb3) return window.solanaWeb3;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("./vendor/solana-web3.min.js", import.meta.url).href;
      script.onload = resolve;
      script.onerror = () =>
        reject(Error("Could not load transaction library"));
      document.head.append(script);
    });
    return window.solanaWeb3;
  }
  async function pay() {
    await action(async () => {
      const q = pending.quote;
      if (Date.now() > q.expires)
        throw Error("Quote expired. Refresh the workshop.");
      provider ||=
        auth.provider === "phantom" ? window.phantom?.solana : window.solflare;
      if (!provider) throw Error(t("missing"));
      await provider.connect();
      if (provider.publicKey.toString() !== q.wallet)
        throw Error("Wallet changed. Sign in again.");
      const tx = buildTransaction(await sdk(), q);
      const signed = await provider.signAndSendTransaction(tx);
      pending.signature =
        typeof signed === "string" ? signed : signed.signature;
      if (!pending.signature)
        throw Error("Wallet did not return a transaction signature");
      persistPending();
      status(t("pending"));
    });
    if (pending?.signature) await claim();
  }
  async function claim() {
    await action(async () => {
      inventory = await api("claim", {
        id: pending.quote.id,
        signature: pending.signature,
      });
      pending = null;
      persistPending();
      sendAuth();
      status(t("confirmed"));
      sound("bank");
    });
  }
  $("phantom").onclick = () => connect("phantom");
  $("solflare").onclick = () => connect("solflare");
  $("walletLogout").onclick = logout;
  $("currency").onchange = refresh;
  $("clearEffect").onclick = () => equip(null);
  $("payInvoice").onclick = pay;
  $("verifyInvoice").onclick = claim;
  // Unpaid expired quotes can be safely discarded; paid receipts remain recoverable.
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "↻";
  reset.setAttribute("aria-label", "Clear unpaid quote");
  reset.onclick = () => {
    if (pending && !pending.signature) {
      pending = null;
      persistPending();
      refresh();
    }
  };
  $("invoice").append(reset);
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
  };
  $("socialClose").onclick = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };
  $("chatForm").onsubmit = (e) => {
    e.preventDefault();
    const s = getSocket();
    if (!auth || s?.readyState !== 1) {
      status(t("login"));
      return;
    }
    const text = $("chatInput").value.trim();
    if (text) {
      s.send(JSON.stringify({ type: "chat", text }));
      $("chatInput").value = "";
    }
  };
  new MutationObserver(refresh).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  refresh();
  fetch(API + "/health")
    .then((r) => r.json())
    .then((data) => {
      checkoutConfigured = !!data.checkoutConfigured;
      refresh();
    })
    .catch(() => {});
  if (auth)
    api("me")
      .then((data) => {
        inventory = data;
        refresh();
      })
      .catch((e) => {
        if (e.status === 401) logout();
        else status(e.message);
      });
  return {
    ready: sendAuth,
    message(data) {
      if (data.type === "chat-history") {
        messages = data.messages;
        drawChat();
      }
      if (data.type === "chat") {
        messages.push(data.message);
        messages = messages.slice(-40);
        drawChat();
        sound("chat");
      }
      if (data.type === "chat-error") status(t("chatError") + data.error);
    },
  };
}
