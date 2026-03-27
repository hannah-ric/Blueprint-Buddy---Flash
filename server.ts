import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, Content } from "@google/genai";
import { MATERIALS, JOINERY } from "./src/constants/reference-data.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const planSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the furniture piece" },
    description: { type: Type.STRING, description: "Brief description of the design" },
    designNotes: { type: Type.STRING, description: "Detailed reasoning, structural analysis, and self-correction notes for the design choices" },
    dimensions: { type: Type.STRING, description: "Overall dimensions (e.g., 48x18x30 in)" },
    material: { type: Type.STRING, description: "Primary material (e.g., Walnut, Oak)" },
    joinery: { type: Type.STRING, description: "Primary joinery method" },
    units: { type: Type.STRING, enum: ["inches", "cm", "mm"], description: "The unit of measurement used throughout the plan" },
    cutList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          part: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          thickness: { type: Type.STRING },
          width: { type: Type.STRING },
          length: { type: Type.STRING },
          material: { type: Type.STRING },
        },
        required: ["part", "quantity", "thickness", "width", "length", "material"],
      },
    },
    bom: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          estimatedCost: { type: Type.NUMBER },
        },
        required: ["item", "quantity", "unit", "estimatedCost"],
      },
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    modelParts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          depth: { type: Type.NUMBER },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          z: { type: Type.NUMBER },
        },
        required: ["name", "width", "height", "depth", "x", "y", "z"],
      },
    },
    changesSummary: { type: Type.STRING, description: "When modifying a previous design, list every specific change made (e.g., 'Increased leg height from 28\" to 32\", updated cut list and modelParts accordingly'). Leave empty for first-time designs." },
  },
  required: ["name", "description", "designNotes", "dimensions", "material", "joinery", "units", "cutList", "bom", "instructions", "modelParts"],
};

const materialsContext = `\nAVAILABLE MATERIALS:\n${JSON.stringify(MATERIALS, null, 2)}`;
const joineryContext = `\nAVAILABLE JOINERY:\n${JSON.stringify(JOINERY, null, 2)}`;

