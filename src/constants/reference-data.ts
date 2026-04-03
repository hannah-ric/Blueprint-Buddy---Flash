export interface MaterialInfo {
  id: string;
  name: string;
  type: "Hardwood" | "Softwood" | "Sheet Good";
  hardness?: number; // Janka hardness rating
  costPerBdFt?: number;
  costPerSheet?: number;
  density?: string; // lbs per board foot approximate
  workability: "Easy" | "Medium" | "Hard";
  commonUses: string[];
  finishability: "Excellent" | "Good" | "Fair";
}

export interface JoineryInfo {
  id: string;
  name: string;
  strength: "Low" | "Medium" | "High" | "Very High";
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  bestFor: string[];
  toolsRequired: string[];
  experienceLevel: "Beginner" | "Intermediate" | "Advanced";
}

export interface HardwareInfo {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  unit: string;
}

export interface LumberStandard {
  nominal: string;
  actualThickness: number;
  actualWidth: number;
  unit: "inches";
}

// ─── MATERIALS ──────────────────────────────────────────────────────────────────

export const MATERIALS: MaterialInfo[] = [
  // Hardwoods
  { id: "mat_1", name: "Walnut", type: "Hardwood", hardness: 1010, costPerBdFt: 12.50, density: "2.8", workability: "Medium", commonUses: ["tables", "cabinets", "decorative pieces"], finishability: "Excellent" },
  { id: "mat_2", name: "White Oak", type: "Hardwood", hardness: 1360, costPerBdFt: 8.00, density: "3.1", workability: "Medium", commonUses: ["tables", "chairs", "cabinets", "flooring"], finishability: "Good" },
  { id: "mat_3", name: "Red Oak", type: "Hardwood", hardness: 1290, costPerBdFt: 6.50, density: "3.0", workability: "Easy", commonUses: ["tables", "shelving", "cabinets"], finishability: "Good" },
  { id: "mat_4", name: "Cherry", type: "Hardwood", hardness: 950, costPerBdFt: 9.00, density: "2.5", workability: "Easy", commonUses: ["cabinets", "tables", "fine furniture"], finishability: "Excellent" },
  { id: "mat_5", name: "Hard Maple", type: "Hardwood", hardness: 1450, costPerBdFt: 7.50, density: "3.1", workability: "Hard", commonUses: ["cutting boards", "workbenches", "tables"], finishability: "Good" },
  { id: "mat_6", name: "Ash", type: "Hardwood", hardness: 1320, costPerBdFt: 6.00, density: "2.8", workability: "Easy", commonUses: ["chairs", "tool handles", "bent laminations"], finishability: "Good" },
  { id: "mat_7", name: "Mahogany", type: "Hardwood", hardness: 800, costPerBdFt: 14.00, density: "2.5", workability: "Easy", commonUses: ["fine furniture", "boats", "musical instruments"], finishability: "Excellent" },
  { id: "mat_8", name: "Poplar", type: "Hardwood", hardness: 540, costPerBdFt: 3.50, density: "2.0", workability: "Easy", commonUses: ["painted furniture", "interior trim", "drawer sides"], finishability: "Fair" },
  { id: "mat_9", name: "Hickory", type: "Hardwood", hardness: 1820, costPerBdFt: 7.00, density: "3.4", workability: "Hard", commonUses: ["chairs", "tool handles", "rustic furniture"], finishability: "Fair" },
  { id: "mat_10", name: "Teak", type: "Hardwood", hardness: 1070, costPerBdFt: 28.00, density: "2.9", workability: "Medium", commonUses: ["outdoor furniture", "boat decks", "shower benches"], finishability: "Excellent" },
  { id: "mat_11", name: "Alder", type: "Hardwood", hardness: 590, costPerBdFt: 5.00, density: "2.1", workability: "Easy", commonUses: ["cabinets", "painted furniture", "carving"], finishability: "Good" },
  { id: "mat_12", name: "Birch", type: "Hardwood", hardness: 1260, costPerBdFt: 6.00, density: "2.8", workability: "Medium", commonUses: ["plywood core", "dowels", "Scandinavian furniture"], finishability: "Good" },

  // Softwoods
  { id: "mat_13", name: "Pine", type: "Softwood", hardness: 380, costPerBdFt: 2.50, density: "1.8", workability: "Easy", commonUses: ["shelving", "framing", "farmhouse furniture", "painted projects"], finishability: "Fair" },
  { id: "mat_14", name: "Cedar", type: "Softwood", hardness: 350, costPerBdFt: 4.50, density: "1.6", workability: "Easy", commonUses: ["outdoor furniture", "chests", "closet lining", "planters"], finishability: "Fair" },
  { id: "mat_15", name: "Douglas Fir", type: "Softwood", hardness: 660, costPerBdFt: 3.50, density: "2.2", workability: "Easy", commonUses: ["structural beams", "workbenches", "shelving"], finishability: "Fair" },
  { id: "mat_16", name: "Spruce", type: "Softwood", hardness: 490, costPerBdFt: 2.00, density: "1.7", workability: "Easy", commonUses: ["framing", "light furniture", "shop projects"], finishability: "Fair" },

  // Sheet Goods
  { id: "mat_17", name: "Baltic Birch Plywood", type: "Sheet Good", costPerSheet: 85.00, workability: "Easy", commonUses: ["cabinets", "drawers", "jigs", "modern furniture"], finishability: "Good" },
  { id: "mat_18", name: "Birch Plywood", type: "Sheet Good", costPerSheet: 55.00, workability: "Easy", commonUses: ["cabinets", "shelving", "furniture panels"], finishability: "Good" },
  { id: "mat_19", name: "Oak Plywood", type: "Sheet Good", costPerSheet: 65.00, workability: "Easy", commonUses: ["cabinets", "bookcases", "furniture panels"], finishability: "Good" },
  { id: "mat_20", name: "MDF", type: "Sheet Good", costPerSheet: 45.00, workability: "Easy", commonUses: ["painted furniture", "speaker cabinets", "shelving"], finishability: "Good" },
  { id: "mat_21", name: "Particle Board", type: "Sheet Good", costPerSheet: 30.00, workability: "Easy", commonUses: ["substrates", "budget shelving", "countertop cores"], finishability: "Fair" },
  { id: "mat_22", name: "Melamine", type: "Sheet Good", costPerSheet: 50.00, workability: "Easy", commonUses: ["closet shelving", "cabinet interiors", "utility furniture"], finishability: "Fair" },
  { id: "mat_23", name: "Walnut Plywood", type: "Sheet Good", costPerSheet: 110.00, workability: "Easy", commonUses: ["cabinet panels", "modern furniture", "wall panels"], finishability: "Excellent" },
];

