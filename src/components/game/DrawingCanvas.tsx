
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  lineWidth?: number;
  strokeColor?: string;
}

export interface DrawingCanvasRef {
  getDrawingAsDataURL: (type?: string, quality?: number) => string | undefined;
  clearCanvas: () => void;
}

const DrawingCanvas = React.forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width = 500, height = 400, lineWidth = 5, strokeColor = '#000000' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = strokeColor;
      context.lineWidth = lineWidth;
      contextRef.current = context;

      // Fill canvas with white background initially for proper data URL generation
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

    }, [width, height, lineWidth, strokeColor]);

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { offsetX: number, offsetY: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();

      if (event.nativeEvent instanceof MouseEvent) {
        return { offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY };
      } else if (event.nativeEvent instanceof TouchEvent) {
        if (event.nativeEvent.touches.length > 0) {
          return { 
            offsetX: event.nativeEvent.touches[0].clientX - rect.left,
            offsetY: event.nativeEvent.touches[0].clientY - rect.top
          };
        }
      }
      return null;
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      const coords = getCoordinates(event);
      if (!coords || !contextRef.current) return;
      const { offsetX, offsetY } = coords;
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
      event.preventDefault(); // Prevent scrolling on touch
    };

    const finishDrawing = () => {
      if (!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !contextRef.current) return;
      const coords = getCoordinates(event);
      if (!coords) return;
      const { offsetX, offsetY } = coords;
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      event.preventDefault(); // Prevent scrolling on touch
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Reset stroke style if needed after clearing
        context.strokeStyle = strokeColor;
        context.lineWidth = lineWidth;
      }
    };

    React.useImperativeHandle(ref, () => ({
      getDrawingAsDataURL: (type = 'image/png', quality = 0.95) => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        // Ensure background is white for transparency issues with PNG if not filled initially
        const context = contextRef.current;
        if(context) {
            const existingCompositeOperation = context.globalCompositeOperation;
            const existingFillStyle = context.fillStyle;
            
            context.globalCompositeOperation = "destination-over";
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL(type, quality);
            
            // Restore previous state if needed or just clear part of it.
            // For simplicity, here we might just clear the temporary white background fill
            // but it's better if the canvas is always filled white from the start or handled carefully.
            // For this version, the initial fill in useEffect should suffice.
            // To restore exactly, you'd need to save and restore the canvas image data.
            
            context.globalCompositeOperation = existingCompositeOperation;
            context.fillStyle = existingFillStyle;
            
            return dataUrl;
        }
        return canvas.toDataURL(type, quality);
      },
      clearCanvas,
    }));

    return (
      <div className="flex flex-col items-center space-y-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseOut={finishDrawing} // To stop drawing if mouse leaves canvas
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchMove={draw}
          className="border border-gray-300 rounded-md shadow-md cursor-crosshair bg-white"
          data-ai-hint="drawing area"
        />
        <Button onClick={clearCanvas} variant="outline">
          <Eraser className="mr-2 h-4 w-4" />
          Temizle
        </Button>
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
export { DrawingCanvas };