function buildSystemPrompt(experienceLevel: string, designStyle: string): string {
  return `You are Blueprint Buddy, an expert furniture designer and master woodworker.
Generate a detailed, professional-grade build plan based on the user's request AND the provided conversation history.

*** ADVANCED REASONING & SELF-CORRECTION PHASE ***
Before finalizing the plan, you MUST perform a structural and practical analysis of your initial design concept.
Document this process in the 'designNotes' field:
1. Analyze the load-bearing requirements and structural integrity (e.g., "A 60-inch span will sag without an apron").
2. Evaluate material efficiency and joinery appropriateness for the user's experience level.
3. Explicitly state any self-corrections made during your thought process (e.g., "Initially considered pocket holes, but changed to dowels for better shear strength on the legs").

If the user asks for modifications (e.g., "make it taller", "change to walnut"), apply them to the previous design context.
When modifying an existing design, populate the 'changesSummary' field with a bullet-point list of every specific change you made (dimensions changed, parts added/removed, materials swapped, positions adjusted). Be precise with before/after values. For first-time designs, leave changesSummary empty.
Include a precise cut list, bill of materials (BOM), and step-by-step assembly instructions.
Ensure all dimensions are realistic and joinery is structurally sound.
If the user provides a reference image, analyze it for style, proportions, materials, and visible joinery, then incorporate those observations into the design. Describe what you see in the image in your designNotes.

IMPORTANT: Respect the user's preferred units (inches, cm, or mm). If not specified, default to inches.
All measurements in the cut list and dimensions must use the specified units consistently.

USER EXPERIENCE LEVEL: ${experienceLevel.toUpperCase()}
- If BEGINNER: Favor simple joinery (pocket holes, butt joints with screws), standard dimensional lumber, and highly detailed, forgiving instructions.
- If INTERMEDIATE: Include dowels, dados, rabbets, and standard woodworking techniques.
- If ADVANCED: Suggest traditional joinery (dovetails, mortise and tenon), complex angles, and professional finishing techniques.

DESIGN STYLE: ${designStyle.toUpperCase()}
Ensure the design, materials, dimensions, and joinery strictly reflect the chosen style.

--- FURNITURE STYLES KNOWLEDGE BASE ---
1. MID-CENTURY MODERN (MCM): Clean lines, organic curves, tapered legs (often angled), minimal ornamentation. Woods: Walnut, Teak, Rosewood. Joinery: Hidden, flush joints, dowels.
2. CRAFTSMAN / ARTS & CRAFTS: Sturdy, rectilinear proportions. Exposed joinery (through-tenons, pegged mortises). Woods: Quartersawn White Oak. Details: Corbels, overhangs, prominent grain.
3. SHAKER: Extreme simplicity, utility, and functional minimalism. Tapered or turned legs. Wooden knobs. Woods: Cherry, Maple, Pine. Joinery: Mortise and tenon, dovetails.
4. INDUSTRIAL: Mix of raw wood and metal (steel/iron). Chunky proportions. Exposed hardware (bolts, rivets, turnbuckles). Woods: Reclaimed wood, distressed finishes.
5. FARMHOUSE: Chunky turned or square legs, x-braces. Often features painted bases with stained tops. Woods: Pine, Oak. Joinery: Pocket holes (modern farmhouse), lap joints.
6. CONTEMPORARY: Sleek, geometric, floating elements. Mixed materials (glass, metal, engineered wood). Joinery: Hidden, hardware-based (cam locks, biscuits).
7. TRADITIONAL: Ornate details, cabriole legs, molding, routing, carving. Woods: Mahogany, Cherry. Joinery: Classic complex joinery.

${materialsContext}${joineryContext}

--- FURNITURE KNOWLEDGE BASE & STANDARDS ---
1. Ergonomics & Standard Dimensions:
   - Dining/Desk Table Height: 28" - 30" (71-76cm)
   - Coffee Table Height: 16" - 18" (40-46cm)
   - End Table Height: 22" - 24" (55-61cm)
   - Chair Seat Height: 17" - 19" (43-48cm)
   - Bar Stool Seat Height: 28" - 30" (71-76cm)
   - Counter Stool Seat Height: 24" - 26" (61-66cm)
   - Kitchen Cabinet Depth: 24" (61cm) lower, 12" (30cm) upper
2. Lumber Sizing (Nominal vs. Actual):
   - 1x (e.g., 1x4) is actually 3/4" thick.
   - 2x (e.g., 2x4) is actually 1.5" thick.
   - Plywood is typically 1/4", 1/2", or 3/4" (often slightly undersized, e.g., 23/32").
3. Structural Integrity:
   - Spans over 36" (90cm) typically require aprons or center supports to prevent sagging.
   - Always account for wood movement across the grain (especially for solid wood tabletops; use figure-8 fasteners, z-clips, or slotted holes).

--- CROSS-REFERENCE & CONSISTENCY RULES ---
Before finalizing your output, you MUST verify the following:

1. CUT LIST ↔ MODEL PARTS CONSISTENCY:
   - Every part in the cutList MUST have corresponding entries in modelParts.
   - For cutList items with quantity > 1, include that many separate entries in modelParts with distinct positions (e.g., 4 legs = 4 modelParts named "Front Left Leg", "Front Right Leg", etc.).
   - The modelPart dimensions (width, height, depth) must match the cutList dimensions (thickness, width, length) for each part. Map thickness→smallest dimension, width→medium, length→largest as appropriate for part orientation.

2. OVERALL DIMENSIONS CONSISTENCY:
   - The 'dimensions' field must match the bounding box of all assembled modelParts. Calculate the min/max x, y, z across all parts (accounting for part sizes) and verify the result matches your stated dimensions.

3. BOM COMPLETENESS:
   - The BOM must include sufficient board feet or sheets to cover all cutList items.
   - Include ALL hardware referenced in instructions (screws, glue, finish, brackets, etc.).
   - Every BOM item must have a realistic estimatedCost > 0.

4. INSTRUCTION INTEGRITY:
   - Assembly instructions must reference parts by the exact names used in the cutList.
   - Steps should follow a logical assembly order (sub-assemblies before final assembly).

3D MODEL GENERATION:
You must also generate a simplified 3D representation in the 'modelParts' array.
Deconstruct the furniture into basic rectangular blocks (e.g., 4 legs, 1 top).
For each part, provide its dimensions (width, height, depth) and its center position (x, y, z) in 3D space.

3D POSITIONING RULES:
- The ground plane is at y = 0. Position the furniture so the bottom of the lowest parts (e.g., leg bottoms) sit at y = 0 (meaning the center y of a leg = leg_height / 2).
- Parts must not overlap in 3D space — verify no two parts occupy the same volume.
- The center of the assembled furniture should be approximately at x = 0, z = 0.
- Use the same units for 3D coordinates as the rest of the plan.`;
}

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

