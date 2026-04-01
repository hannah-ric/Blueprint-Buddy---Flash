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
      bom: [{ item: "Screws", quantity: 10, estimatedCost: 5 }],
      instructions: ["Attach leg"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("Stated dimensions (10W x 10H x 10D) may not match calculated bounding box"))).toBe(true);
  });

  it('should return warning if parts overlap', () => {
    const plan = {
      cutList: [{ part: "Leg", quantity: 2, thickness: "1.5", width: "1.5", length: "18", material: "Pine" }],
      modelParts: [
        { name: "Leg 1", width: 1.5, height: 18, depth: 1.5, x: 0, y: 0, z: 0 },
        { name: "Leg 2", width: 1.5, height: 18, depth: 1.5, x: 0, y: 0, z: 0 }
      ],
      bom: [{ item: "Screws", quantity: 10, estimatedCost: 5 }],
      instructions: ["Attach legs"]
    };
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.includes("have identical positions"))).toBe(true);
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
      bom: [{ item: "Screws", quantity: 10, estimatedCost: 5 }],
      instructions: ["Attach Table Leg"]
    };
    const result = validatePlan(plan);
    expect(result.errors.length).toBe(0);
    expect(result.warnings.length).toBe(0);
  });
});
