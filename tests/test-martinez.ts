#!/usr/bin/env tsx

import { Martinez, BooleanOperationType, Polygon, Contour, Segment } from "../src";
import * as fs from "fs";
import * as path from "path";

// Point interface matching the translation
interface Point {
  x: number;
  y: number;
}

function createRectangle(x1: number, y1: number, x2: number, y2: number): Polygon {
  const polygon = new Polygon();
  polygon.addContour([
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ]);
  return polygon;
}

function pointsEqual(p1: Point, p2: Point, tolerance = 1e-10): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

function normalizePolygon(points: Point[]): Point[] {
  if (points.length === 0) return points;

  // Find the lexicographically smallest point (leftmost, then bottommost)
  let minIdx = 0;
  for (let i = 1; i < points.length; i++) {
    const curr = points[i]!;
    const min = points[minIdx]!;
    if (curr.x < min.x || (curr.x === min.x && curr.y < min.y)) {
      minIdx = i;
    }
  }

  // Rotate array to start from the minimum point
  const normalized = [...points.slice(minIdx), ...points.slice(0, minIdx)];

  // Remove duplicate consecutive points
  const result: Point[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const curr = normalized[i]!;
    const next = normalized[(i + 1) % normalized.length]!;
    if (!pointsEqual(curr, next)) {
      result.push(curr);
    }
  }

  return result;
}

function polygonsEqual(poly1: Point[], poly2: Point[]): boolean {
  const norm1 = normalizePolygon(poly1);
  const norm2 = normalizePolygon(poly2);

  if (norm1.length !== norm2.length) return false;

  for (let i = 0; i < norm1.length; i++) {
    if (!pointsEqual(norm1[i]!, norm2[i]!)) {
      return false;
    }
  }

  return true;
}

function calculateBoundingBox(
  inputPolygons: Point[][],
  resultPolygons: Point[][]
): { minX: number; minY: number; maxX: number; maxY: number } {
  const allPoints = [...inputPolygons.flat(), ...resultPolygons.flat()];

  if (allPoints.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  const minX = Math.min(...allPoints.map((p) => p.x));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxY = Math.max(...allPoints.map((p) => p.y));

  return { minX, minY, maxX, maxY };
}

function polygonToSVGPath(points: Point[]): string {
  if (points.length === 0) return "";

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i]!.x} ${points[i]!.y}`;
  }
  path += " Z"; // Close the path
  return path;
}

function generateSVG(inputPolygons: Point[][], resultPolygons: Point[][], operationName: string): string {
  const bbox = calculateBoundingBox(inputPolygons, resultPolygons);

  // Add 10% padding
  const padding = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) * 0.1;
  const viewMinX = bbox.minX - padding;
  const viewMinY = bbox.minY - padding;
  const viewWidth = bbox.maxX - bbox.minX + 2 * padding;
  const viewHeight = bbox.maxY - bbox.minY + 2 * padding;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}"
     width="500" height="500">
  <title>Martinez ${operationName}</title>

  <!-- Input polygons (colored with fill) -->
  <g id="input-polygons">
`;

  // Add input polygons with different colors
  inputPolygons.forEach((polygon, index) => {
    const pathData = polygonToSVGPath(polygon);
    const strokeColor = index === 0 ? "green" : "orange";
    svg += `    <path d="${pathData}" stroke="${strokeColor}" stroke-width="${
      viewWidth * 0.002
    }" fill="${strokeColor}" fill-opacity="0.3"/>
`;
  });

  svg += `  </g>

  <!-- Result polygons (blue stroke and fill) -->
  <g id="result-polygons">
`;

  // Add result polygons
  resultPolygons.forEach((polygon, index) => {
    const pathData = polygonToSVGPath(polygon);
    svg += `    <path d="${pathData}" stroke="blue" stroke-width="${viewWidth * 0.003}" fill="blue" fill-opacity="0.3"/>
`;
  });

  svg += `  </g>
</svg>`;

  return svg;
}

function createCompoundPath(contours: Point[][]): string {
  if (contours.length === 0) return "";
  
  let pathData = "";
  contours.forEach((contour) => {
    if (contour.length > 0) {
      pathData += `M ${contour[0]!.x} ${contour[0]!.y}`;
      for (let i = 1; i < contour.length; i++) {
        pathData += ` L ${contour[i]!.x} ${contour[i]!.y}`;
      }
      pathData += " Z ";
    }
  });
  return pathData.trim();
}

