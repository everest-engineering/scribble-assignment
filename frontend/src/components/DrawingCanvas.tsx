import { useCallback, useEffect, useRef } from "react";
import type { DrawingPoint, DrawingStroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  canDraw: boolean;
  onStrokeComplete: (stroke: DrawingStroke) => void;
  onClear: () => void;
}

const STROKE_COLOR = "#111827";
const STROKE_WIDTH = 3;

function pointsToPath(points: DrawingPoint[]) {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
}

function getRelativePoint(
  event: React.PointerEvent<SVGSVGElement>,
  svg: SVGSVGElement
): DrawingPoint {
  const rect = svg.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

export function DrawingCanvas({ strokes, canDraw, onStrokeComplete, onClear }: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activePointsRef = useRef<DrawingPoint[]>([]);
  const isDrawingRef = useRef(false);

  const finishStroke = useCallback(() => {
    if (activePointsRef.current.length < 2) {
      activePointsRef.current = [];
      isDrawingRef.current = false;
      return;
    }

    onStrokeComplete({
      id: crypto.randomUUID(),
      color: STROKE_COLOR,
      width: STROKE_WIDTH,
      points: activePointsRef.current
    });

    activePointsRef.current = [];
    isDrawingRef.current = false;
  }, [onStrokeComplete]);

  useEffect(() => {
    if (!canDraw) {
      return;
    }

    function handleWindowPointerUp() {
      if (isDrawingRef.current) {
        finishStroke();
      }
    }

    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [canDraw, finishStroke]);

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!canDraw || !svgRef.current) {
      return;
    }

    event.preventDefault();
    svgRef.current.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    activePointsRef.current = [getRelativePoint(event, svgRef.current)];
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!canDraw || !isDrawingRef.current || !svgRef.current) {
      return;
    }

    activePointsRef.current.push(getRelativePoint(event, svgRef.current));
  }

  function handlePointerUp() {
    if (isDrawingRef.current) {
      finishStroke();
    }
  }

  return (
    <div className="drawing-canvas">
      <svg
        ref={svgRef}
        className="drawing-canvas__surface"
        viewBox="0 0 800 500"
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none", cursor: canDraw ? "crosshair" : "default" }}
      >
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={pointsToPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {canDraw ? (
        <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
