# DENKU transparent stickers

Mode: built-in imagegen image editing, one reference per asset. Original PNGs are retained.

Outputs in `assets/denku`: `senyum-transparent.png`, `berpikir-transparent.png`, `celengan-transparent.png`, `jempol-transparent.png`, `merayakan-transparent.png`, `kaget-transparent.png`.

Prompt used for each named reference:

Remove ONLY the room, curtains, chair, plain beige or cream backdrop and all background washes. Output a PNG with genuine fully transparent alpha background, not a checkerboard or flat white background. Preserve the subject's facial likeness, expression, hair, patterned shirt, existing pose, hands, and any held chicken-shaped piggy bank. Preserve decorative hearts, lightbulb, question marks and yellow accent lines. No new props, text or redesign. Keep all original visible elements and portrait composition.

Thinking pose was retried individually after the first generation did not return an output, with the same preservation constraints.

## Animated WebP expressions

Mode: built-in imagegen image editing produced transparent 2×2 sprite sheets from the supplied DENKU references; Pillow split and encoded the cells as lossless Animated WebP files.

- `nabung-animated.webp`: DENKU progressively smiles as rupiah coins enter the chicken piggy bank.
- `target-animated.webp`: DENKU crouches, jumps with both hands raised, and lands amid green banknote confetti.
- `nangis-animated.webp`: user-supplied sequential crying frames assembled as a transparent animation.

The imagegen prompts required exact facial likeness, hairstyle, black-orange batik shirt, stable scale and anchoring, genuine transparent alpha, no text or scenery, and four sequential frames. The savings prompt preserved the chicken piggy bank and advanced gold coins toward its slot. The target prompt advanced a two-handed jump with green banknotes appearing and falling.