function determineContourOrientation(contour: Point[]): 'clockwise' | 'counterclockwise' {
  // Calculate signed area to determine orientation
  let signedArea = 0;
  for (let i = 0; i < contour.length; i++) {
    const j = (i + 1) % contour.length;
    signedArea += (contour[j]!.x - contour[i]!.x) * (contour[j]!.y + contour[i]!.y);
  }
  return signedArea > 0 ? 'clockwise' : 'counterclockwise';
}

function generateSVGWithMultipleContours(
  poly1Contours: Point[][],
  poly2Contours: Point[][],
  resultContours: Point[][],
  operationName: string
): string {
  // Flatten all contours for bounding box calculation
  const allInputContours = [...poly1Contours, ...poly2Contours];
  const bbox = calculateBoundingBox(allInputContours, resultContours);

  // Add 10% padding
  const padding = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) * 0.1;
  const viewMinX = bbox.minX - padding;
  const viewMinY = bbox.minY - padding;
  const viewWidth = bbox.maxX - bbox.minX + 2 * padding;
  const viewHeight = bbox.maxY - bbox.minY + 2 * padding;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}"
     width="500" height="500">
  <title>Martinez ${operationName}</title>
  
  <defs>
    <!-- Patterns for better hole visualization -->
    <pattern id="holePattern" patternUnits="userSpaceOnUse" width="0.5" height="0.5">
      <rect width="0.5" height="0.5" fill="white" fill-opacity="0.1"/>
      <circle cx="0.25" cy="0.25" r="0.1" fill="white" fill-opacity="0.3"/>
    </pattern>
  </defs>

  <!-- Input polygons with proper hole handling -->
  <g id="input-polygons">
`;

  // Add first polygon with proper compound path (green)
  if (poly1Contours.length > 0) {
    const compoundPath = createCompoundPath(poly1Contours);
    svg += `    <!-- Polygon 1: ${poly1Contours.length} contour(s) -->
    <path d="${compoundPath}" 
          stroke="green" 
          stroke-width="${viewWidth * 0.002}" 
          fill="green" 
          fill-opacity="0.3" 
          fill-rule="evenodd"/>
`;
    
    // Add individual contour outlines for debugging
    poly1Contours.forEach((contour, index) => {
      const pathData = polygonToSVGPath(contour);
      const orientation = determineContourOrientation(contour);
      svg += `    <!-- P1 Contour ${index} (${orientation}) -->
    <path d="${pathData}" 
          stroke="darkgreen" 
          stroke-width="${viewWidth * 0.001}" 
          fill="none" 
          stroke-dasharray="${index === 0 ? 'none' : '0.2,0.2'}"/>
`;
    });
  }

  // Add second polygon with proper compound path (orange)
  if (poly2Contours.length > 0) {
    const compoundPath = createCompoundPath(poly2Contours);
    svg += `    <!-- Polygon 2: ${poly2Contours.length} contour(s) -->
    <path d="${compoundPath}" 
          stroke="orange" 
          stroke-width="${viewWidth * 0.002}" 
          fill="orange" 
          fill-opacity="0.3" 
          fill-rule="evenodd"/>
`;
    
    // Add individual contour outlines for debugging
    poly2Contours.forEach((contour, index) => {
      const pathData = polygonToSVGPath(contour);
      const orientation = determineContourOrientation(contour);
      svg += `    <!-- P2 Contour ${index} (${orientation}) -->
    <path d="${pathData}" 
          stroke="darkorange" 
          stroke-width="${viewWidth * 0.001}" 
          fill="none" 
          stroke-dasharray="${index === 0 ? 'none' : '0.2,0.2'}"/>
`;
    });
  }

  svg += `  </g>

  <!-- Result polygons (blue stroke and fill) -->
  <g id="result-polygons">
`;

  // Add result polygons
  resultContours.forEach((contour, index) => {
    const pathData = polygonToSVGPath(contour);
    svg += `    <!-- Result Contour ${index} -->
    <path d="${pathData}" 
          stroke="blue" 
          stroke-width="${viewWidth * 0.003}" 
          fill="blue" 
          fill-opacity="0.4"/>
