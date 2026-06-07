# Prompt — Horyzontalna Mapa Organizacji Obozu

> A whimsical cartoon-style illustrated scout camp map in HORIZONTAL layout, top-down isometric view. The landscape flows from LEFT to RIGHT through distinct zones connected by winding forest paths. **Maintain the exact same art style, color palette, and illustration technique as the previous map.**

## Layout (left → right)

**FAR LEFT — ETAP 1 (DANE PODSTAWOWE):**
A sunlit forest clearing with a wooden notice board pinned with forms, a scout tent cluster around a campfire with a Polish scout flag. This is where the journey begins. Clear space around for 5 UI node markers. *(No globe — ETAP 0 has a separate graphic.)*

**MID-LEFT — ETAP 3 (PSP):**
Moving right along the main winding path, the path reaches a red-brick fire station building at the forest edge, with a small red fire truck parked outside. This is the critical path node. **Tightly clustered directly next to the fire station** (within a few cm visually): a small group of document-related objects — a document folder, a rolled map, a radio, a rulebook — representing all ETAP 2 attachments. These should be positioned immediately adjacent to the PSP building, with short connecting paths flowing directly into it. Do NOT spread them across a large area or place them far away. The visual message is: "these documents feed directly into PSP".

**MID-RIGHT — ETAP 4 (KURATORIUM):**
Continuing right along the main path, it reaches a classical Polish government building with white walls, red roof, and Polish flag flying. Two small document bundles placed very close to the Kuratorium building (almost touching), representing the sub-items that feed into it.

**LOWER-RIGHT — ETAP 5 (ZADANIA POZOSTAŁE):**
A secondary trail branching downward from the main path between Kuratorium and the final camp, leading to: a police station, a hospital with red cross, a water tank, a garbage truck, and a wooden outhouse (latryny). These are independent side missions, clustered together in the lower portion.

**TOP-RIGHT AREA — ETAP 7 (PRZYGOTOWANIE PEDAGOGICZNE):**
Separated from the main path, in the upper-right area of the map. NOT a school building — instead, a large wooden outdoor table under a tree canopy, with 3-4 young adult instructors in Polish Scout Europe uniforms (green shirts, neckerchiefs with fleur-de-lis) sitting around it, studying papers and maps, in deep discussion. Books and notebooks scattered on the table. This is a standalone task, connected by its own separate winding path that runs independently along the top edge.

**FAR RIGHT — ETAP 6 (FINISH):**
The main path culminates at a large celebratory scout camp — fully set up tents, campfire blazing, scouts gathered, a banner stretched between two trees. This is the triumphant finale. Clear space for 4 UI node markers.

## Key Requirements

1. **ETAP 2 attachments right next to PSP**: Document-related items clustered immediately beside the fire station building, not spread out across the map. Short paths flowing directly into PSP.
2. **Pedagogical preparation**: Outdoor table with young adult instructors (20-30 years old) in Scout Europe uniforms, planning together under a tree. No classroom/school building.
3. **No globe**, no signposts with text, no labels anywhere on the image (UI text added programmatically).
4. **Main spine prominent**: A clear winding road from left to right passing through PSP → Kuratorium → side trails → FINISH.
5. **Maintain previous style**: Same warm green color palette, same vector-illustration feel, same whimsical but respectful scouting aesthetic. Scout symbols: fleur-de-lis, compass rose, neckerchief patterns.
6. **Aspect ratio**: Horizontal/landscape — approximately 3:2 or 16:10 ratio. Suggested dimensions: 1800×1200px or 2000×1300px.
7. **Clear empty space** around key nodes for placing interactive UI markers on top.
8. **Winding interconnected paths**: Forest trails connecting the zones, with branching side paths clearly visible.
