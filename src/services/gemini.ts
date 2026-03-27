import { GoogleGenAI, Type, Content } from "@google/genai";
import { BuildPlan, ChatMessage } from "../types";

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
          material: { type: Type.STRING }
        },
        required: ["part", "quantity", "thickness", "width", "length", "material"]
      }
    },
    bom: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          estimatedCost: { type: Type.NUMBER }
        },
        required: ["item", "quantity", "unit", "estimatedCost"]
      }
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
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
          z: { type: Type.NUMBER }
        },
        required: ["name", "width", "height", "depth", "x", "y", "z"]
      }
    }
  },
  required: ["name", "description", "designNotes", "dimensions", "material", "joinery", "cutList", "bom", "instructions", "modelParts"]
};

let cachedMaterialsContext = "";
let cachedJoineryContext = "";
let isCacheLoaded = false;

export async function generateBuildPlan(messages: ChatMessage[], userId: string, experienceLevel: string, designStyle: string): Promise<BuildPlan> {
  const model = "gemini-3.1-pro-preview";
  
  // Fetch reference data to enhance the AI's knowledge base (cached)
  if (!isCacheLoaded) {
    try {
      const [materialsRes, joineryRes] = await Promise.all([
        fetch("/api/lookup/materials"),
        fetch("/api/lookup/joinery")
      ]);
      if (materialsRes.ok && joineryRes.ok) {
        const materials = await materialsRes.json();
        const joinery = await joineryRes.json();
        cachedMaterialsContext = `\nAVAILABLE MATERIALS:\n${JSON.stringify(materials, null, 2)}`;
        cachedJoineryContext = `\nAVAILABLE JOINERY:\n${JSON.stringify(joinery, null, 2)}`;
        isCacheLoaded = true;
      }
    } catch (e) {
      console.warn("Could not fetch reference data", e);
    }
  }

  const contents: Content[] = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: `You are Blueprint Buddy, an expert furniture designer and master woodworker. 
      Generate a detailed, professional-grade build plan based on the user's request AND the provided conversation history.
      
      *** ADVANCED REASONING & SELF-CORRECTION PHASE ***
      Before finalizing the plan, you MUST perform a structural and practical analysis of your initial design concept.
      Document this process in the 'designNotes' field:
      1. Analyze the load-bearing requirements and structural integrity (e.g., "A 60-inch span will sag without an apron").
      2. Evaluate material efficiency and joinery appropriateness for the user's experience level.
      3. Explicitly state any self-corrections made during your thought process (e.g., "Initially considered pocket holes, but changed to dowels for better shear strength on the legs").
      
      If the user asks for modifications (e.g., "make it taller", "change to walnut"), apply them to the previous design context.
      Include a precise cut list, bill of materials (BOM), and step-by-step assembly instructions.
      Ensure all dimensions are realistic and joinery is structurally sound.
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
      
      ${cachedMaterialsContext}${cachedJoineryContext}
      
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
      
      3D MODEL GENERATION:
      You must also generate a simplified 3D representation in the 'modelParts' array. 
      Deconstruct the furniture into basic rectangular blocks (e.g., 4 legs, 1 top).
      For each part, provide its dimensions (width, height, depth) and its center position (x, y, z) in 3D space.
      Assume the center of the entire furniture piece is at (0, 0, 0).
      Use the same units for these 3D coordinates as the rest of the plan.`,
      responseMimeType: "application/json",
      responseSchema: planSchema
    }
  });

  const planData = JSON.parse(response.text);
  return {
    ...planData,
    userId,
    experienceLevel,
    designStyle,
    createdAt: new Date().toISOString()
  };
}