`;
  });

  svg += `  </g>

  <!-- Legend -->
  <g id="legend" transform="translate(${viewMinX + viewWidth * 0.02}, ${viewMinY + viewHeight * 0.02})">
    <rect x="0" y="0" width="${viewWidth * 0.25}" height="${viewHeight * 0.15}" 
          fill="white" fill-opacity="0.9" stroke="black" stroke-width="${viewWidth * 0.001}"/>
    <text x="${viewWidth * 0.01}" y="${viewHeight * 0.03}" font-size="${viewWidth * 0.02}" fill="black">Legend:</text>
    <text x="${viewWidth * 0.01}" y="${viewWidth * 0.05}" font-size="${viewWidth * 0.015}" fill="green">Green: Polygon 1 (${poly1Contours.length} contours)</text>
    <text x="${viewWidth * 0.01}" y="${viewWidth * 0.07}" font-size="${viewWidth * 0.015}" fill="orange">Orange: Polygon 2 (${poly2Contours.length} contours)</text>
    <text x="${viewWidth * 0.01}" y="${viewWidth * 0.09}" font-size="${viewWidth * 0.015}" fill="blue">Blue: Result (${resultContours.length} contours)</text>
    <text x="${viewWidth * 0.01}" y="${viewWidth * 0.11}" font-size="${viewWidth * 0.012}" fill="gray">Dashed lines: Holes/Inner contours</text>
  </g>
</svg>`;

  return svg;
}

function ensureSvgDirectory(): void {
  const svgDir = path.join(process.cwd(), "svg-results");
  if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
  }
}

function saveSVG(svgContent: string, operationName: string): string {
  ensureSvgDirectory();

  const filename = `martinez_${operationName}.svg`;
  const filepath = path.join(process.cwd(), "svg-results", filename);

  fs.writeFileSync(filepath, svgContent, "utf8");
  return filepath;
}

function testBooleanOperation(
  poly1: Polygon,
  poly2: Polygon,
  operation: number,
  operationName: string,
  expectedContours: Point[][],
  expectedDescription: string
) {
  console.log(`\n=== ${operationName.toUpperCase()} OPERATION ===`);
  console.log(`Expected: ${expectedDescription}`);

  expectedContours.forEach((contour, index) => {
    console.log(`Expected contour ${index}:`, contour);
  });

  const martinez = new Martinez(poly1, poly2);

  // Get all input contours for SVG (including holes and multiple islands)
  const poly1Contours = poly1.getContours();
  const poly2Contours = poly2.getContours();

  try {
    const result = martinez.computeBooleanOperation(operation);

    const resultContours = result.getContours();
    console.log(`\nActual result - Number of contours: ${resultContours.length}`);

    resultContours.forEach((contour, index) => {
      console.log(`Actual contour ${index}:`, contour);
    });

    // For complex concave polygons, we'll analyze results rather than exact comparison
    console.log(`\n✓ Number of intersections found: ${martinez.getIntersectionCount()}`);

    if (expectedContours.length === 0) {
      // Analyze the results for complex polygons
      console.log("\n=== ANALYSIS ===");
      if (resultContours.length === 0) {
        console.log("⚠️  No contours generated - potential algorithm issue");
      } else {
        console.log(`✓ Generated ${resultContours.length} contour(s)`);

        // Basic validation checks
        resultContours.forEach((contour, index) => {
          console.log(`Contour ${index} has ${contour.length} vertices`);

          // Check if contour is closed (first and last points should be different in our representation)
          if (contour.length < 3) {
            console.log(`⚠️  Contour ${index} has too few vertices (${contour.length})`);
          }

          // Check for degenerate segments (consecutive identical points)
          let degenerateCount = 0;
          for (let i = 0; i < contour.length; i++) {
            const curr = contour[i]!;
            const next = contour[(i + 1) % contour.length]!;
            if (pointsEqual(curr, next)) {
              degenerateCount++;
            }
          }
          if (degenerateCount > 0) {
            console.log(`⚠️  Contour ${index} has ${degenerateCount} degenerate segment(s)`);
          }
        });

        // Calculate and display bounding box
        if (resultContours.length > 0) {
          const allPoints = resultContours.flat();
          const minX = Math.min(...allPoints.map((p) => p.x));
          const maxX = Math.max(...allPoints.map((p) => p.x));
          const minY = Math.min(...allPoints.map((p) => p.y));
          const maxY = Math.max(...allPoints.map((p) => p.y));
          console.log(`Bounding box: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
        }
      }
      console.log("✓ Complex polygon analysis complete");
    } else {
      // Original comparison logic for simple cases
      let isCorrect = false;
      if (resultContours.length === expectedContours.length) {
        if (expectedContours.length === 1) {
          isCorrect = polygonsEqual(resultContours[0]!, expectedContours[0]!);
        } else {
          isCorrect = expectedContours.every((expectedContour) =>
            resultContours.some((resultContour) => polygonsEqual(resultContour, expectedContour))
          );
        }
      }
      console.log(`\n✓ Result matches expected: ${isCorrect ? "YES" : "NO"}`);
    }

    // Generate and save SVG
    try {
      const svgContent = generateSVGWithMultipleContours(poly1Contours, poly2Contours, resultContours, operationName);
      const svgPath = saveSVG(svgContent, operationName);
      console.log(`📄 SVG saved: ${path.relative(process.cwd(), svgPath)}`);
    } catch (svgError) {
      console.error(`Error generating SVG:`, svgError);
    }
  } catch (error) {
    console.error(`Error during ${operationName} computation:`, error);

    // Still try to generate SVG for input polygons even if operation failed
    try {
      const svgContent = generateSVGWithMultipleContours(poly1Contours, poly2Contours, [], operationName + "_error");
      const svgPath = saveSVG(svgContent, operationName + "_error");
      console.log(`📄 SVG (error case) saved: ${path.relative(process.cwd(), svgPath)}`);
    } catch (svgError) {
      console.error(`Error generating error SVG:`, svgError);
    }
  }
}

