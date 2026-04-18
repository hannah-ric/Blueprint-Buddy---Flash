import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, Content, ThinkingLevel } from "@google/genai";
import { validatePlan } from "./src/lib/validate-plan.ts";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __dirname = path.dirname(__filename);

// Initialize Firebase for server-side knowledge base access safely
let db: any = null;
try {
  if (fs.existsSync('./firebase-applet-config.json')) {
    const configStr = fs.readFileSync('./firebase-applet-config.json', 'utf-8');
    const firebaseConfig = JSON.parse(configStr);
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("firebase-applet-config.json not found. Knowledge base will not be loaded.");
  }
} catch (err) {
  console.error("Error initializing Firebase:", err);
}

let knowledgeBaseCache: any = null;

async function getKnowledgeBase() {
  if (knowledgeBaseCache) return knowledgeBaseCache;
  if (!db) return null;
  
  try {
    const [materialsDoc, joineryDoc, hardwareDoc, lumberDoc, stylesDoc, ergoDoc] = await Promise.all([
      getDoc(doc(db, "knowledge_base", "materials")),
      getDoc(doc(db, "knowledge_base", "joinery")),
      getDoc(doc(db, "knowledge_base", "hardware")),
      getDoc(doc(db, "knowledge_base", "lumber_standards")),
      getDoc(doc(db, "knowledge_base", "furniture_styles")),
      getDoc(doc(db, "knowledge_base", "ergonomics"))
    ]);

    knowledgeBaseCache = {
      materials: materialsDoc.data()?.data || [],
      joinery: joineryDoc.data()?.data || [],
      hardware: hardwareDoc.data()?.data || [],
      lumber_standards: lumberDoc.data()?.data || [],
      furniture_styles: stylesDoc.data()?.data || [],
      ergonomics: ergoDoc.data()?.data || []
    };
    return knowledgeBaseCache;
  } catch (error) {
    console.error("Failed to fetch knowledge base:", error);
    return null;
  }
}

// ai instance will be created per request

const planSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the furniture piece (max 50 characters)" },
    description: { type: Type.STRING, description: "Brief description of the design" },
    actionPlan: { type: Type.STRING, description: "A detailed, step-by-step action plan and research summary developed before drafting the final design. This should show thorough examination of the request, structural considerations, and the planned approach." },
    designNotes: { type: Type.STRING, description: "Educational, user-centric explanation of the design choices, structural reasoning, and any modifications made. Keep it simple, encouraging, and easy to understand." },
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
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The instruction step text." },
          activeParts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of exact modelPart names that are being assembled or focused on in this step. Used to highlight parts in the 3D viewer."
          },
          imagePrompt: {
            type: Type.STRING,
            description: "A highly specific visual description of ONLY this exact assembly step. Describe exactly which parts are being attached, their orientation, and the specific action (e.g., 'Attaching the two front legs to the front apron using pocket screws'). Do not describe the finished piece, only the current state of assembly. Mention highlighting the active parts."
          }
        },
        required: ["text"]
      },
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
  required: ["name", "description", "actionPlan", "designNotes", "dimensions", "material", "joinery", "units", "cutList", "bom", "instructions", "modelParts"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isClarifying: { type: Type.BOOLEAN, description: "Set to true if the user's request is too vague and you need to ask clarifying questions before generating a plan." },
    message: { type: Type.STRING, description: "The clarifying question or conversational response to the user. Required if isClarifying is true." },
    plan: planSchema
  },
  required: ["isClarifying"]
};

