import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const planSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    actionPlan: { type: Type.STRING },
    designNotes: { type: Type.STRING },
    dimensions: { type: Type.STRING },
    material: { type: Type.STRING },
    joinery: { type: Type.STRING },
    units: { type: Type.STRING, enum: ["inches", "cm", "mm"] },
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
          thicknessNum: { type: Type.NUMBER },
          widthNum: { type: Type.NUMBER },
          lengthNum: { type: Type.NUMBER },
        },
        required: ["part", "quantity", "thickness", "width", "length", "material", "thicknessNum", "widthNum", "lengthNum"],
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
          text: { type: Type.STRING },
          activeParts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          imagePrompt: { type: Type.STRING }
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
          material: { type: Type.STRING },
          partGroup: { type: Type.STRING },
        },
        required: ["name", "width", "height", "depth", "x", "y", "z"],
      },
    },
    changesSummary: { type: Type.STRING },
  },
  required: ["name", "description", "actionPlan", "designNotes", "dimensions", "material", "joinery", "units", "cutList", "bom", "instructions", "modelParts"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isClarifying: { type: Type.BOOLEAN },
    message: { type: Type.STRING },
    plan: planSchema
  },
  required: ["isClarifying"]
};

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: "build a table",
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