function createConcavePolygon1(): Polygon {
  // L-shaped concave polygon
  const polygon = new Polygon();
  polygon.addContour([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 6 },
    { x: 4, y: 6 },
    { x: 4, y: 10 },
    { x: 0, y: 10 },
  ]);
  return polygon;
}

function createConcavePolygon2(): Polygon {
  // Star-like concave polygon
  const polygon = new Polygon();
  polygon.addContour([
    { x: 6, y: 2 },
    { x: 8, y: 4 },
    { x: 12, y: 4 },
    { x: 9, y: 7 },
    { x: 10, y: 11 },
    { x: 6, y: 9 },
    { x: 2, y: 11 },
    { x: 3, y: 7 },
    { x: 0, y: 4 },
    { x: 4, y: 4 },
  ]);
  return polygon;
}

function createTriangle(): Polygon {
  // Equilateral triangle
  const polygon = new Polygon();
  polygon.addContour([
    { x: 5, y: 0 },
    { x: 10, y: 8.66 },
    { x: 0, y: 8.66 },
  ]);
  return polygon;
}

function createComplexConcave(): Polygon {
  // More complex concave polygon with multiple indentations
  const polygon = new Polygon();
  polygon.addContour([
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 12, y: 4 },
    { x: 8, y: 4 },
    { x: 8, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 8 },
    { x: 8, y: 8 },
    { x: 8, y: 6 },
    { x: 12, y: 6 },
    { x: 12, y: 10 },
    { x: 0, y: 10 },
  ]);
  return polygon;
}

function createCircularApproximation(): Polygon {
  // Octagon approximating a circle
  const polygon = new Polygon();
  const centerX = 6;
  const centerY = 6;
  const radius = 4;
  const sides = 64;

  const points: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }

  polygon.addContour(points);
  return polygon;
}

function createCross(): Polygon {
  // Plus/cross shape
  const polygon = new Polygon();
  polygon.addContour([
    { x: 4, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 12, y: 4 },
    { x: 12, y: 8 },
    { x: 8, y: 8 },
    { x: 8, y: 12 },
    { x: 4, y: 12 },
    { x: 4, y: 8 },
    { x: 0, y: 8 },
    { x: 0, y: 4 },
    { x: 4, y: 4 },
  ]);
  return polygon;
}

function createPolygonWithHole(): Polygon {
  // Outer rectangle with a hole in the middle
  const polygon = new Polygon();
  
  // Outer contour (clockwise)
  polygon.addContour([
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 12, y: 10 },
    { x: 0, y: 10 },
  ]);
  
  // Inner hole (counter-clockwise to create hole)
  polygon.addContour([
    { x: 3, y: 3 },
    { x: 3, y: 7 },
    { x: 9, y: 7 },
    { x: 9, y: 3 },
  ]);
  
  return polygon;
}

