export interface CutListItem {
  part: string;
  quantity: number;
  thickness: string;
  width: string;
  length: string;
  material: string;
}

export interface BOMItem {
  item: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

export interface ModelPart {
  name: string;
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
}

export interface BuildPlan {
  id?: string;
  userId: string;
  name: string;
  description: string;
  designNotes?: string;
  dimensions: string;
  material: string;
  joinery: string;
  units: "inches" | "cm" | "mm";
  experienceLevel?: string;
  designStyle?: string;
  cutList: CutListItem[];
  bom: BOMItem[];
  instructions: string[];
  modelParts?: ModelPart[];
  changesSummary?: string;
  warnings?: string[];
  version?: number;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  hasPlan?: boolean;
  imageData?: string; // base64 encoded image
  imageMimeType?: string; // e.g., "image/jpeg", "image/png"
}
