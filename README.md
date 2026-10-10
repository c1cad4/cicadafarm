# CicadaFarm

Living pixel farm adapted from the supplied `CicadaFarm_5.6_PIXEL_TWIN_EN.html`, with the owner's cicada artwork used for the header logo, introduction and favicon.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Use an HTTP server rather than opening the HTML file directly, because the optional 3D introduction loads a binary particle asset. No dependency installation or build is required. Three.js 0.160.0 is vendored locally, with its MIT notice in `assets/THREE-LICENSE.txt`.

## Verification

Node 22+:

```sh
node --check assets/app.js
node --check assets/runtime.js
node --test tests/*.test.cjs
```

The regression suite checks malformed/blocked browser storage, quota failures, bounded history and the stoppable 30 fps animation loop. Browser checks cover entry, logo loading, removed WebGL canvas after entry, navigation, cart, knowledge, chat and responsive layouts.

## Performance and behavior

- HTML, CSS, JavaScript, artwork and particles are separate cacheable files. The page no longer parses embedded megabytes of base64 images.
- The optional introduction renders at up to 30 fps, with bounded pixel density and fewer particles on narrow screens. WebGL failure falls back to the cicada emblem; reduced-motion visitors get the static introduction.
- Entering the farm disposes the renderer, geometries and materials. Background tabs pause animation, patrol, weather timers and market polling.
- Market requests run only while the token view is present, have an 8-second timeout and never overlap. Network failure leaves the rest of the farm usable.
- Browser data is validated and bounded. If storage is blocked or full, the site preserves current-session changes and displays a notice.
- A device-camera preview stops its media tracks when the panel closes or the page is hidden.

The farm values, sensor states, chat responses and camera-hub labels are demonstrations. Market data comes from DexScreener when a matching token market exists. The market saves a local order draft only; no payment, shipment, live farm telemetry or native mesh messaging is implemented.

## Hosting

Serve this repository as a static site. All assets use relative paths, including when hosted at `/cicadafarm/`. For GitHub Pages, select the `main` branch and root directory in **Settings → Pages**. The `.nojekyll` file keeps these static assets unchanged. The expected Pages URL is https://c1cad4.github.io/cicadafarm/ once Pages is enabled and deployment completes.

### Robotcyb experience
The header portal connects this farm to https://robotcyb.ai/ with a short transition (skipped for reduced motion). Entering the farm enables a quiet synthesized cosmic sound and seasonal ambience; SOUND turns all audio off. Hidden tabs suspend audio.

Robotcyb has a Russian/English project guide plus optional browser inference using WebLLM 0.2.85 and SmolLM2 135M (q0f16). The model downloads from Hugging Face only on LOAD SMALL AI, approximately 300 MB, and requires WebGPU plus sufficient GPU memory. Computation runs in a module worker; STOP AI terminates it. Small-model answers are fallible and English works best. Conversation stays on-device; model/runtime downloads contact jsDelivr, Hugging Face and MLC's model library host. No API key or paid server is needed.

The token address comes from the supplied project source. Market metrics are shown only for matching Solana pairs returned by DexScreener; no indexed pair means unavailable data, not a fabricated zero price. The contract and direct links remain visible.