// ─── JOINERY ────────────────────────────────────────────────────────────────────

export const JOINERY: JoineryInfo[] = [
  { id: "join_1", name: "Mortise and Tenon", strength: "Very High", difficulty: "Hard", bestFor: ["frame joints", "table legs", "chair construction"], toolsRequired: ["chisel", "mallet", "drill press or mortiser"], experienceLevel: "Advanced" },
  { id: "join_2", name: "Dovetail (Through)", strength: "Very High", difficulty: "Hard", bestFor: ["drawer construction", "box joints", "visible corner joints"], toolsRequired: ["dovetail saw", "chisels", "marking gauge"], experienceLevel: "Advanced" },
  { id: "join_3", name: "Pocket Hole", strength: "Medium", difficulty: "Easy", bestFor: ["face frames", "tabletops", "quick assemblies", "beginner projects"], toolsRequired: ["pocket hole jig", "drill", "pocket screws"], experienceLevel: "Beginner" },
  { id: "join_4", name: "Dowels", strength: "Medium", difficulty: "Medium", bestFor: ["edge joining", "frame assembly", "shelf supports"], toolsRequired: ["doweling jig", "drill", "dowel pins"], experienceLevel: "Intermediate" },
  { id: "join_5", name: "Biscuit Joint", strength: "Medium", difficulty: "Easy", bestFor: ["edge joining", "panel glue-ups", "alignment"], toolsRequired: ["biscuit joiner", "biscuits", "clamps"], experienceLevel: "Beginner" },
  { id: "join_6", name: "Box Joint (Finger Joint)", strength: "High", difficulty: "Medium", bestFor: ["box construction", "decorative corners", "small drawers"], toolsRequired: ["table saw", "box joint jig", "dado blade"], experienceLevel: "Intermediate" },
  { id: "join_7", name: "Dado", strength: "High", difficulty: "Medium", bestFor: ["shelving", "bookcase dividers", "cabinet partitions"], toolsRequired: ["table saw or router", "dado blade or straight bit"], experienceLevel: "Intermediate" },
  { id: "join_8", name: "Rabbet", strength: "Medium", difficulty: "Easy", bestFor: ["back panels", "box construction", "frame joints"], toolsRequired: ["table saw or router", "rabbet bit"], experienceLevel: "Beginner" },
  { id: "join_9", name: "Lap Joint", strength: "Medium", difficulty: "Easy", bestFor: ["frame construction", "cross braces", "face frames"], toolsRequired: ["table saw or router", "chisel"], experienceLevel: "Beginner" },
  { id: "join_10", name: "Bridle Joint", strength: "High", difficulty: "Medium", bestFor: ["frame corners", "table leg-to-rail", "workbenches"], toolsRequired: ["table saw", "chisel", "tenon saw"], experienceLevel: "Intermediate" },
  { id: "join_11", name: "Tongue and Groove", strength: "Medium", difficulty: "Medium", bestFor: ["panel assembly", "flooring", "tabletops", "wainscoting"], toolsRequired: ["table saw or router", "tongue & groove bit set"], experienceLevel: "Intermediate" },
  { id: "join_12", name: "Domino (Floating Tenon)", strength: "High", difficulty: "Easy", bestFor: ["frame joints", "panel joining", "general assembly"], toolsRequired: ["Festool Domino", "domino tenons"], experienceLevel: "Intermediate" },
  { id: "join_13", name: "Miter with Spline", strength: "Medium", difficulty: "Medium", bestFor: ["picture frames", "box corners", "decorative joints"], toolsRequired: ["miter saw", "table saw", "spline jig"], experienceLevel: "Intermediate" },
  { id: "join_14", name: "Butt Joint with Screws", strength: "Low", difficulty: "Easy", bestFor: ["utility furniture", "shop projects", "quick assemblies"], toolsRequired: ["drill", "screws", "countersink bit"], experienceLevel: "Beginner" },
  { id: "join_15", name: "Half-Blind Dovetail", strength: "Very High", difficulty: "Expert", bestFor: ["drawer fronts", "hidden corner joints"], toolsRequired: ["dovetail saw", "chisels", "marking gauge", "router optional"], experienceLevel: "Advanced" },
  { id: "join_16", name: "Sliding Dovetail", strength: "High", difficulty: "Hard", bestFor: ["shelf supports", "drawer dividers", "breadboard ends"], toolsRequired: ["router", "dovetail bit", "guide fence"], experienceLevel: "Advanced" },
];