function createComplexPolygonWithHoles(): Polygon {
  // Complex polygon with multiple holes
  const polygon = new Polygon();
  
  // Outer L-shape contour
  polygon.addContour([
    { x: 0, y: 0 },
    { x: 15, y: 0 },
    { x: 15, y: 8 },
    { x: 8, y: 8 },
    { x: 8, y: 15 },
    { x: 0, y: 15 },
  ]);
  
  // First hole (small rectangle)
  polygon.addContour([
    { x: 2, y: 2 },
    { x: 2, y: 5 },
    { x: 5, y: 5 },
    { x: 5, y: 2 },
  ]);
  
  // Second hole (triangle)
  polygon.addContour([
    { x: 10, y: 2 },
    { x: 10, y: 6 },
    { x: 13, y: 4 },
  ]);
  
  // Third hole in the vertical part
  polygon.addContour([
    { x: 2, y: 10 },
    { x: 2, y: 13 },
    { x: 6, y: 13 },
    { x: 6, y: 10 },
  ]);
  
  return polygon;
}

function createMultiContourPolygon(): Polygon {
  // Multiple separate contours (islands)
  const polygon = new Polygon();
  
  // First island - rectangle
  polygon.addContour([
    { x: 1, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 4 },
    { x: 1, y: 4 },
  ]);
  
  // Second island - triangle
  polygon.addContour([
    { x: 6, y: 1 },
    { x: 9, y: 1 },
    { x: 7.5, y: 4 },
  ]);
  
  // Third island - pentagon
  polygon.addContour([
    { x: 11, y: 2 },
    { x: 13, y: 1 },
    { x: 15, y: 3 },
    { x: 14, y: 5 },
    { x: 12, y: 5 },
  ]);
  
  return polygon;
}

function createDonutShape(): Polygon {
  // Circle with circular hole (donut)
  const polygon = new Polygon();
  
  // Outer circle (octagon approximation)
  const outerRadius = 6;
  const innerRadius = 3;
  const centerX = 8;
  const centerY = 8;
  const sides = 16;
  
  // Outer contour
  const outerPoints: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    outerPoints.push({
      x: centerX + outerRadius * Math.cos(angle),
      y: centerY + outerRadius * Math.sin(angle)
    });
  }
  polygon.addContour(outerPoints);
  
  // Inner hole (counter-clockwise)
  const innerPoints: Point[] = [];
  for (let i = sides - 1; i >= 0; i--) {
    const angle = (i * 2 * Math.PI) / sides;
    innerPoints.push({
      x: centerX + innerRadius * Math.cos(angle),
      y: centerY + innerRadius * Math.sin(angle)
    });
  }
  polygon.addContour(innerPoints);
  
  return polygon;
}

