import { useEffect, useRef, useState } from "react";

interface CanvasBoardProps {
    disabled?: boolean;
}

export function CanvasBoard({ disabled = false }: CanvasBoardProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [drawing, setDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        context.lineWidth = 3;
        context.lineCap = "round";
        context.strokeStyle = "#111827";
    }, []);

    function getPosition(event: React.MouseEvent<HTMLCanvasElement>) {
        const rect = event.currentTarget.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
        if (disabled) {
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!canvas || !context) {
            return;
        }

        const position = getPosition(event);

        context.beginPath();
        context.moveTo(position.x, position.y);

        setDrawing(true);
    }

    function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
        if (!drawing || disabled) {
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!canvas || !context) {
            return;
        }

        const position = getPosition(event);

        context.lineTo(position.x, position.y);
        context.stroke();
    }

    function handleMouseUp() {
        setDrawing(false);
    }

    function handleMouseLeave() {
        setDrawing(false);
    }

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={500}
            style={{
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                width: "100%",
                cursor: disabled ? "not-allowed" : "crosshair"
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    );
}