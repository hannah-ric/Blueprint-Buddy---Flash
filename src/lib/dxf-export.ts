import { DxfWriter, point3d, Colors } from "@tarikjabiri/dxf";
import type { BuildPlan, ModelPart } from "../types";

function parseDimValue(value: string): number {
  if (!value) return 0;
  const trimmed = value.trim();
  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) return Number(fractionMatch[1]) / Number(fractionMatch[2]);
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) return Number(mixedMatch[1]) + Number(mixedMatch[2]) / Number(mixedMatch[3]);
  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

interface BoundingBox {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
}

function getModelBounds(parts: ModelPart[]): BoundingBox {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const p of parts) {
    const hw = (p.width || 1) / 2;
    const hh = (p.height || 1) / 2;
    const hd = (p.depth || 1) / 2;
    minX = Math.min(minX, p.x - hw); maxX = Math.max(maxX, p.x + hw);
    minY = Math.min(minY, p.y - hh); maxY = Math.max(maxY, p.y + hh);
    minZ = Math.min(minZ, p.z - hd); maxZ = Math.max(maxZ, p.z + hd);
  }
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

function drawRect(dxf: DxfWriter, x: number, y: number, w: number, h: number, layerName: string) {
  const opts = { layerName };
  dxf.addLine(point3d(x, y, 0), point3d(x + w, y, 0), opts);
  dxf.addLine(point3d(x + w, y, 0), point3d(x + w, y + h, 0), opts);
  dxf.addLine(point3d(x + w, y + h, 0), point3d(x, y + h, 0), opts);
  dxf.addLine(point3d(x, y + h, 0), point3d(x, y, 0), opts);
}

function drawLabeledRect(dxf: DxfWriter, x: number, y: number, w: number, h: number, label: string, layerName: string) {
  drawRect(dxf, x, y, w, h, layerName);
  const textHeight = Math.min(w, h) * 0.12;
  if (textHeight >= 0.5) {
    dxf.addText(point3d(x + w / 2, y + h / 2, 0), Math.max(textHeight, 1), label, { layerName });
  }
}

/**
 * Generates a multi-view orthographic DXF drawing from a BuildPlan.
 * Three views in third-angle projection: Top, Front, Right Side.
 */
export function generateViewsDXF(plan: BuildPlan): string {
  const parts = plan.modelParts;
  if (!parts || parts.length === 0) return "";

  const dxf = new DxfWriter();

  // Add layers
  dxf.addLayer("TopView", Colors.Green, "Continuous");
  dxf.addLayer("FrontView", Colors.Cyan, "Continuous");
  dxf.addLayer("SideView", Colors.Yellow, "Continuous");
  dxf.addLayer("Dimensions", Colors.Red, "Continuous");
  dxf.addLayer("Labels", Colors.White, "Continuous");

  const bounds = getModelBounds(parts);
  const totalW = bounds.maxX - bounds.minX;
  const totalH = bounds.maxY - bounds.minY;
  const totalD = bounds.maxZ - bounds.minZ;
  const gap = Math.max(totalW, totalH, totalD) * 0.3;

  // ── TOP VIEW (looking down Y-axis): X → right, Z → up ──
  const topOriginX = 0;
  const topOriginY = totalH + gap;

  for (const p of parts) {
    const px = (p.x - p.width / 2) - bounds.minX + topOriginX;
    const py = (p.z - p.depth / 2) - bounds.minZ + topOriginY;
    drawLabeledRect(dxf, px, py, p.width, p.depth, p.name, "TopView");
  }

  // Top view label
  dxf.addText(point3d(topOriginX + totalW / 2, topOriginY + totalD + 3, 0), 2.5, "TOP VIEW", { layerName: "Labels" });

  // ── FRONT VIEW (looking along Z-axis): X → right, Y → up ──
  const frontOriginX = 0;
  const frontOriginY = 0;

  for (const p of parts) {
    const px = (p.x - p.width / 2) - bounds.minX + frontOriginX;
    const py = (p.y - p.height / 2) - bounds.minY + frontOriginY;
    drawLabeledRect(dxf, px, py, p.width, p.height, p.name, "FrontView");
  }

  dxf.addText(point3d(frontOriginX + totalW / 2, frontOriginY - 4, 0), 2.5, "FRONT VIEW", { layerName: "Labels" });

  // ── RIGHT SIDE VIEW (looking along X-axis): Z → right, Y → up ──
  const sideOriginX = totalW + gap;
  const sideOriginY = 0;

  for (const p of parts) {
    const px = (p.z - p.depth / 2) - bounds.minZ + sideOriginX;
    const py = (p.y - p.height / 2) - bounds.minY + sideOriginY;
    drawLabeledRect(dxf, px, py, p.depth, p.height, p.name, "SideView");
  }

  dxf.addText(point3d(sideOriginX + totalD / 2, sideOriginY - 4, 0), 2.5, "RIGHT SIDE VIEW", { layerName: "Labels" });

  // ── DIMENSION ANNOTATIONS ──
  const dimLayer = "Dimensions";
  const dimOffset = 5;

  // Front view width dimension
  dxf.addLine(
    point3d(frontOriginX, frontOriginY - dimOffset, 0),
    point3d(frontOriginX + totalW, frontOriginY - dimOffset, 0),
    { layerName: dimLayer }
  );
  dxf.addText(
    point3d(frontOriginX + totalW / 2, frontOriginY - dimOffset - 3, 0),
    1.8,
    `${totalW.toFixed(1)} ${plan.units}`,
    { layerName: dimLayer }
  );

  // Front view height dimension
  dxf.addLine(
    point3d(frontOriginX - dimOffset, frontOriginY, 0),
    point3d(frontOriginX - dimOffset, frontOriginY + totalH, 0),
    { layerName: dimLayer }
  );
  dxf.addText(
    point3d(frontOriginX - dimOffset - 3, frontOriginY + totalH / 2, 0),
    1.8,
    `${totalH.toFixed(1)} ${plan.units}`,
    { layerName: dimLayer }
  );

  // Top view depth dimension
  dxf.addLine(
    point3d(topOriginX - dimOffset, topOriginY, 0),
    point3d(topOriginX - dimOffset, topOriginY + totalD, 0),
    { layerName: dimLayer }
  );
  dxf.addText(
    point3d(topOriginX - dimOffset - 3, topOriginY + totalD / 2, 0),
    1.8,
    `${totalD.toFixed(1)} ${plan.units}`,
    { layerName: dimLayer }
  );

  // ── TITLE BLOCK ──
  const titleX = 0;
  const titleY = -20;
  dxf.addText(point3d(titleX, titleY, 0), 4, plan.name, { layerName: "Labels" });
  dxf.addText(point3d(titleX, titleY - 5, 0), 2, `Material: ${plan.material} | Joinery: ${plan.joinery}`, { layerName: "Labels" });
  dxf.addText(point3d(titleX, titleY - 9, 0), 2, `Overall: ${plan.dimensions} | Units: ${plan.units}`, { layerName: "Labels" });
  dxf.addText(point3d(titleX, titleY - 13, 0), 1.5, `Generated by Blueprint Buddy | ${new Date(plan.createdAt).toLocaleDateString()}`, { layerName: "Labels" });

  return dxf.stringify();
}

