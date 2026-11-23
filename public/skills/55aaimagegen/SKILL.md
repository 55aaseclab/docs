---
name: 55aaimagegen
description: Generate or edit raster images through the 55AA gateway (gpt-image-* models, $0.25 per image). Use whenever the user asks to create, generate, or edit an image, photo, illustration, sprite, mockup, texture, or transparent-background cutout. Universal skill — works in any harness (Codex CLI, OpenCode, WorkBuddy, or any agent with shell access). It locates the 55AA API key automatically; never ask for OPENAI_API_KEY.
---

# 55AA Image Generation (universal)

Image generation and editing via the 55AA gateway. Prompting guidance is synced
from OpenAI's official `imagegen` skill; execution is dependency-free (curl +
python3), so it works in any harness.

- Base URL (fixed): `https://llm.55aaseclab.com/v1`
- Billing: **$0.25 per image**, regardless of size or quality.
- Models (7): `gpt-image-2` (default), `gpt-image-1`, `gpt-image-1.5`,
  `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`, `gpt-image-2.6-flare`,
  `gpt-image-2.6-sunburst`.

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

- `n` (1–4) produces variants of ONE prompt; distinct assets need distinct calls.
- Optional `quality`: `low|medium|high|auto` (billing unchanged).

## 2. Edit (image + instruction)

```bash
curl -s --max-time 300 https://llm.55aaseclab.com/v1/images/edits \
  -H "Authorization: Bearer $KEY" \
  -F model=gpt-image-2 -F 'prompt=<INSTRUCTION>' -F 'image=@input.png;type=image/png' \
  | python3 -c 'import json,sys,base64;d=json.load(sys.stdin);open(sys.argv[1],"wb").write(base64.b64decode(d["data"][0]["b64_json"]))' output/imagegen/<name>.png
```

Edits preserve invariants aggressively ("change only X; keep Y unchanged").

## 3. Sizes

`1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `2048x1152`, `3840x2160`,
`2160x3840`, `auto`. Constraints for custom sizes: max edge ≤ 3840px, both
edges multiples of 16px, long:short ≤ 3:1, total pixels 655,360–8,294,400.

## 4. Prompting (synced from OpenAI official imagegen skill)

Structure prompts as a labeled spec, then augment only what materially helps:

```text
Use case: <slug>            Asset type: <where it is used>
Primary request: <user goal>  Input images: <role of each> (optional)
Scene/backdrop: …            Subject: …          Style/medium: …
Composition/framing: …       Lighting/mood: …    Color palette: …
Text (verbatim): "…"         Constraints: …      Avoid: …
```

Use-case slugs: `photorealistic-natural`, `product-mockup`, `ui-mockup`,
`infographic-diagram`, `scientific-educational`, `ads-marketing`,
`productivity-visual`, `logo-brand`, `illustration-story`, `stylized-concept`,
`historical-scene`; edit slugs: `text-localization`, `identity-preserve`,
`precise-object-edit`, `lighting-weather`, `background-extraction`,
`style-transfer`, `compositing`, `sketch-to-render`.

Rules synced from the official skill:
- Quote exact text verbatim; spell tricky words letter-by-letter.
- For edits, repeat invariants every iteration to reduce drift.
- Do not silently switch models (default stays `gpt-image-2` unless the user asks).
- "Batch" does not imply CLI flags; one call per requested asset.
- Prefer editing repo-native SVG/vector assets directly when the task is
  icon/logo/UI-graphic shaped; use this skill only for raster outputs.

## 5. Output and delivery rules

- Save final assets into the workspace (e.g. `output/imagegen/` or the path the
  user names), never only in `/tmp`; report the saved path(s) and the final prompt.
- Never overwrite an existing asset unless asked; create `name-v2.png` siblings.
- If the response is not a PNG (error JSON), show the raw response to the user.
- Confirm with the user before generating more than 2 images in one turn.
- Transparent backgrounds are not supported by `gpt-image-2` via this API;
  tell the user before attempting.
