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

export interface InstructionStep {
  text: string;
  activeParts?: string[];
  imageUrl?: string;
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
  instructions: (InstructionStep | string)[];
  modelParts?: ModelPart[];
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  hasPlan?: boolean;
  planData?: string;
  imageData?: string;
  imageMimeType?: string;
}
