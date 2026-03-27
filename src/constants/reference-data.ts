export interface MaterialInfo {
  id: string;
  name: string;
  type: string;
  costPerBdFt?: number;
  costPerSheet?: number;
}

export interface JoineryInfo {
  id: string;
  name: string;
  strength: string;
  difficulty: string;
}

export const MATERIALS: MaterialInfo[] = [
  { id: "mat_1", name: "Walnut", type: "Hardwood", costPerBdFt: 12.50 },
  { id: "mat_2", name: "White Oak", type: "Hardwood", costPerBdFt: 8.00 },
  { id: "mat_3", name: "Baltic Birch Plywood", type: "Sheet Good", costPerSheet: 85.00 },
  { id: "mat_4", name: "MDF", type: "Sheet Good", costPerSheet: 45.00 },
];

export const JOINERY: JoineryInfo[] = [
  { id: "join_1", name: "Mortise and Tenon", strength: "High", difficulty: "Hard" },
  { id: "join_2", name: "Dovetail", strength: "High", difficulty: "Hard" },
  { id: "join_3", name: "Pocket Hole", strength: "Medium", difficulty: "Easy" },
  { id: "join_4", name: "Dowels", strength: "Medium", difficulty: "Medium" },
];
