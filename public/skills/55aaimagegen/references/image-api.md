# Image API quick reference

Parameter reference for both endpoints of the 55AA gateway image API. The base
URL is fixed: `https://llm.55aaseclab.com/v1`.

## Endpoints
- Generate: `POST /v1/images/generations` (JSON body)
- Edit: `POST /v1/images/edits` (multipart form)
- Response: `data[]` list with `b64_json` per image; decode to a file.

## Model summary

| Model | Quality | Notes |
| --- | --- | --- |
| `gpt-image-2` | `low`, `medium`, `high`, `auto` | Default for new workflows: high-quality generation and editing, text-heavy images, photorealism, compositing, identity-sensitive edits. Always high fidelity for image inputs; do not set `input_fidelity`. Flexible sizes (constraints below). |
| `gpt-image-1.5` | `low`, `medium`, `high`, `auto` | True transparent-background fallback (`background=transparent` + `png`/`webp`). Sizes: `1024x1024`, `1024x1536`, `1536x1024`, `auto`. Supports `input_fidelity` (`low`/`high`). |
| `gpt-image-1` | `low`, `medium`, `high`, `auto` | Legacy compatibility. Same fixed sizes as 1.5. |
| `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`, `gpt-image-2.6-flare`, `gpt-image-2.6-sunburst` | model-specific | Newer GPT Image variants tunneled through the Codex images endpoint; output size is authoritative (the upstream may normalize requested controls to `auto`). |

## gpt-image-2 sizes

`gpt-image-2` accepts `auto` or any `WIDTHxHEIGHT` size that satisfies all
constraints:

- Maximum edge length must be less than or equal to `3840px`.
- Both edges must be multiples of `16px`.
- Long edge to short edge ratio must not exceed `3:1`.
- Total pixels must be at least `655,360` and no more than `8,294,400`.

Popular sizes:

| Label | Size | Notes |
| --- | --- | --- |
| Square | `1024x1024` | Typical fast default |
| Landscape | `1536x1024` | Standard landscape |
| Portrait | `1024x1536` | Standard portrait |
| 2K square | `2048x2048` | Larger square output |
| 2K landscape | `2048x1152` | Widescreen output |
| 4K landscape | `3840x2160` | Widescreen 4K output |
| 4K portrait | `2160x3840` | Vertical 4K output |
| Auto | `auto` | Default size |

Square images are typically fastest to generate.

## Core parameters (generations)
- `prompt`: text prompt
- `model`: image model
- `n`: number of images (variants of ONE prompt)
- `size`: `auto` by default; flexible `WIDTHxHEIGHT` sizes only for `gpt-image-2`; older models use `1024x1024`, `1536x1024`, `1024x1536`, or `auto`
- `quality`: `low`, `medium`, `high`, or `auto`
- `background`: output transparency behavior (`transparent`, `opaque`, `auto`) — not the same as the prompt's scene/backdrop
- `output_format`: `png` (default), `jpeg`, `webp`
- `output_compression`: 0-100 (jpeg/webp only)
- `moderation`: `auto` (default) or `low`

## Edit-specific parameters (multipart)
- `image`: one or more input images (up to 16, each under 50MB)
- `mask`: optional mask image; masking is prompt-guided, exact shapes not guaranteed
- `input_fidelity`: `low` or `high`, only for models that support it; do NOT set for `gpt-image-2`
  - `gpt-image-1`/`gpt-image-1-mini` preserve all input images (first image gets richest detail)
  - `gpt-image-1.5` preserves the first 5 input images with higher fidelity

## Transparent backgrounds
- `gpt-image-2` does not support `background=transparent`.
- For true transparency: switch to `gpt-image-1.5` with `background=transparent`
  and a transparent-capable output format (`png` or `webp`) — ask the user
  before switching unless they already requested it.
- Alternative with `gpt-image-2`: generate on a flat chroma-key color and
  remove the background locally.

## Quality guidance
- `low`: fast drafts, thumbnails, quick iterations.
- `medium` / `high`: final assets, dense text, diagrams, identity-sensitive
  edits, high-resolution outputs.
- Large sizes and high quality increase latency (billing stays $0.25/image).

## Error handling
- If a request fails because a specific option is unsupported by the selected
  model, retry without that option only when the option is not required by the
  user; otherwise explain the tradeoff and ask.
- If the response contains an error JSON instead of `data[]`, show it to the
  user as-is.
