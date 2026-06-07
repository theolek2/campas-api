# Prompt — Horyzontalna Mapa Organizacji Obozu

> A whimsical cartoon-style illustrated scout camp map in HORIZONTAL layout, top-down isometric view. The landscape flows from LEFT to RIGHT through distinct zones connected by winding forest paths. **Maintain the exact same art style, color palette, and illustration technique as the previous map.**

## Layout (left → right)

**FAR LEFT — ETAP 0 & 1 (START):**
A globe floating above a forest canopy in the upper-left corner. Below it, a sunlit forest clearing with: a wooden notice board pinned with forms, a scout tent cluster around a campfire with a Polish scout flag. This is where the journey begins. Clear space around for 5 UI node markers.

**MID-LEFT — ETAP 3 (PSP - FIRE STATION):**
Moving right along the main winding path, the path leads to a red-brick fire station building at the forest edge, with a small red fire truck parked outside and a wooden sign "PSP" above the door. This is the critical path node.

**BRANCHING UP (above the main path, between ETAP 1 and PSP):**
A side trail branching upward from the main path, leading to a small cluster of wooden signposts in the upper area: "Regulamin", "Instrukcja PPOŻ", "Mapy (zał.3-4)", "Łączność". These are ETAP 2 documents — side paths converging back down directly to the PSP fire station (visual dependency: arrows or path lines flowing DOWN to the fire station).

**MID-RIGHT — ETAP 4 (KURATORIUM):**
Continuing right along the main path, it reaches a classical Polish government building with white walls, red roof, and Polish flag flying. A wooden sign "Kuratorium Oświaty". Two small side trails branching upward from near Kuratorium — one leading to "Zaświadczenia o niekaralności", another to "Lista uczestników" (placed very close to Kuratorium to show they feed directly into it).

**LOWER-RIGHT — ETAP 5 (SIDE MISSIONS):**
A secondary trail branching DOWNWARD from the main path between Kuratorium and the final camp, leading to: a police station (blue sign), a hospital (red cross), a water tank (mauzer), a garbage truck icon, and a wooden outhouse symbol (latryny). These are independent side missions, clustered together in the lower portion.

**TOP-RIGHT AREA — ETAP 7 (PRZYGOTOWANIE PEDAGOGICZNE):**
Separated from the main path, in the upper-right area of the map (near but distinct from the final camp area). A small school or classroom building among trees, with a book icon. Connected by its own separate winding path that runs independently along the top edge. This is a standalone task, visually placed apart to show independence from the main dependency chain.

**FAR RIGHT — ETAP 6 (FINISH):**
The main path culminates at a large celebratory scout camp — fully set up tents, campfire blazing, scouts gathered, a banner "OBÓZ GOTOWY" stretched between two trees. This is the triumphant finale. Clear space for 4 UI node markers.

## Key Requirements

1. **Side paths close to targets**: The PSP side-trail documents (ETAP 2) should flow directly INTO the PSP fire station, visually showing dependency. The Kuratorium sub-items should be very close to the Kuratorium building.
2. **Pedagogical preparation isolated**: Placed in the upper-right, visibly separate from the main dependency chain, with its own independent path.
3. **Main spine prominent**: A clear winding road from left (START) to right (FINISH) passing through PSP → Kuratorium → side trails → FINISH.
4. **Maintain previous style**: Same warm green color palette, same vector-illustration feel, same whimsical but respectful scouting aesthetic. Scout symbols: fleur-de-lis, compass rose, neckerchief patterns.
5. **NO TEXT OR LABELS** on the image itself (text added as UI overlay).
6. **Aspect ratio**: Horizontal/landscape — approximately 3:2 or 16:10 ratio. Suggested dimensions: 1800×1200px or 2000×1300px.
7. **Clear empty space** around key nodes for placing interactive UI markers on top.
8. **Winding interconnected paths**: Forest trails connecting the zones, with branching side paths clearly visible.