function buildSystemPrompt(experienceLevel: string, designStyle: string, kb: any): string {
  const materialsContext = kb?.materials ? `\nAVAILABLE MATERIALS:\n${JSON.stringify(kb.materials, null, 2)}` : "";
  const joineryContext = kb?.joinery ? `\nAVAILABLE JOINERY:\n${JSON.stringify(kb.joinery, null, 2)}` : "";
  const hardwareContext = kb?.hardware ? `\nAVAILABLE HARDWARE:\n${JSON.stringify(kb.hardware, null, 2)}` : "";
  const stylesContext = kb?.furniture_styles ? `\nFURNITURE STYLES KNOWLEDGE BASE:\n${JSON.stringify(kb.furniture_styles, null, 2)}` : "";
  const ergoContext = kb?.ergonomics ? `\nERGONOMICS & STANDARD DIMENSIONS:\n${JSON.stringify(kb.ergonomics, null, 2)}` : "";
  const lumberContext = kb?.lumber_standards ? `\nLUMBER STANDARDS:\n${JSON.stringify(kb.lumber_standards, null, 2)}` : "";

  return `You are Blueprint Buddy, an expert furniture designer and master woodworker.
Generate a highly detailed, professional-grade build plan based on the user's request AND the provided conversation history.

*** CLARIFYING QUESTIONS PHASE ***
If the user's request is too vague, unclear, or lacks necessary details to generate a good plan (e.g., "build a table" with no dimensions, style, or purpose), you MUST set 'isClarifying' to true.
When 'isClarifying' is true, provide a conversational response in the 'message' field asking 1-2 specific questions to fine-tune the approach (e.g., "What kind of table are you looking for? A dining table, coffee table, or desk? Do you have any specific dimensions in mind?").
Do NOT generate the 'plan' object if you are asking clarifying questions.
Only set 'isClarifying' to false and generate the full 'plan' when you have enough information to proceed.

*** RESEARCH & ACTION PLAN ***
Before generating the final cut list and instructions, you must thoroughly examine the user's request, research standard dimensions and structural requirements, and develop a comprehensive action plan.
Document this in the 'actionPlan' field. This should read like a master woodworker's initial sketch and brainstorming session. Think deeply about the physics of the piece, the proportions, load-bearing requirements, and the step-by-step approach you will take to design it. Ensure the design is structurally sound and practical to build.

*** DESIGN REASONING & EDUCATIONAL EXPLANATION ***
Before finalizing the plan, you MUST perform a structural and practical analysis of your design concept.
Document this process in the 'designNotes' field in a user-centric, educational, and simple way:
1. Explain the structural choices simply (e.g., "I added an apron under the table top to prevent it from sagging over time", or "I used mortise and tenon joints for the legs to ensure maximum stability").
2. Explain why the chosen materials and joinery are appropriate for the user's experience level and the piece's intended use.
3. If you made any self-corrections or modifications from the user's request, explain why in a helpful, educational tone (e.g., "You asked for 1/2 inch plywood for the legs, but I upgraded it to 3/4 inch to ensure the table is sturdy enough to hold weight").

If the user asks for modifications (e.g., "make it taller", "change to walnut"), apply them to the previous design context.
When modifying an existing design, populate the 'changesSummary' field with a bullet-point list of every specific change you made (dimensions changed, parts added/removed, materials swapped, positions adjusted). Be precise with before/after values. For first-time designs, leave changesSummary empty.
Include a precise cut list, bill of materials (BOM), and step-by-step assembly instructions.
IMPORTANT: The assembly instructions MUST be an array of objects, where each object has a 'text' field for the instruction step, an optional 'activeParts' array containing the exact names of the modelParts involved in that step, and an optional 'imagePrompt' field containing a highly descriptive visual prompt for generating an illustration of the step.
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

${stylesContext}
${materialsContext}
${joineryContext}
${hardwareContext}
${ergoContext}
${lumberContext}

--- FURNITURE KNOWLEDGE BASE & STANDARDS ---
1. Structural Integrity & Wood Movement:
   - Spans over 36" (90cm) typically require aprons or center supports to prevent sagging.
   - ALWAYS account for wood movement across the grain. For solid wood tabletops, you MUST suggest appropriate fasteners (e.g., figure-8 fasteners, z-clips, or slotted holes/buttons) to attach the top to the base. Never glue or screw a solid wood top directly to a frame without allowing for expansion.
   - Legs must be properly braced (e.g., with aprons, stretchers, or brackets) to prevent racking.
   - Material Suitability: Evaluate material choice based on stress and load. For load-bearing parts (like legs or primary shelves), ensure the chosen wood species has sufficient hardness and density. Avoid softwoods for high-wear areas unless explicitly requested.

--- CROSS-REFERENCE & CONSISTENCY RULES ---
Before finalizing your output, you MUST verify the following:

1. CUT LIST ↔ MODEL PARTS CONSISTENCY:
   - Every part in the cutList MUST have corresponding entries in modelParts.
   - For cutList items with quantity > 1, include that many separate entries in modelParts with distinct positions (e.g., 4 legs = 4 modelParts named "Front Left Leg", "Front Right Leg", etc.).
   - The modelPart dimensions (width, height, depth) must match the cutList dimensions (thickness, width, length) for each part. Map thickness→smallest dimension, width→medium, length→largest as appropriate for part orientation.

2. OVERALL DIMENSIONS CONSISTENCY:
   - The 'dimensions' field must match the bounding box of all assembled modelParts. Calculate the min/max x, y, z across all parts (accounting for part sizes) and verify the result matches your stated dimensions.

3. BOM COMPLETENESS & HARDWARE INTEGRATION:
   - The BOM must include sufficient board feet or sheets to cover all cutList items.
   - Seamlessly and accurately integrate hardware details (e.g., hinges, drawer slides, pulls, fasteners) into the design.
   - Include ALL hardware referenced in instructions (screws, glue, finish, brackets, hinges, drawer slides, pulls, etc.) in the BOM.
   - Every BOM item must have a realistic estimatedCost > 0.

4. INSTRUCTION INTEGRITY:
   - Assembly instructions must reference parts by the exact names used in the cutList.
   - Steps should follow a logical assembly order (sub-assemblies before final assembly).
   - Hardware installation (e.g., attaching drawer slides, mounting hinges) MUST be explicitly detailed in the instructions.

5. 3D MODEL GENERATION:
   - You must also generate a simplified 3D representation in the 'modelParts' array.
   - Deconstruct the furniture into basic rectangular blocks (e.g., 4 legs, 1 top, aprons, stretchers).
   - Hardware MUST be included in the modelParts. This includes visible representations of hardware like screws, hinges, drawer slides, pulls, and fasteners.
   - Position these hardware parts accurately according to the assembly instructions and BOM.
   - Use simplified geometry for hardware (e.g., a small thin cylinder or box for a screw, a thin box for a drawer slide or hinge) and name them clearly (e.g., 'Left Drawer Slide', 'Pocket Screw 1').
   - For each part, provide its dimensions (width, height, depth) and its center position (x, y, z) in 3D space.

3D POSITIONING RULES:
- The ground plane is at y = 0. Position the furniture so the bottom of the lowest parts (e.g., leg bottoms) sit at y = 0 (meaning the center y of a leg = leg_height / 2).
- Parts must not overlap in 3D space — verify no two parts occupy the same volume.
- The center of the assembled furniture should be approximately at x = 0, z = 0.
- Use the same units for 3D coordinates as the rest of the plan.`;
}