function validatePlan(plan: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cutList = plan.cutList as Array<{ part: string; quantity: number; thickness: string; width: string; length: string; material: string }> | undefined;
  const modelParts = plan.modelParts as Array<{ name: string; width: number; height: number; depth: number; x: number; y: number; z: number }> | undefined;
  const bom = plan.bom as Array<{ item: string; quantity: number; estimatedCost: number }> | undefined;
  const instructions = plan.instructions as string[] | undefined;

  if (!cutList?.length) {
    errors.push("cutList is empty — must contain at least one part.");
    return { errors, warnings };
  }

  // 1. Check cutList ↔ modelParts consistency
  if (modelParts?.length) {
    // Count expected model parts (accounting for quantity)
    const expectedPartCount = cutList.reduce((sum, item) => sum + item.quantity, 0);
    if (modelParts.length !== expectedPartCount) {
      errors.push(
        `modelParts count (${modelParts.length}) does not match cutList total quantity (${expectedPartCount}). Each cutList item with quantity N should produce N modelParts with distinct positions.`
      );
    }

    // Check that each cutList part name appears in modelParts
    for (const item of cutList) {
      const matchingParts = modelParts.filter(
        (mp) => mp.name.toLowerCase().includes(item.part.toLowerCase()) || item.part.toLowerCase().includes(mp.name.toLowerCase())
      );
      if (matchingParts.length === 0) {
        errors.push(
          `cutList part "${item.part}" has no matching entry in modelParts. Every cutList part must appear in modelParts.`
        );
      }
    }

    // 2. Check modelPart dimensions roughly match cutList
    for (const item of cutList) {
      const matchingPart = modelParts.find(
        (mp) => mp.name.toLowerCase().includes(item.part.toLowerCase()) || item.part.toLowerCase().includes(mp.name.toLowerCase())
      );
      if (matchingPart) {
        const cutDims = [parseFloat(item.thickness), parseFloat(item.width), parseFloat(item.length)]
          .filter((d) => !isNaN(d))
          .sort((a, b) => a - b);
        const modelDims = [matchingPart.width, matchingPart.height, matchingPart.depth]
          .sort((a, b) => a - b);
        if (cutDims.length === 3) {
          for (let i = 0; i < 3; i++) {
            const ratio = modelDims[i] / cutDims[i];
            if (ratio < 0.5 || ratio > 2.0) {
              warnings.push(
                `Dimension mismatch for "${item.part}": cutList [${cutDims.join(",")}] vs modelPart [${modelDims.join(",")}]. These should be closely aligned.`
              );
              break;
            }
          }
        }
      }
    }

    // 3. Check for overlapping parts (simplified — check if any two parts share the same position)
    for (let i = 0; i < modelParts.length; i++) {
      for (let j = i + 1; j < modelParts.length; j++) {
        const a = modelParts[i];
        const b = modelParts[j];
        if (Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.z - b.z) < 0.01) {
          warnings.push(
            `modelParts "${a.name}" and "${b.name}" have identical positions (${a.x}, ${a.y}, ${a.z}). They likely need distinct positions.`
          );
        }
      }
    }
  } else {
    errors.push("modelParts is empty — must contain 3D representations of all cutList parts.");
  }

  // 4. Check BOM has items
  if (!bom?.length) {
    errors.push("BOM is empty — must include wood/materials and hardware.");
  } else {
    const hasZeroCost = bom.some((item) => item.estimatedCost <= 0);
    if (hasZeroCost) {
      warnings.push("Some BOM items have estimatedCost <= 0. All items should have realistic cost estimates.");
    }
  }

  // 5. Check instructions reference cutList part names
  if (instructions?.length && cutList.length) {
    const partNames = cutList.map((item) => item.part.toLowerCase());
    const referencedInInstructions = partNames.some((name) =>
      instructions.some((step) => step.toLowerCase().includes(name))
    );
    if (!referencedInInstructions) {
      warnings.push("Assembly instructions don't reference any cutList part names. Instructions should use specific part names.");
    }
  }

  return { errors, warnings };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Reference data endpoints
  app.get("/api/lookup/materials", (_req, res) => {
    res.json(MATERIALS);
  });

  app.get("/api/lookup/joinery", (_req, res) => {
    res.json(JOINERY);
  });

  // Plan generation endpoint (Gemini API key stays server-side)
  app.post("/api/generate", async (req, res) => {
    const { messages, userId, experienceLevel, designStyle } = req.body;

    if (!messages || !userId || !experienceLevel || !designStyle) {
      res.status(400).json({ error: "Missing required fields: messages, userId, experienceLevel, designStyle" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      return;
    }

    try {
      const contents: Content[] = messages.map((msg: { role: string; content: string; imageData?: string; imageMimeType?: string }) => {
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: msg.content }];
        if (msg.imageData && msg.imageMimeType) {
          parts.push({
            inlineData: {
              mimeType: msg.imageMimeType,
              data: msg.imageData,
            },
          });
        }
        return { role: msg.role, parts };
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents,
        config: {
          systemInstruction: buildSystemPrompt(experienceLevel, designStyle),
          responseMimeType: "application/json",
          responseSchema: planSchema,
        },
      });

      let planData = JSON.parse(response.text);
      const systemPrompt = buildSystemPrompt(experienceLevel, designStyle);

      // Validate the plan
      let validation = validatePlan(planData);

      // Auto-retry once if there are errors
      if (validation.errors.length > 0) {
        console.log("Plan validation failed, retrying with corrections:", validation.errors);
        const correctionMessage = `Your previous response had these issues that need fixing:\n${validation.errors.map((e) => `- ${e}`).join("\n")}\n${validation.warnings.length > 0 ? `\nWarnings:\n${validation.warnings.map((w) => `- ${w}`).join("\n")}` : ""}\n\nPlease regenerate the plan with these issues corrected.`;

        const retryContents: Content[] = [
          ...contents,
          { role: "model", parts: [{ text: response.text }] },
          { role: "user", parts: [{ text: correctionMessage }] },
        ];

        const retryResponse = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: retryContents,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: planSchema,
          },
        });

        planData = JSON.parse(retryResponse.text);
        validation = validatePlan(planData);
      }

      // Include any remaining warnings in the response
      const allWarnings = [...validation.errors, ...validation.warnings];

      res.json({
        ...planData,
        userId,
        experienceLevel,
        designStyle,
        warnings: allWarnings.length > 0 ? allWarnings : undefined,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Gemini API error:", error);
      const message = error instanceof Error ? error.message : "Failed to generate build plan";
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
