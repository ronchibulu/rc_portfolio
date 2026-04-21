# Phase 3: Asset Optimization Pipeline - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Produce a production-ready `gaming_setup_v12.glb` under 2 MB with self-hosted Draco decoder binaries. The source file `gaming_setup_v12.glb` at repo root is 51 MB — must be compressed with Draco geometry compression and WebP texture conversion using `@gltf-transform/cli` (v4.3.0, already installed as devDependency).

**In scope:**
- Install `@gltf-transform/cli` as devDependency (done — v4.3.0)
- Run gltf-transform pipeline: draco + webp texture conversion on `gaming_setup_v12.glb`
- Output optimized `.glb` to `public/models/gaming_setup_v12.glb`
- Copy Draco decoder binaries from `node_modules/three/examples/jsm/libs/draco/` to `public/draco/`
- Add npm script `optimize-model` for reproducibility
- Verify output is < 2 MB and renders visually intact

**Not in scope:**
- R3F canvas (Phase 4), scene setup (Phase 5)
- KTX2/Basis Universal (overkill for a single model portfolio)
- meshopt compression (Draco is sufficient and Drei useGLTF supports it natively)

</domain>

<decisions>
## Implementation Decisions

### Optimization strategy
- **Draco geometry compression** — primary size reduction. Use `gltf-transform draco` with default quantization bits (position: 14, normal: 10, texcoord: 12) unless model is too large after defaults.
- **WebP texture conversion** — secondary size reduction. Use `gltf-transform webp` to convert all PNG/JPEG textures to WebP.
- **Pipeline order:** draco first, then webp — allows texture conversion to work on an already-geometry-compressed file.
- **Single command chain** via `gltf-transform sequence` or two separate commands if sequence has issues.
- **Target size:** < 2 MB (SCENE-001, PERF-004). If first pass is still > 2 MB, reduce Draco quantization bits (position: 12, texcoord: 10).
- **Fallback if WebP alone insufficient:** add `gltf-transform resize --width 1024 --height 1024` to downsample large textures before WebP.

### Draco decoder setup
- Source: `node_modules/three/examples/jsm/libs/draco/` — contains `draco_decoder.js`, `draco_decoder.wasm`, `draco_encoder.js`, `draco_wasm_wrapper.js`
- Destination: `public/draco/` (already created)
- Copy these 4 files verbatim — no modification needed
- Drei `useGLTF.setDecoderPath('/draco/')` will reference this path in Phase 5

### npm script
- `"optimize-model": "gltf-transform draco gaming_setup_v12.glb tmp_draco.glb && gltf-transform webp tmp_draco.glb public/models/gaming_setup_v12.glb && rm tmp_draco.glb"`
- Or single-step if gltf-transform supports piping.
- Add to `package.json` scripts so the pipeline is reproducible.

### Verification
- `ls -la public/models/gaming_setup_v12.glb` → confirm < 2,097,152 bytes (2 MB)
- `ls public/draco/` → confirm 4 decoder files present
- Visual integrity: note that visual check of the 3D model happens in Phase 5 when it renders in the browser; Phase 3 verification is size + file presence only. A basic gltf-transform `inspect` can confirm mesh/material counts match the source.

</decisions>

<code_context>
## Existing Code Insights

### Source asset
- `gaming_setup_v12.glb` at repo root — 51,553,308 bytes (51 MB raw)
- Will be optimized and moved to `public/models/gaming_setup_v12.glb`
- Source file stays at repo root (for re-optimization if needed); optimized output goes to public/

### Tools available
- `@gltf-transform/cli@4.3.0` — installed as devDependency
- `@gltf-transform/extensions@4.3.0` — installed alongside CLI
- Draco decoder: `node_modules/three/examples/jsm/libs/draco/` — 4 files

### Downstream integration (Phase 5)
- `useGLTF('/models/gaming_setup_v12.glb')` in the R3F scene component
- `useGLTF.preload('/models/gaming_setup_v12.glb')` at module level
- `DRACOLoader.setDecoderPath('/draco/')` set via Drei `useGLTF.setDecoderPath('/draco/')` once at app init

### No TypeScript/Astro files modified in this phase
- This phase is purely a CLI tool pipeline + file system operation
- No `src/` changes except possibly adding a utility import note to a future Phase 5 component (out of scope here)

</code_context>

<specifics>
## Specific Ideas

- Run `gltf-transform inspect gaming_setup_v12.glb` first to understand texture sizes and mesh complexity before optimizing — helps set realistic size expectations.
- If the file ends up between 1.8-2.0 MB after standard Draco+WebP, that's acceptable (target is under 2 MB, not exactly 2 MB).
- The `tmp_draco.glb` intermediate file should be deleted after pipeline completes and should be in `.gitignore` (or handled via the script itself).
- `public/models/` and `public/draco/` directories already created in this session.

</specifics>

<deferred>
## Deferred Ideas

- KTX2/Basis Universal compression — overkill for a single model, adds complexity to the Draco setup
- meshopt — not needed given Draco coverage
- LOD variants — out of scope for v1
- Automated re-optimization in CI — Phase 11 concern if needed
- AVIF texture variant — WebP is sufficient browser support for 2026

</deferred>

---

*Phase: 03-asset-optimization-pipeline*
*Context gathered: 2026-04-22 (auto, discuss skipped)*
