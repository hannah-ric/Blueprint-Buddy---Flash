export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

interface CutListEntry {
  part: string;
  quantity: number;
  thickness: string;
  width: string;
  length: string;
  material: string;
  thicknessNum?: number;
  widthNum?: number;
  lengthNum?: number;
}

interface ModelPartEntry {
  name: string;
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
}

interface BOMEntry {
  item: string;
  quantity: number;
  estimatedCost: number;
  unit?: string;
}

function parseDimension(value: string): number {
  if (!value) return 0;
  const trimmed = value.trim();

  // Handle fractions like "3/4"
  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    return Number(fractionMatch[1]) / Number(fractionMatch[2]);
  }

  // Handle mixed numbers like "1 3/4"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    return Number(mixedMatch[1]) + Number(mixedMatch[2]) / Number(mixedMatch[3]);
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

function getPartBoundingBox(part: ModelPartEntry) {
  const hw = (Number(part.width) || 1) / 2;
  const hh = (Number(part.height) || 1) / 2;
  const hd = (Number(part.depth) || 1) / 2;
  const px = Number(part.x) || 0;
  const py = Number(part.y) || 0;
  const pz = Number(part.z) || 0;
  return {
    minX: px - hw, maxX: px + hw,
    minY: py - hh, maxY: py + hh,
    minZ: pz - hd, maxZ: pz + hd,
  };
}

function boxesOverlap(a: ReturnType<typeof getPartBoundingBox>, b: ReturnType<typeof getPartBoundingBox>, tolerance: number): number {
  const overlapX = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) - tolerance);
  const overlapY = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) - tolerance);
  const overlapZ = Math.max(0, Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) - tolerance);

  if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
    return overlapX * overlapY * overlapZ;
  }
  return 0;
}

function dimensionMatchesAnyPermutation(cutDims: number[], modelDims: number[], tolerance: number): boolean {
  const sorted1 = [...cutDims].sort((a, b) => a - b);
  const sorted2 = [...modelDims].sort((a, b) => a - b);

  return sorted1.every((val, i) => {
    const diff = Math.abs(val - sorted2[i]);
    const pctTolerance = Math.max(val, sorted2[i]) * 0.05;
    return diff <= Math.max(tolerance, pctTolerance);
  });
}

