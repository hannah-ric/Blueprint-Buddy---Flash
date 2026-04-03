import { describe, it, expect } from 'vitest';
import { validatePlan } from '../src/lib/validate-plan';

describe('validatePlan', () => {
  it('should return error if cutList is empty', () => {
    const plan = {
      cutList: [],
      modelParts: [],
      bom: [],
      instructions: []
    };
    const result = validatePlan(plan);
    expect(result.errors).toContain("cutList is empty — must contain at least one part.");
  });

  it('should return error if modelParts is empty but cutList is not', () => {
    const plan = {
      cutList: [{ part: "Leg", quantity: 4, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [],
      bom: [],
      instructions: []
    };
    const result = validatePlan(plan);
    expect(result.errors).toContain("modelParts is empty — must contain 3D representations of all cutList parts.");
  });

  it('should return warning if cutList and modelParts counts do not match', () => {
    const plan = {
      cutList: [{ part: "Leg", quantity: 4, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [
        { name: "Leg 1", width: 1.5, height: 18, depth: 1.5, x: 0, y: 0, z: 0 }
      ],
      bom: [],
      instructions: []
    };
    const result = validatePlan(plan);
    expect(result.warnings).toContain("modelParts length (1) does not match total cutList quantity (4). Every cutList item must have a distinct modelPart.");
  });

  it('should return warning if dimensions do not match calculated bounding box', () => {
    const plan = {
      dimensions: "10W x 10H x 10D",
      cutList: [{ part: "Leg", quantity: 1, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [
        { name: "Leg", width: 5, height: 5, depth: 5, x: 0, y: 0, z: 0 }
      ],
      bom: [{ item: "Pine lumber", quantity: 10, estimatedCost: 5 }],
      instructions: ["Attach leg"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("may not match calculated bounding box"))).toBe(true);
  });

  it('should return warning if parts overlap (AABB)', () => {
    const plan = {
      cutList: [{ part: "Panel", quantity: 2, thickness: "0.75", width: "10", length: "20", material: "Pine" }],
      modelParts: [
        { name: "Panel 1", width: 20, height: 0.75, depth: 10, x: 0, y: 5, z: 0 },
        { name: "Panel 2", width: 20, height: 0.75, depth: 10, x: 0, y: 5, z: 0 }
      ],
      bom: [{ item: "Pine lumber", quantity: 2, estimatedCost: 15 }],
      instructions: ["Attach panels"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("overlap"))).toBe(true);
  });

  it('should NOT flag overlap for adjacent parts touching', () => {
    const plan = {
      cutList: [{ part: "Shelf", quantity: 2, thickness: "0.75", width: "10", length: "20", material: "Pine" }],
      modelParts: [
        { name: "Shelf 1", width: 20, height: 0.75, depth: 10, x: 0, y: 5, z: 0 },
        { name: "Shelf 2", width: 20, height: 0.75, depth: 10, x: 0, y: 5.75, z: 0 }
      ],
      bom: [{ item: "Pine lumber", quantity: 2, estimatedCost: 15 }],
      instructions: ["Attach shelves"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("overlap"))).toBe(false);
  });

  it('should return error if BOM is empty', () => {
    const plan = {
      cutList: [{ part: "Leg", quantity: 1, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [
        { name: "Leg", width: 1.5, height: 18, depth: 1.5, x: 0, y: 0, z: 0 }
      ],
      bom: [],
      instructions: ["Attach leg"]
    };
    const result = validatePlan(plan);
    expect(result.errors).toContain("BOM is empty — must include wood/materials and hardware.");
  });

  it('should return warning if BOM item has zero cost', () => {
    const plan = {
      cutList: [{ part: "Leg", quantity: 1, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [
        { name: "Leg", width: 1.5, height: 18, depth: 1.5, x: 0, y: 0, z: 0 }
      ],
      bom: [{ item: "Screws", quantity: 10, estimatedCost: 0 }],
      instructions: ["Attach leg"]
    };
    const result = validatePlan(plan);
    expect(result.warnings).toContain("Some BOM items have estimatedCost <= 0. All items should have realistic cost estimates.");
  });

  it('should return warning if instructions do not reference parts', () => {
    const plan = {
      cutList: [{ part: "Table Leg", quantity: 1, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [
        { name: "Table Leg", width: 1.5, height: 18, depth: 1.5, x: 0, y: 0, z: 0 }
      ],
      bom: [{ item: "Screws", quantity: 10, estimatedCost: 5 }],
      instructions: ["Do some stuff"]
    };
    const result = validatePlan(plan);
    expect(result.warnings).toContain("Assembly instructions don't seem to reference the cutList parts. Instructions should use specific part names.");
  });

  it('should pass validation for a valid plan', () => {
    const plan = {
      dimensions: "1.5W x 18H x 1.5D",
      cutList: [{ part: "Table Leg", quantity: 1, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [
        { name: "Table Leg", width: 1.5, height: 18, depth: 1.5, x: 0, y: 9, z: 0 }
      ],
      bom: [{ item: "Pine lumber", quantity: 1, estimatedCost: 5 }],
      instructions: ["Attach Table Leg"]
    };
    const result = validatePlan(plan);
    expect(result.errors.length).toBe(0);
    expect(result.warnings.length).toBe(0);
  });

  // New tests for enhanced validation

  it('should detect dimension mismatch between cutList and modelParts', () => {
    const plan = {
      cutList: [{ part: "Top", quantity: 1, thickness: "0.75", width: "24", length: "48", material: "Oak", thicknessNum: 0.75, widthNum: 24, lengthNum: 48 }],
      modelParts: [
        { name: "Top", width: 48, height: 0.75, depth: 24, x: 0, y: 30, z: 0 }
      ],
      bom: [{ item: "Oak lumber", quantity: 8, estimatedCost: 64 }],
      instructions: ["Place the top"]
    };
    const result = validatePlan(plan);
    // Dimensions match (0.75, 24, 48) so no warning expected
    expect(result.warnings.some(w => w.includes("Dimension mismatch"))).toBe(false);
  });

  it('should flag dimension mismatch when modelPart sizes are wrong', () => {
    const plan = {
      cutList: [{ part: "Shelf", quantity: 1, thickness: "0.75", width: "12", length: "36", material: "Pine", thicknessNum: 0.75, widthNum: 12, lengthNum: 36 }],
      modelParts: [
        { name: "Shelf", width: 36, height: 0.75, depth: 20, x: 0, y: 15, z: 0 } // depth should be 12, not 20
      ],
      bom: [{ item: "Pine lumber", quantity: 3, estimatedCost: 10 }],
      instructions: ["Install shelf"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("Dimension mismatch"))).toBe(true);
  });

  it('should warn if BOM has no wood materials', () => {
    const plan = {
      cutList: [{ part: "Leg", quantity: 4, thickness: "1.5", width: "1.5", length: "28", material: "Oak", thicknessNum: 1.5, widthNum: 1.5, lengthNum: 28 }],
      modelParts: [
        { name: "Front Left Leg", width: 1.5, height: 28, depth: 1.5, x: -10, y: 14, z: -8 },
        { name: "Front Right Leg", width: 1.5, height: 28, depth: 1.5, x: 10, y: 14, z: -8 },
        { name: "Back Left Leg", width: 1.5, height: 28, depth: 1.5, x: -10, y: 14, z: 8 },
        { name: "Back Right Leg", width: 1.5, height: 28, depth: 1.5, x: 10, y: 14, z: 8 },
      ],
      bom: [{ item: "Screws", quantity: 16, estimatedCost: 8 }],
      instructions: ["Attach legs"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("BOM does not appear to include wood"))).toBe(true);
  });

  it('should warn about ground plane issues', () => {
    const plan = {
      cutList: [{ part: "Box", quantity: 1, thickness: "10", width: "10", length: "10", material: "Pine" }],
      modelParts: [
        { name: "Box", width: 10, height: 10, depth: 10, x: 0, y: 10, z: 0 } // bottom at y=5, not y=0
      ],
      bom: [{ item: "Pine lumber", quantity: 1, estimatedCost: 10 }],
      instructions: ["Build box"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("ground plane"))).toBe(true);
  });

  it('should handle fractional dimension parsing', () => {
    const plan = {
      dimensions: "48W x 30H x 24D",
      cutList: [{ part: "Top", quantity: 1, thickness: "3/4", width: "24", length: "48", material: "Oak" }],
      modelParts: [
        { name: "Top", width: 48, height: 0.75, depth: 24, x: 0, y: 29.625, z: 0 }
      ],
      bom: [{ item: "Oak lumber", quantity: 8, estimatedCost: 64 }],
      instructions: ["Place the top"]
    };
    // Parsing 3/4 should yield 0.75
    const result = validatePlan(plan);
    expect(result.errors.length).toBe(0);
  });
});
