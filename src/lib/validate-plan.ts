export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validatePlan(plan: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cutList = plan.cutList as Array<{ part: string; quantity: number; thickness: string; width: string; length: string; material: string }> | undefined;
  const modelParts = plan.modelParts as Array<{ name: string; width: number; height: number; depth: number; x: number; y: number; z: number }> | undefined;
  const bom = plan.bom as Array<{ item: string; quantity: number; estimatedCost: number }> | undefined;
  const instructions = plan.instructions as Array<{ text: string; activeParts?: string[] } | string> | undefined;

  if (!cutList?.length) {
    errors.push("cutList is empty — must contain at least one part.");
    return { errors, warnings };
  }

  // 1. Check cutList ↔ modelParts consistency
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

    // 2. Check overall dimensions consistency
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    modelParts.forEach((part) => {
      minX = Math.min(minX, part.x - part.width / 2);
      maxX = Math.max(maxX, part.x + part.width / 2);
      minY = Math.min(minY, part.y - part.height / 2);
      maxY = Math.max(maxY, part.y + part.height / 2);
      minZ = Math.min(minZ, part.z - part.depth / 2);
      maxZ = Math.max(maxZ, part.z + part.depth / 2);
    });

    const calculatedWidth = maxX - minX;
    const calculatedHeight = maxY - minY;
    const calculatedDepth = maxZ - minZ;

    // Very basic check if the stated dimensions string contains numbers close to the calculated ones
    const statedDimensions = String(plan.dimensions || "");
    const numbersInDimensions = statedDimensions.match(/\d+(\.\d+)?/g)?.map(Number) || [];

    if (numbersInDimensions.length >= 3) {
      const hasWidth = numbersInDimensions.some((n) => Math.abs(n - calculatedWidth) < 2);
      const hasHeight = numbersInDimensions.some((n) => Math.abs(n - calculatedHeight) < 2);
      const hasDepth = numbersInDimensions.some((n) => Math.abs(n - calculatedDepth) < 2);

      if (!hasWidth || !hasHeight || !hasDepth) {
        warnings.push(
          `Stated dimensions (${statedDimensions}) may not match calculated bounding box (${calculatedWidth.toFixed(1)}W x ${calculatedHeight.toFixed(1)}H x ${calculatedDepth.toFixed(1)}D).`
        );
      }
    }

    // 3. Check 3D positioning rules
    const lowestY = minY;
    if (Math.abs(lowestY) > 0.1) {
      warnings.push(`Lowest part is at y=${lowestY.toFixed(2)}, but should be exactly y=0 (ground plane).`);
    }

    // Check for identical positions (likely a mistake)
    for (let i = 0; i < modelParts.length; i++) {
      for (let j = i + 1; j < modelParts.length; j++) {
        const a = modelParts[i];
        const b = modelParts[j];
        if (Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.z - b.z) < 0.01) {
          warnings.push(
            `modelParts "${a.name}" and "${b.name}" have identical positions (${a.x}, ${a.y}, ${a.z}). They likely need distinct positions.`
          );
        }
      }
    }
  } else {
    errors.push("modelParts is empty — must contain 3D representations of all cutList parts.");
  }

  // 4. Check BOM has items
  if (!bom?.length) {
    errors.push("BOM is empty — must include wood/materials and hardware.");
  } else {
    const hasZeroCost = bom.some((item) => item.estimatedCost <= 0);
    if (hasZeroCost) {
      warnings.push("Some BOM items have estimatedCost <= 0. All items should have realistic cost estimates.");
    }
  }

  // 5. Check instructions reference cutList part names
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