export function validatePlan(plan: Record<string, unknown> | undefined | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!plan) {
    errors.push("Plan data is missing from the response.");
    return { errors, warnings };
  }

  const cutList = plan.cutList as CutListEntry[] | undefined;
  const modelParts = plan.modelParts as ModelPartEntry[] | undefined;
  const bom = plan.bom as BOMEntry[] | undefined;
  const instructions = plan.instructions as Array<{ text: string; activeParts?: string[] } | string> | undefined;

  if (!cutList?.length) {
    errors.push("cutList is empty — must contain at least one part.");
    return { errors, warnings };
  }

  // ── 1. CutList ↔ ModelParts Count Consistency ──────────────────────────────

  if (modelParts?.length) {
    let totalCutListQuantity = 0;
    cutList.forEach((item) => {
      totalCutListQuantity += item.quantity;
    });

    if (modelParts.length !== totalCutListQuantity) {
      warnings.push(
        `modelParts length (${modelParts.length}) does not match total cutList quantity (${totalCutListQuantity}). Every cutList item must have a distinct modelPart.`
      );
    }

    // ── 2. CutList ↔ ModelPart Dimension Cross-Validation ──────────────────

    for (const cutItem of cutList) {
      const cutDims = [
        cutItem.thicknessNum ?? parseDimension(cutItem.thickness),
        cutItem.widthNum ?? parseDimension(cutItem.width),
        cutItem.lengthNum ?? parseDimension(cutItem.length),
      ];

      if (cutDims.some(d => d <= 0)) continue; // Skip if dimensions can't be parsed

      // Find matching modelParts by name
      const partNameLower = cutItem.part.toLowerCase();
      const matchingParts = modelParts.filter(mp =>
        mp.name.toLowerCase().includes(partNameLower) ||
        partNameLower.split(/[\s-/]+/).filter(w => w.length > 2).some(word => mp.name.toLowerCase().includes(word))
      );

      for (const mp of matchingParts) {
        const modelDims = [
          Number(mp.width) || 0,
          Number(mp.height) || 0,
          Number(mp.depth) || 0,
        ];

        if (!dimensionMatchesAnyPermutation(cutDims, modelDims, 1)) {
          warnings.push(
            `Dimension mismatch: cutList "${cutItem.part}" (${cutDims.map(d => d.toFixed(2)).join(" × ")}) doesn't match modelPart "${mp.name}" (${modelDims.map(d => d.toFixed(2)).join(" × ")}).`
          );
        }
      }
    }

    // ── 3. Overall Dimensions Consistency ──────────────────────────────────

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    modelParts.forEach((part) => {
      const bb = getPartBoundingBox(part);
      minX = Math.min(minX, bb.minX);
      maxX = Math.max(maxX, bb.maxX);
      minY = Math.min(minY, bb.minY);
      maxY = Math.max(maxY, bb.maxY);
      minZ = Math.min(minZ, bb.minZ);
      maxZ = Math.max(maxZ, bb.maxZ);
    });

    const calculatedWidth = maxX - minX;
    const calculatedHeight = maxY - minY;
    const calculatedDepth = maxZ - minZ;

    const statedDimensions = String(plan.dimensions || "");
    const numbersInDimensions = statedDimensions.match(/\d+(\.\d+)?/g)?.map(Number) || [];

    if (numbersInDimensions.length >= 3) {
      const calculatedDims = [calculatedWidth, calculatedHeight, calculatedDepth].sort((a, b) => a - b);
      const statedDims = [...numbersInDimensions].sort((a, b) => a - b);

      const hasMatch = calculatedDims.every((calc, i) => {
        const tolerance = statedDims[i] > 10 ? statedDims[i] * 0.05 : 1;
        return Math.abs(calc - statedDims[i]) <= tolerance;
      });

      if (!hasMatch) {
        warnings.push(
          `Stated dimensions (${statedDimensions}) may not match calculated bounding box (${calculatedWidth.toFixed(1)}W x ${calculatedHeight.toFixed(1)}H x ${calculatedDepth.toFixed(1)}D).`
        );
      }
    }

    // ── 4. AABB Overlap Detection ──────────────────────────────────────────

    for (let i = 0; i < modelParts.length; i++) {
      for (let j = i + 1; j < modelParts.length; j++) {
        const bbA = getPartBoundingBox(modelParts[i]);
        const bbB = getPartBoundingBox(modelParts[j]);
        const overlapVolume = boxesOverlap(bbA, bbB, 0.1);

        if (overlapVolume > 1) {
          warnings.push(
            `modelParts "${modelParts[i].name}" and "${modelParts[j].name}" overlap by ${overlapVolume.toFixed(1)} cubic units. Parts should not occupy the same volume.`
          );
        }
      }
    }

    // ── 5. Ground Plane Check ──────────────────────────────────────────────

    const lowestY = minY;
    if (Math.abs(lowestY) > 0.1) {
      warnings.push(`Lowest part is at y=${lowestY.toFixed(2)}, but should be exactly y=0 (ground plane).`);
    }

    // ── 6. Structural Feasibility Checks ──────────────────────────────────

    // Check for unsupported horizontal spans > 36"
    for (const part of modelParts) {
      const dims = [Number(part.width) || 0, Number(part.height) || 0, Number(part.depth) || 0];
      const minDim = Math.min(...dims);
      const maxDim = Math.max(...dims);

      // If the part is horizontal (smallest dim is height = Y-axis) and wide
      if (minDim === (Number(part.height) || 0) && maxDim > 36) {
        // Check if there's support underneath
        const partBB = getPartBoundingBox(part);
        const hasSupport = modelParts.some(other => {
          if (other === part) return false;
          const otherBB = getPartBoundingBox(other);
          // Support must be below and within the horizontal footprint
          return otherBB.maxY <= partBB.minY + 0.5 &&
                 otherBB.maxY >= partBB.minY - 2 &&
                 otherBB.minX < partBB.maxX &&
                 otherBB.maxX > partBB.minX &&
                 otherBB.minZ < partBB.maxZ &&
                 otherBB.maxZ > partBB.minZ;
        });

        if (!hasSupport) {
          warnings.push(
            `Part "${part.name}" spans ${maxDim.toFixed(1)} units horizontally without detected support underneath. Consider adding an apron or center support.`
          );
        }
      }
    }

  } else {
    errors.push("modelParts is empty — must contain 3D representations of all cutList parts.");
  }

  // ── 7. BOM Validation ──────────────────────────────────────────────────

  if (!bom?.length) {
    errors.push("BOM is empty — must include wood/materials and hardware.");
  } else {
    const hasZeroCost = bom.some((item) => item.estimatedCost <= 0);
    if (hasZeroCost) {
      warnings.push("Some BOM items have estimatedCost <= 0. All items should have realistic cost estimates.");
    }

    // BOM-to-CutList material reconciliation
    if (cutList.length > 0) {
      let totalBoardFeet = 0;
      for (const item of cutList) {
        const t = item.thicknessNum ?? parseDimension(item.thickness);
        const w = item.widthNum ?? parseDimension(item.width);
        const l = item.lengthNum ?? parseDimension(item.length);
        if (t > 0 && w > 0 && l > 0) {
          totalBoardFeet += (t * w * l * item.quantity) / 144;
        }
      }

      if (totalBoardFeet > 0) {
        // Check if BOM mentions wood/lumber
        const bomText = bom.map(b => b.item.toLowerCase()).join(" ");
        const hasWoodInBom = ["board", "lumber", "wood", "plywood", "mdf", "sheet", "walnut", "oak", "cherry", "maple", "pine", "cedar", "mahogany", "birch", "ash", "poplar", "teak", "hickory", "fir", "spruce"].some(
          w => bomText.includes(w)
        );
        if (!hasWoodInBom) {
          warnings.push("BOM does not appear to include wood/lumber materials. Ensure all materials from the cutList are accounted for in the BOM.");
        }
      }
    }
  }

  // ── 8. Instruction Integrity ──────────────────────────────────────────

  if (instructions?.length && cutList.length) {
    const partWords = cutList.flatMap((item) => item.part.toLowerCase().split(/[\s-/]+/).filter(w => w.length > 3));
    const referencedInInstructions = partWords.some((word) =>
      instructions.some((step) => {
        const text = typeof step === 'string' ? step : step.text;
        return text.toLowerCase().includes(word);
      })
    );
    if (!referencedInInstructions && partWords.length > 0) {
      warnings.push("Assembly instructions don't seem to reference the cutList parts. Instructions should use specific part names.");
    }
  }

  return { errors, warnings };
}