function runTestSuite(name: string, poly1: Polygon, poly2: Polygon, prefix: string, description: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${name.toUpperCase()}`);
  console.log(`${description}`);
  console.log(`${"=".repeat(60)}`);

  const expectedEmpty: Point[][] = []; // Will analyze actual results

  // Test all operations with unique filenames
  testBooleanOperation(
    poly1,
    poly2,
    BooleanOperationType.INTERSECTION,
    `${prefix}_intersection`,
    expectedEmpty,
    `Intersection of ${name}`
  );

  testBooleanOperation(poly1, poly2, BooleanOperationType.UNION, `${prefix}_union`, expectedEmpty, `Union of ${name}`);

  testBooleanOperation(
    poly1,
    poly2,
    BooleanOperationType.DIFFERENCE,
    `${prefix}_difference`,
    expectedEmpty,
    `Difference of ${name}`
  );

  testBooleanOperation(poly1, poly2, BooleanOperationType.XOR, `${prefix}_xor`, expectedEmpty, `XOR of ${name}`);
}

function main() {
  console.log("🧪 Martinez Boolean Operations - Comprehensive Smoke Tests");
  console.log("=========================================================");

  // Test Suite 1: Original complex concave polygons
  const lShape = createConcavePolygon1();
  const starShape = createConcavePolygon2();
  runTestSuite(
    "Complex Concave Test",
    lShape,
    starShape,
    "concave",
    "L-shaped polygon vs Star-like polygon with multiple intersections"
  );

  // Test Suite 2: Simple vs Complex
  const triangle = createTriangle();
  const complexConcave = createComplexConcave();
  runTestSuite(
    "Simple vs Complex Test",
    triangle,
    complexConcave,
    "triangle_complex",
    "Equilateral triangle vs complex multi-indented polygon"
  );

  // Test Suite 3: Circular vs Angular
  const circle = createCircularApproximation();
  const cross = createCross();
  runTestSuite(
    "Circular vs Angular Test",
    circle,
    cross,
    "circle_cross",
    "Octagon (circular approximation) vs cross/plus shape"
  );

  // Test Suite 4: Overlapping rectangles (edge case)
  const rect1 = createRectangle(0, 0, 8, 6);
  const rect2 = createRectangle(4, 2, 12, 8);
  runTestSuite("Overlapping Rectangles Test", rect1, rect2, "rectangles", "Two overlapping axis-aligned rectangles");

  // Test Suite 5: Triangle vs Star (mixed complexity)
  const triangle2 = createTriangle();
  const star2 = createConcavePolygon2();
  runTestSuite("Triangle vs Star Test", triangle2, star2, "triangle_star", "Simple triangle vs complex star shape");

  // Test Suite 6: Cross vs Complex Concave
  const cross2 = createCross();
  const complex2 = createComplexConcave();
  runTestSuite(
    "Cross vs Complex Test",
    cross2,
    complex2,
    "cross_complex",
    "Cross/plus shape vs multi-indented concave polygon"
  );

  console.log(`\n${"=".repeat(80)}`);
  console.log("🕳️  ADVANCED TESTS: HOLES AND MULTIPLE CONTOURS");
  console.log(`${"=".repeat(80)}`);

  // Test Suite 7: Polygon with hole vs simple shape
  const polygonWithHole = createPolygonWithHole();
  const simpleTriangle = createTriangle();
  runTestSuite(
    "Hole vs Simple Test",
    polygonWithHole,
    simpleTriangle,
    "hole_simple",
    "Rectangle with rectangular hole vs equilateral triangle"
  );

  // Test Suite 8: Complex polygon with multiple holes vs cross
  const complexWithHoles = createComplexPolygonWithHoles();
  const crossShape = createCross();
  runTestSuite(
    "Multiple Holes vs Cross Test",
    complexWithHoles,
    crossShape,
    "multiholes_cross",
    "L-shape with 3 holes (rectangle, triangle, rectangle) vs cross shape"
  );

  // Test Suite 9: Multiple separate contours vs single shape
  const multiContour = createMultiContourPolygon();
  const singleRect = createRectangle(5, 2, 11, 6);
  runTestSuite(
    "Multi-Contour vs Single Test",
    multiContour,
    singleRect,
    "multicontour_single",
    "3 separate islands (rectangle, triangle, pentagon) vs single rectangle"
  );

  // Test Suite 10: Donut shape vs complex polygon
  const donutShape = createDonutShape();
  const complexConcave3 = createComplexConcave();
  runTestSuite(
    "Donut vs Complex Test",
    donutShape,
    complexConcave3,
    "donut_complex",
    "Circular donut (circle with hole) vs multi-indented polygon"
  );

  // Test Suite 11: Two polygons with holes
  const hole1 = createPolygonWithHole();
  const hole2 = createDonutShape();
  runTestSuite(
    "Hole vs Hole Test",
    hole1,
    hole2,
    "hole_hole",
    "Rectangle with hole vs circular donut shape"
  );

  // Test Suite 12: Multi-contour vs multi-hole
  const multiContour2 = createMultiContourPolygon();
  const multiHole = createComplexPolygonWithHoles();
  runTestSuite(
    "Multi-Contour vs Multi-Hole Test",
    multiContour2,
    multiHole,
    "multicontour_multihole",
    "Multiple separate islands vs L-shape with multiple holes"
  );

  console.log(`\n🎨 All SVG files saved to: svg-results/`);
  console.log(`📁 Check the generated SVG files to visualize the boolean operation results.`);
  console.log(`\n✅ Comprehensive testing complete! Generated ${12 * 4} test cases across 12 test suites.`);
  console.log(`\n🔍 Advanced features tested:`);
  console.log(`   • Polygons with holes (inner contours)`);
  console.log(`   • Multiple separate contours (islands)`);
  console.log(`   • Complex combinations of holes and islands`);
  console.log(`   • Circular approximations with holes (donuts)`);
  console.log(`   • Boolean operations preserving hole topology`);
}

// Run the test
main();