async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Security and utility middleware
  app.use(cors());
  if (process.env.NODE_ENV === "production") {
    app.use(helmet());
  }

  // Rate limiting for the generate endpoint
  const generateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    const isDegraded = !process.env.GEMINI_API_KEY && !process.env.API_KEY_DEV;
    res.json({ 
      status: isDegraded ? "degraded" : "ok",
      timestamp: new Date().toISOString(),
      issues: isDegraded ? ["GEMINI_API_KEY is not configured"] : []
    });
  });

  // Reference data endpoints
  app.get("/api/lookup/materials", async (_req, res) => {
    const kb = await getKnowledgeBase();
    res.json(kb?.materials || []);
  });

  app.get("/api/lookup/joinery", async (_req, res) => {
    const kb = await getKnowledgeBase();
    res.json(kb?.joinery || []);
  });

  // Plan generation endpoint (Gemini API key stays server-side)
  app.post("/api/generate", generateLimiter, async (req, res, next) => {
    const { messages, experienceLevel, designStyle } = req.body;

    if (!messages || !experienceLevel || !designStyle) {
      res.status(400).json({ error: "Missing required fields: messages, experienceLevel, designStyle" });
      return;
    }

    const apiKey = process.env.API_KEY_DEV || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: "API Key is not configured" });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const kb = await getKnowledgeBase();

    try {
      const contents: Content[] = messages.map((msg: { role: string; content: string; imageData?: string; imageMimeType?: string; planData?: string }) => {
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: msg.content }];
        if (msg.planData) {
          parts.push({ text: `\n\n[SYSTEM: The current plan JSON is provided below for context. If the user requests a change, modify this plan.]\n${msg.planData}` });
        }
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

      // AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents,
          config: {
            systemInstruction: buildSystemPrompt(experienceLevel, designStyle),
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const responseData = JSON.parse(response.text);
      
      if (responseData.isClarifying) {
        res.json(responseData);
        return;
      }

      let planData = responseData.plan;
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

        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 120000);

        let retryResponse;
        try {
          retryResponse = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: retryContents,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            },
          });
        } finally {
          clearTimeout(retryTimeoutId);
        }

        const retryData = JSON.parse(retryResponse.text);
        if (retryData.isClarifying) {
          res.json(retryData);
          return;
        }
        planData = retryData.plan;
        validation = validatePlan(planData);
      }

      // Include any remaining warnings in the response
      const allWarnings = [...validation.errors, ...validation.warnings];

      res.json({
        isClarifying: false,
        plan: {
          ...planData,
          experienceLevel,
          designStyle,
          warnings: allWarnings.length > 0 ? allWarnings : undefined,
          createdAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error("Gemini API error:", error);
      next(error);
    }
  });

  // API 404 handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Global error middleware
  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ 
      error: err instanceof Error && err.message === "AbortError" ? "Request timed out" : "Internal server error" 
    });
  });

  const imageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many image requests from this IP" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  app.post("/api/generate-image", imageLimiter, async (req, res) => {
    const { prompt, planName, stepText } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const apiKey = process.env.API_KEY_DEV || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "API Key is not configured" });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const fullPrompt = `A clear, professional, minimalist 3D illustration of a woodworking assembly step for a ${planName || 'furniture piece'}. 
Instruction: "${stepText || ''}"
Visual Details: ${prompt}. 
Style: White background, clean lines, instructional manual style (like IKEA), isometric view. 
CRITICAL: Show ONLY the parts being assembled in this specific step. Do NOT show the fully completed furniture unless this is the final step. Highlight the active parts being attached right now. Make it look like a technical diagram.`;

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });
      
      let base64 = null;
      let mimeType = 'image/jpeg';
      
      if (imageResponse.candidates && imageResponse.candidates.length > 0) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            base64 = part.inlineData.data;
            if (part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            break;
          }
        }
      }

      if (base64) {
        res.json({ imageUrl: `data:${mimeType};base64,${base64}` });
      } else {
        res.status(500).json({ error: "No image generated" });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image" });
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("SIGTERM/SIGINT received. Shutting down gracefully...");
    server.close(() => {
      console.log("Closed out remaining connections.");
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