/**
 * Generates a flat-pattern DXF for CNC/laser cutting.
 * Each cut list part drawn as a rectangle arranged in rows.
 */
export function generatePartsDXF(plan: BuildPlan): string {
  const dxf = new DxfWriter();

  dxf.addLayer("Parts", Colors.Green, "Continuous");
  dxf.addLayer("Labels", Colors.White, "Continuous");
  dxf.addLayer("Dimensions", Colors.Red, "Continuous");

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  const partGap = 3;
  const maxRowWidth = 96; // Standard 8' sheet width

  const cutList = plan.cutList || [];
  for (const item of cutList) {
    const w = item.widthNum ?? parseDimValue(item.width);
    const l = item.lengthNum ?? parseDimValue(item.length);
    if (w <= 0 || l <= 0) continue;

    for (let q = 0; q < item.quantity; q++) {
      // Wrap to next row if exceeding max width
      if (cursorX + l > maxRowWidth && cursorX > 0) {
        cursorX = 0;
        cursorY -= rowHeight + partGap;
        rowHeight = 0;
      }

      drawRect(dxf, cursorX, cursorY, l, w, "Parts");

      // Label in center
      const textH = Math.min(l, w) * 0.1;
      if (textH >= 0.5) {
        const label = item.quantity > 1 ? `${item.part} (${q + 1}/${item.quantity})` : item.part;
        dxf.addText(point3d(cursorX + l / 2, cursorY + w / 2, 0), Math.max(textH, 1), label, { layerName: "Labels" });
      }

      // Dimension labels
      dxf.addText(
        point3d(cursorX + l / 2, cursorY - 1.5, 0),
        1,
        `${l.toFixed(2)} x ${w.toFixed(2)}`,
        { layerName: "Dimensions" }
      );

      rowHeight = Math.max(rowHeight, w);
      cursorX += l + partGap;
    }
  }

  // Title
  dxf.addText(point3d(0, cursorY - rowHeight - 8, 0), 3, `${plan.name} - Cut Parts`, { layerName: "Labels" });
  dxf.addText(point3d(0, cursorY - rowHeight - 12, 0), 1.5, `Units: ${plan.units} | Material: ${plan.material}`, { layerName: "Labels" });

  return dxf.stringify();
}

/**
 * Triggers a browser download of DXF content.
 */
export function downloadDXF(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
