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
