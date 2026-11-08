# Icons & Design System License Notice

## Morphicons Attribution

Curry's redesigned SVG iconography system is modeled after the design language and geometric specifications of **Morphicons** ([https://morphicons.com](https://morphicons.com)).

### License (MIT)

```text
MIT License

Copyright (c) 2024-2026 Morphicons / Morphicons Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Icon Specifications in Curry
- **ViewBox**: `0 0 24 24` standard Cartesian bounding box.
- **Stroke Width**: `2px` constant visual weight.
- **Caps & Joins**: `stroke-linecap="round"` and `stroke-linejoin="round"`.
- **Theme Compatibility**: Rendered with `currentColor` stroke, dynamically tinted by Curry's CSS custom properties (`--accent-neon`, `--text-primary`, `--text-secondary`, and theme presets).
- **Application Fallback Icon**: High-contrast, geometric desktop window glyph replacing plain text initial fallbacks for missing or custom application assets.
