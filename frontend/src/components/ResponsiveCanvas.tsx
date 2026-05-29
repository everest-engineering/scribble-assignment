import { forwardRef, useImperativeHandle, useRef } from "react";
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "react-sketch-canvas";

interface ResponsiveCanvasProps {
  strokeColor: string;
  strokeWidth: number;
  onStroke?: () => void;
  readOnly?: boolean;
}

export const ResponsiveCanvas = forwardRef<ReactSketchCanvasRef, ResponsiveCanvasProps>(
  ({ strokeColor, strokeWidth, onStroke, readOnly = false }, ref) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);

    useImperativeHandle(ref, () => canvasRef.current!);

    return (
      <div style={{ aspectRatio: '4/3', width: '100%', position: 'relative' }}>
        <ReactSketchCanvas
          ref={canvasRef}
          width="100%"
          height="100%"
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          canvasColor="#ffffff"
          onStroke={() => {
            if (onStroke && !readOnly) {
              onStroke();
            }
          }}
          style={{ border: '1px solid #e5e7eb' }}
        />
        {readOnly && (
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              zIndex: 10,
              cursor: 'not-allowed'
            }} 
          />
        )}
      </div>
    );
  }
);
