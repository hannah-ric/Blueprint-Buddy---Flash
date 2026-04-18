import { describe, it, expect } from 'vitest';
import { generateViewsDXF, generatePartsDXF } from '../src/lib/dxf-export';
import type { BuildPlan } from '../src/types';

function makePlan(overrides?: Partial<BuildPlan>): BuildPlan {
  return {
    name: "Test Table",
    description: "A simple test table",
    dimensions: "48x30x24 in",
    material: "Oak",
    joinery: "Pocket Hole",
    units: "inches",
    cutList: [
      { part: "Top", quantity: 1, thickness: "0.75", width: "24", length: "48", material: "Oak", thicknessNum: 0.75, widthNum: 24, lengthNum: 48 },
      { part: "Leg", quantity: 4, thickness: "1.5", width: "1.5", length: "29", material: "Oak", thicknessNum: 1.5, widthNum: 1.5, lengthNum: 29 },
    ],
    bom: [
      { item: "Oak lumber", quantity: 12, unit: "board feet", estimatedCost: 96 },
      { item: "Pocket screws", quantity: 24, unit: "each", estimatedCost: 12 },
    ],
    instructions: [
      { text: "Cut all pieces to size" },
      { text: "Attach legs to top" },
    ],
    modelParts: [
      { name: "Top", width: 48, height: 0.75, depth: 24, x: 0, y: 29.625, z: 0 },
      { name: "Front Left Leg", width: 1.5, height: 29, depth: 1.5, x: -22.5, y: 14.5, z: -10.5 },
      { name: "Front Right Leg", width: 1.5, height: 29, depth: 1.5, x: 22.5, y: 14.5, z: -10.5 },
      { name: "Back Left Leg", width: 1.5, height: 29, depth: 1.5, x: -22.5, y: 14.5, z: 10.5 },
      { name: "Back Right Leg", width: 1.5, height: 29, depth: 1.5, x: 22.5, y: 14.5, z: 10.5 },
    ],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('generateViewsDXF', () => {
  it('should generate a non-empty DXF string', () => {
    const dxf = generateViewsDXF(makePlan());
    expect(dxf).toBeTruthy();
    expect(dxf.length).toBeGreaterThan(100);
  });

  it('should contain DXF section markers', () => {
    const dxf = generateViewsDXF(makePlan());
    expect(dxf).toContain("SECTION");
    expect(dxf).toContain("ENTITIES");
    expect(dxf).toContain("EOF");
  });

  it('should include layer definitions', () => {
    const dxf = generateViewsDXF(makePlan());
    expect(dxf).toContain("TopView");
    expect(dxf).toContain("FrontView");
    expect(dxf).toContain("SideView");
  });

  it('should include plan name in title block', () => {
    const dxf = generateViewsDXF(makePlan({ name: "My Custom Table" }));
    expect(dxf).toContain("My Custom Table");
  });

  it('should include view labels', () => {
    const dxf = generateViewsDXF(makePlan());
    expect(dxf).toContain("TOP VIEW");
    expect(dxf).toContain("FRONT VIEW");
    expect(dxf).toContain("RIGHT SIDE VIEW");
  });

  it('should return empty string if no model parts', () => {
    const dxf = generateViewsDXF(makePlan({ modelParts: [] }));
    expect(dxf).toBe("");
  });

  it('should handle single part', () => {
    const plan = makePlan({
      modelParts: [
        { name: "Block", width: 10, height: 10, depth: 10, x: 0, y: 5, z: 0 },
      ],
    });
    const dxf = generateViewsDXF(plan);
    expect(dxf).toBeTruthy();
    expect(dxf).toContain("Block");
  });
});

describe('generatePartsDXF', () => {
  it('should generate a non-empty DXF string', () => {
    const dxf = generatePartsDXF(makePlan());
    expect(dxf).toBeTruthy();
    expect(dxf.length).toBeGreaterThan(100);
  });

  it('should contain DXF section markers', () => {
    const dxf = generatePartsDXF(makePlan());
    expect(dxf).toContain("SECTION");
    expect(dxf).toContain("ENTITIES");
    expect(dxf).toContain("EOF");
  });

  it('should include Parts layer', () => {
    const dxf = generatePartsDXF(makePlan());
    expect(dxf).toContain("Parts");
  });

  it('should include plan name in title', () => {
    const dxf = generatePartsDXF(makePlan({ name: "Oak Bookshelf" }));
    expect(dxf).toContain("Oak Bookshelf");
  });

  it('should handle empty cut list gracefully', () => {
    const dxf = generatePartsDXF(makePlan({ cutList: [] }));
    expect(dxf).toBeTruthy(); // Still generates header/title
  });
});
