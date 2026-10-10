import { COUNTRIES, appearance, flag } from "../multiplayer/profile.js";
const words = {
  en: { nick: "Nickname", country: "Flag", color: "Colour", none: "No flag" },
  ru: { nick: "Имя цикады", country: "Флаг", color: "Цвет", none: "Без флага" },
  "zh-CN": { nick: "昵称", country: "国旗", color: "颜色", none: "无国旗" },
};
export function profileUI() {
  const nick = document.getElementById("nickname"),
    country = document.getElementById("country"),
    color = document.getElementById("color");
  try {
    const v = JSON.parse(localStorage.getItem("swarmProfile"));
    if (v) {
      nick.value = typeof v.name === "string" ? v.name.slice(0, 20) : "";
      const a = appearance(v);
      country.dataset.saved = a.country;
      color.value = a.color;
    }
  } catch {}
  function translate() {
    const lang = document.documentElement.lang,
      w = words[lang] || words.en,
      current = country.value || country.dataset.saved || "";
    let names;
    try {
      names = new Intl.DisplayNames([lang], { type: "region" });
    } catch {}
    const options = [new Option(w.none, "")];
    for (const code of COUNTRIES)
      options.push(
        new Option(`${flag(code)} ${names?.of(code) || code}`, code),
      );
    country.replaceChildren(...options);
    country.value = current;
    for (const key of ["nick", "country", "color"]) {
      const label = document.getElementById(key + "Label");
      if (label) label.textContent = w[key];
    }
    color.setAttribute("aria-label", w.color);
    country.setAttribute("aria-label", w.country);
  }
  function value() {
    return {
      name: nick.value.trim().slice(0, 20) || "Cicada",
      ...appearance({ country: country.value, color: color.value }),
    };
  }
  for (const el of [nick, country, color])
    el.addEventListener("change", () => {
      try {
        localStorage.setItem("swarmProfile", JSON.stringify(value()));
      } catch {}
      delete country.dataset.saved;
    });
  new MutationObserver(translate).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  translate();
  return {
    value,
    lock(locked) {
      nick.disabled = country.disabled = color.disabled = locked;
    },
  };
}
