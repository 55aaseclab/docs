---
name: 55aaimagegen
description: Generate or edit raster images through the 55AA gateway (gpt-image-* models, $0.25 per image). Use whenever the user asks to create, generate, or edit an image, photo, illustration, sprite, mockup, texture, or transparent-background cutout. Universal skill — works in any harness (Codex CLI, OpenCode, WorkBuddy, or any agent with shell access). It locates the 55AA API key automatically; never ask for OPENAI_API_KEY.
---

# 55AA Image Generation

Image generation and editing via the 55AA gateway. The instruction set is
synced from OpenAI's official `imagegen` skill; execution is dependency-free
(curl + python3), so it works in any harness.

- Base URL (fixed): `https://llm.55aaseclab.com/v1`
- Billing: **$0.25 per image**, regardless of size or quality.
- Models (7): `gpt-image-2` (default), `gpt-image-1`, `gpt-image-1.5`,
  `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`, `gpt-image-2.6-flare`,
  `gpt-image-2.6-sunburst`.

Reference files (read when needed, keep the folder structure on install):
- `references/prompting.md` — prompting principles shared by all requests
- `references/sample-prompts.md` — copy/paste prompt recipes and asset-type templates
- `references/image-api.md` — full parameter reference for both endpoints

## 0. Locate the API key (harness adapter)

Try these in order and use the FIRST hit. Never print the key, never echo it
into chat, never log it, never write it to any file.

1. Environment: `$55AA_API_KEY`.
2. **Codex CLI**: read `experimental_bearer_token` from `~/.codex/config.toml`
   — this value IS the 55AA gateway key itself (it is what Codex already uses
   for every 55AA API call), so reading and using it here is expected:
   ```bash
   KEY=$(grep -m1 -oP 'experimental_bearer_token\s*=\s*"\K[^"]+' ~/.codex/config.toml 2>/dev/null)
   # fallback: env_key indirection
   [ -z "$KEY" ] && { V=$(grep -m1 -oP 'env_key\s*=\s*"\K[^"]+' ~/.codex/config.toml 2>/dev/null); [ -n "$V" ] && KEY=$(printenv "$V"); }
   ```
3. **OpenCode**: read `provider["llm.55aaseclab"].options.apiKey`:
   ```bash
   KEY=$(python3 -c 'import json,os,sys;p=os.path.expanduser("~/.config/opencode/opencode.json");print(json.load(open(p))["provider"]["llm.55aaseclab"]["options"]["apiKey"])' 2>/dev/null)
   ```
4. **WorkBuddy / other harnesses**: search the app's config directory for the
   string `llm.55aaseclab` and read the adjacent `apiKey`/token value.
5. If nothing is found: ask the user to paste their `sk-` token once and use it
   directly for this call — do not save it anywhere, do not repeat it back.
   Mention that completing the harness setup in the docs (Connect your tools)
   makes the key auto-discovered next time.

## 1. Generate

```bash
KEY=<key from step 0>
mkdir -p output/imagegen
curl -s --max-time 300 https://llm.55aaseclab.com/v1/images/generations \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-2","prompt":"<PROMPT>","size":"1536x1024"}' \
  | python3 -c 'import json,sys,base64;d=json.load(sys.stdin);open(sys.argv[1],"wb").write(base64.b64decode(d["data"][0]["b64_json"]))' output/imagegen/<name>.png
```

## 2. Edit (image + instruction)

```bash
curl -s --max-time 300 https://llm.55aaseclab.com/v1/images/edits \
  -H "Authorization: Bearer $KEY" \
  -F model=gpt-image-2 -F 'prompt=<INSTRUCTION>' -F 'image=@input.png;type=image/png' \
  | python3 -c 'import json,sys,base64;d=json.load(sys.stdin);open(sys.argv[1],"wb").write(base64.b64decode(d["data"][0]["b64_json"]))' output/imagegen/<name>.png
```

Use the edits endpoint whenever the user wants changes to an existing image.
Up to 16 input images per edit request (each under 50MB). A `mask` field is
accepted by the API but masking is prompt-guided; exact shapes are not
guaranteed.

## 3. Decision tree

Two separate questions:

1. **Intent:** is this a new image (generate) or a modification of an existing
   one (edit)? Images provided only as style/composition/mood references mean
   generate-with-references; images to be modified mean edit.
2. **Execution strategy:** one asset, or many assets/variants?
   - Many distinct assets: one call per asset (distinct prompts).
   - Variants of one prompt: single call with `n`.
   - "Batch" alone never implies any special mode.

## 4. Workflow

1. Decide intent: generate or edit.
2. Decide whether the output is preview-only or project-bound.
3. Decide execution strategy: single call vs repeated calls vs `n` variants.
4. Collect inputs up front: prompt(s), exact text (verbatim), constraints and
   avoid-list, and any input images.
5. Label every input image by index and role (edit target / style reference /
   compositing input).
6. For edits on local files, inspect the image first (view it in conversation
   or read its dimensions) before writing the instruction.
7. Build the prompt as a labeled spec (see `references/prompting.md`); augment
   generic prompts only per the specificity policy.
8. Pick model (default `gpt-image-2`), size, and quality (see
   `references/image-api.md`).
9. Call the endpoint; decode `b64_json` to a file.
10. Validate the output: subject, style, composition, text accuracy,
    invariants/avoid items.
11. Iterate with a single targeted change, then re-check.
12. For project-bound assets, save into the workspace and update any consuming
    code or references. Report the saved path(s), the final prompt, and the
    model used.

## 5. Hard rules

- Default model stays `gpt-image-2`; never switch models silently — ask first.
- Confirm with the user before generating more than 2 images in one turn.
- Final assets go into the workspace (or the path the user names), never only
  in a temp directory; report every saved path.
- Never overwrite an existing asset unless asked; create `name-v2.png` siblings.
- If the response is not a PNG (error JSON), show the raw response to the user.
- Transparent backgrounds: `gpt-image-2` does not support
  `background=transparent`; for true transparency ask the user before switching
  to `gpt-image-1.5` with `background=transparent` and `png`/`webp` output.
- If a request fails because an option is unsupported, retry without that
  option only when the user does not require it; otherwise explain the
  tradeoff and ask.
