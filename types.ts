// Supported primitive types for our composition engine
export type ShapeType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'capsule';

export interface ShapeData {
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness?: number; // Optional material property
  roughness?: number; // Optional material property
  texture?: string; // Optional texture key (wood, brick, etc.) or URL
}

export interface GeneratedModelData {
  shapes: ShapeData[];
  modelUrl?: string; // URL to a pre-made GLB model if available
}