// ─── HARDWARE ───────────────────────────────────────────────────────────────────

export const HARDWARE: HardwareInfo[] = [
  // Fasteners
  { id: "hw_1", name: "#8 x 1-1/4\" Wood Screws (box of 100)", category: "Fasteners", estimatedCost: 8.00, unit: "box" },
  { id: "hw_2", name: "#8 x 2\" Wood Screws (box of 100)", category: "Fasteners", estimatedCost: 10.00, unit: "box" },
  { id: "hw_3", name: "#8 x 2-1/2\" Wood Screws (box of 100)", category: "Fasteners", estimatedCost: 12.00, unit: "box" },
  { id: "hw_4", name: "Pocket Hole Screws 1-1/4\" (box of 100)", category: "Fasteners", estimatedCost: 12.00, unit: "box" },
  { id: "hw_5", name: "Pocket Hole Screws 2-1/2\" (box of 100)", category: "Fasteners", estimatedCost: 14.00, unit: "box" },
  { id: "hw_6", name: "1/4\" Dowel Pins (pack of 50)", category: "Fasteners", estimatedCost: 6.00, unit: "pack" },
  { id: "hw_7", name: "3/8\" Dowel Pins (pack of 50)", category: "Fasteners", estimatedCost: 7.00, unit: "pack" },
  { id: "hw_8", name: "#20 Biscuits (pack of 50)", category: "Fasteners", estimatedCost: 8.00, unit: "pack" },
  { id: "hw_9", name: "Brad Nails 1-1/4\" (pack of 1000)", category: "Fasteners", estimatedCost: 6.00, unit: "pack" },

  // Adhesives
  { id: "hw_10", name: "Wood Glue (Titebond III, 16 oz)", category: "Adhesives", estimatedCost: 10.00, unit: "bottle" },
  { id: "hw_11", name: "Wood Glue (Titebond II, 16 oz)", category: "Adhesives", estimatedCost: 8.00, unit: "bottle" },
  { id: "hw_12", name: "Epoxy (2-part, 8 oz)", category: "Adhesives", estimatedCost: 15.00, unit: "kit" },
  { id: "hw_13", name: "CA Glue (Super Glue, 2 oz)", category: "Adhesives", estimatedCost: 7.00, unit: "bottle" },

  // Finishes
  { id: "hw_14", name: "Polyurethane (oil-based, quart)", category: "Finishes", estimatedCost: 16.00, unit: "quart" },
  { id: "hw_15", name: "Polyurethane (water-based, quart)", category: "Finishes", estimatedCost: 18.00, unit: "quart" },
  { id: "hw_16", name: "Danish Oil (pint)", category: "Finishes", estimatedCost: 12.00, unit: "pint" },
  { id: "hw_17", name: "Tung Oil (pint)", category: "Finishes", estimatedCost: 14.00, unit: "pint" },
  { id: "hw_18", name: "Lacquer (spray can, 12 oz)", category: "Finishes", estimatedCost: 10.00, unit: "can" },
  { id: "hw_19", name: "Paste Wax (1 lb)", category: "Finishes", estimatedCost: 12.00, unit: "tin" },
  { id: "hw_20", name: "Shellac (quart)", category: "Finishes", estimatedCost: 15.00, unit: "quart" },

  // Tabletop Fasteners
  { id: "hw_21", name: "Figure-8 Fasteners (pack of 8)", category: "Tabletop Fasteners", estimatedCost: 8.00, unit: "pack" },
  { id: "hw_22", name: "Z-Clips (pack of 8)", category: "Tabletop Fasteners", estimatedCost: 10.00, unit: "pack" },
  { id: "hw_23", name: "Desktop Fastener Buttons (pack of 8)", category: "Tabletop Fasteners", estimatedCost: 12.00, unit: "pack" },

  // Cabinet Hardware
  { id: "hw_24", name: "European Cup Hinges (pair)", category: "Cabinet Hardware", estimatedCost: 6.00, unit: "pair" },
  { id: "hw_25", name: "Butt Hinges 2\" (pair)", category: "Cabinet Hardware", estimatedCost: 4.00, unit: "pair" },
  { id: "hw_26", name: "Soft-Close Drawer Slides 18\" (pair)", category: "Cabinet Hardware", estimatedCost: 18.00, unit: "pair" },
  { id: "hw_27", name: "Soft-Close Drawer Slides 22\" (pair)", category: "Cabinet Hardware", estimatedCost: 20.00, unit: "pair" },
  { id: "hw_28", name: "Magnetic Catch", category: "Cabinet Hardware", estimatedCost: 3.00, unit: "each" },
  { id: "hw_29", name: "Shelf Pins (pack of 20)", category: "Cabinet Hardware", estimatedCost: 5.00, unit: "pack" },
  { id: "hw_30", name: "Cabinet Knob", category: "Cabinet Hardware", estimatedCost: 4.00, unit: "each" },
  { id: "hw_31", name: "Cabinet Pull (96mm)", category: "Cabinet Hardware", estimatedCost: 6.00, unit: "each" },

  // Structural
  { id: "hw_32", name: "Corner Braces (pack of 4)", category: "Structural", estimatedCost: 6.00, unit: "pack" },
  { id: "hw_33", name: "L-Brackets (pack of 4)", category: "Structural", estimatedCost: 5.00, unit: "pack" },
  { id: "hw_34", name: "T-Nuts 1/4\"-20 (pack of 10)", category: "Structural", estimatedCost: 5.00, unit: "pack" },
  { id: "hw_35", name: "Threaded Inserts 1/4\"-20 (pack of 10)", category: "Structural", estimatedCost: 8.00, unit: "pack" },
  { id: "hw_36", name: "Leveling Feet (pack of 4)", category: "Structural", estimatedCost: 8.00, unit: "pack" },

  // Abrasives
  { id: "hw_37", name: "Sandpaper Assortment (80/120/220 grit)", category: "Abrasives", estimatedCost: 12.00, unit: "pack" },
  { id: "hw_38", name: "Steel Wool #0000 (pad)", category: "Abrasives", estimatedCost: 5.00, unit: "pack" },
];

