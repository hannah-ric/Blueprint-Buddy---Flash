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
  imagePrompt?: string;
}

export interface BuildPlan {
  id?: string;
  userId: string;
  name: string;
  description: string;
  actionPlan?: string;
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

// Marketplace & Skills types

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: "design" | "materials" | "joinery" | "finishing" | "business" | "general";
  icon: string;
  promptInjection?: string;
  referenceData?: Record<string, unknown>;
  author: string;
}

export interface SkillBundle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  author: string;
  version: string;
  icon: string;
  category: "engineering" | "marketing" | "leadership" | "design" | "general";
  skills: Skill[];
  installCount: number;
  rating: number;
  tags: string[];
}

export interface MarketplaceSource {
  id: string;
  name: string;
  owner: string;
  url: string;
  addedAt: string;
}

export interface InstalledBundle {
  bundleId: string;
  installedAt: string;
  version: string;
  enabled: boolean;
}
