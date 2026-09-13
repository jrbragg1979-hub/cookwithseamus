# Brand assets

## QR codes — `qr-get-*.svg`

Both encode **`cookwithseamus.com/get`**, which detects the device and forwards
to the App Store or Google Play. See `src/pages/get.astro` for why the code
points at our own domain rather than at a store or a shortener: a printed card
cannot be recalled, and this is the only link in the chain we can still edit.

Encode the **apex**, not `www`. The apex 307s to `www` at no cost a scanner
notices, and four fewer characters means a sparser code that survives being
printed small.

| file | error correction | modules | use when |
|---|---|---|---|
| `qr-get-M.svg` | M, ~15% recoverable | 25 | nothing covers the code — **default** |
| `qr-get-Q.svg` | H, ~30% recoverable | 29 | the Seamus mark sits over the centre |

`qr-get-Q.svg` is named for the level requested; segno upgraded it to H because
H fit the same symbol version. Denser, but it tolerates the middle being
obscured.

The `-proof.png` files are for scanning and eyeballing only. **Send the SVG to
the printer** — it is vector and scales to any size without softening.

### Printing

- **Minimum ~20mm square.** Below that, scans get unreliable at arm's length.
- **The quiet zone is baked in** (`border=4`). Do not let anyone crop to the
  edge of the pattern — a missing quiet zone is the most common reason a code
  fails to scan.
- **Dark on light only.** Inverted codes defeat a lot of scanners. Colours here
  are brand dark wood `#3E2C20` on cream `#FFFDF9`.
- **No tracking parameters.** They add density and buy nothing on print.

### Regenerating

```bash
python3 -m pip install segno
```

Then re-run the generator with the new URL. If the destination ever changes,
change `/get` instead — that is the entire point of the indirection, and it
means existing cards keep working.

## Store badges — `badge-*.svg`

The English pair, copied here so the card assets are one folder. **Official
artwork from Apple and Google. Never recreate, recolour, restyle or redraw
these** — both stores forbid it, and a hand-made lookalike is the kind of thing
that gets a listing pulled.

Rules that apply in print exactly as they do on screen:

- **Apple's badge goes first** when both appear, and must be the black variant.
- **Clear space of one quarter the badge height** on all sides.
- **Minimum height: 40px Apple, 28px Google** — in print, scale up from there,
  never down.

The full five-language set lives in `~/projects/seamus-promo/public/`, named
`badge-{store}-{lang}`. That flat naming IS the filing system: the Remotion
compositions reference those paths directly, so do not reorganise them into
per-language folders. Search by filename, not by folder.

Fresh artwork, if it is ever needed:
- Apple — https://toolbox.marketingtools.apple.com/app-store/ (50 locales)
- Google — https://partnermarketinghub.withgoogle.com/brands/google-play/