// ─── LUMBER STANDARDS ───────────────────────────────────────────────────────────

export const LUMBER_STANDARDS: LumberStandard[] = [
  { nominal: "1x2", actualThickness: 0.75, actualWidth: 1.5, unit: "inches" },
  { nominal: "1x3", actualThickness: 0.75, actualWidth: 2.5, unit: "inches" },
  { nominal: "1x4", actualThickness: 0.75, actualWidth: 3.5, unit: "inches" },
  { nominal: "1x6", actualThickness: 0.75, actualWidth: 5.5, unit: "inches" },
  { nominal: "1x8", actualThickness: 0.75, actualWidth: 7.25, unit: "inches" },
  { nominal: "1x10", actualThickness: 0.75, actualWidth: 9.25, unit: "inches" },
  { nominal: "1x12", actualThickness: 0.75, actualWidth: 11.25, unit: "inches" },
  { nominal: "2x2", actualThickness: 1.5, actualWidth: 1.5, unit: "inches" },
  { nominal: "2x4", actualThickness: 1.5, actualWidth: 3.5, unit: "inches" },
  { nominal: "2x6", actualThickness: 1.5, actualWidth: 5.5, unit: "inches" },
  { nominal: "2x8", actualThickness: 1.5, actualWidth: 7.25, unit: "inches" },
  { nominal: "2x10", actualThickness: 1.5, actualWidth: 9.25, unit: "inches" },
  { nominal: "2x12", actualThickness: 1.5, actualWidth: 11.25, unit: "inches" },
  { nominal: "4x4", actualThickness: 3.5, actualWidth: 3.5, unit: "inches" },
  { nominal: "6x6", actualThickness: 5.5, actualWidth: 5.5, unit: "inches" },
];

export const STANDARD_SHEET_SIZES = {
  plywood: { width: 48, height: 96, unit: "inches" as const },
  mdf: { width: 48, height: 96, unit: "inches" as const },
  melamine: { width: 48, height: 97, unit: "inches" as const },
};

export const STANDARD_BOARD_LENGTHS = [72, 96, 120, 144]; // inches (6', 8', 10', 12')
