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
The header portal connects this farm to https://robotcyb.ai/ through a shared multicolor star portal (skipped for reduced motion). Entering the farm enables a quiet synthesized cosmic sound and seasonal ambience; SOUND turns all audio off. Hidden tabs suspend audio.

Robotcyb has a Russian/English project guide plus browser inference using WebLLM 0.2.85 and Qwen2.5 0.5B (q4f16). The model downloads automatically in the background from Hugging Face, approximately 300 MB, and requires WebGPU plus sufficient GPU memory. Computation runs in a module worker; STOP AI terminates it; RETRY AI restarts it. Small-model answers are fallible and Russian and English are supported. Conversation stays on-device; model/runtime downloads contact jsDelivr, Hugging Face and MLC's model library host. No API key or paid server is needed.

The token address comes from the supplied project source. Market metrics are shown only for the matching Solana pool returned by GeckoTerminal for the configured PumpSwap pool; missing fields mean unavailable data, not a fabricated zero price. The contract and direct links remain visible.

Token metrics refresh once per minute while the panel is open. Verified market cap and FDV remain separate; API null values are never displayed as zero. Seasonal ambience includes a quiet orbital pad with season-specific notes, layered below wind/rain textures.

Ambient modulation uses slow 18–40 second cycles, softened upper frequencies, a six-second chord fade-in and 1.8-second crossfades between seasons.

Robotcyb and CicadaFarm use the same portal renderer and local AI runtime. Automatic warm-up starts when the initial UI is ready. During loading the guide/original mode responses remain available. Model loading progress is shown in chat, and GPU/runtime failures leave the original experience usable. Portal canvas is active only during departure/arrival, caps at 30 fps and uses fewer particles on mobile.

## CicadaFarm: Swarm

`play/` is a free, standalone canvas game with EN/RU/Chinese UI, pointer and keyboard controls, three-minute rounds, weather, computer-controlled bots and local progress. The solo mode has no wallet connection, payments or redeemable rewards. The separate multiplayer mode is linked from the header. Local scores are not trusted for future paid entitlements or public rankings.

## Shared Garden multiplayer beta

`play/online.html` connects to the separate `multiplayer/` Cloudflare Worker and SQLite-backed Durable Object. Twenty numbered rooms hold up to twelve players each. The server owns movement, harvesting and scores; clients send targets only. Rooms use 10 Hz snapshots, bounded input size/rate and a 30-second reconnect window while the instance remains active. No permanent player accounts, cross-restart recovery, purchases or global rankings. Nicknames are public to room participants; no chat or wallet connection. Active simulations consume Durable Object duration quota. Hidden clients stop sending input and are disconnected after 60 seconds; idle rooms stop their timer. The first production deployment uses the Cloudflare dashboard, not GitHub automatic Worker builds. Deploy the Worker from `multiplayer/` using `npx wrangler deploy`.

## Pollen growth update

Both modes share the authoritative `multiplayer/model.js` rules: pollen increases mass, rare purple nectar is worth five, larger cicadas move more slowly, and a cicada at least 25% heavier can absorb a smaller one outside the safe farm. Respawn grants a five-second shield and keeps delivered harvest; thorns spill cargo and reduce mass. Nicknames, ISO country flags and hex colours are validated on the server. Player growth and absorption are never supplied by the client.

Solo mode includes three banked-harvest goals, a lasting garden on this browser and a UTC daily map with a fixed random seed and simulation step. Screen resizing does not change the map. Daily results are local, unverified scores and can be copied after a completed round. The personal garden is saved at each deposit; clearing browser storage removes it. Multiplayer room progress remains temporary and no token purchases or redeemable rewards are enabled.
