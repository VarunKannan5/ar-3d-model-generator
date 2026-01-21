import React, { useRef, Suspense } from 'react';
import { GeneratedModelData, ShapeData } from '../types';
import { Box, Sphere, Cylinder, Cone, Torus, Capsule, useTexture, Gltf, Resize } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, Group, RepeatWrapping, Texture } from 'three';
import { useFrame } from '@react-three/fiber';

interface Props {
  data: GeneratedModelData;
}

// Map logical texture names to reliable public URLs
const TEXTURE_MAP: Record<string, string> = {
  wood: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg',
  brick: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_diffuse.jpg',
  stone: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
  metal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/carbon/Carbon.png',
  tech: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/uv_grid_opengl.jpg',
  checkers: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/checker.png'
};

const TexturedMaterial = ({ url, color, metalness, roughness }: { url: string; color: string; metalness: number; roughness: number }) => {
  const texture = useTexture(url);
  
  // Configure texture repeating for better wrapping on primitives
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 1);

  return (
    <meshStandardMaterial 
      map={texture} 
      color={color} 
      metalness={metalness} 
      roughness={roughness} 
    />
  );
};

const ShapeMaterial = ({ shape }: { shape: ShapeData }) => {
  const { color, metalness = 0.3, roughness = 0.5, texture } = shape;

  // If a valid texture key is provided, try to render the textured material
  if (texture && TEXTURE_MAP[texture]) {
    return (
      <TexturedMaterial 
        url={TEXTURE_MAP[texture]} 
        color={color} 
        metalness={metalness} 
        roughness={roughness} 
      />
    );
  }

  // Fallback or default standard material
  return (
    <meshStandardMaterial 
      color={color} 
      metalness={metalness} 
      roughness={roughness} 
    />
  );
};

const ShapeRenderer: React.FC<{ shape: ShapeData }> = ({ shape }) => {
  const meshRef = useRef<Mesh>(null);
  
  const { type, position, rotation, scale } = shape;

  // Convert array to Vector3/Euler tuple format required by R3F
  const pos: [number, number, number] = [position[0], position[1], position[2]];
  const rot: [number, number, number] = [rotation[0], rotation[1], rotation[2]];
  const scl: [number, number, number] = [scale[0], scale[1], scale[2]];

  const geometryProps = {
    position: pos,
    rotation: rot,
    scale: scl,
    ref: meshRef,
  };

  const content = <ShapeMaterial shape={shape} />;

  switch (type) {
    case 'box':
      return <Box args={[1, 1, 1]} {...geometryProps}>{content}</Box>;
    case 'sphere':
      return <Sphere args={[1, 32, 32]} {...geometryProps}>{content}</Sphere>;
    case 'cylinder':
      return <Cylinder args={[1, 1, 1, 32]} {...geometryProps}>{content}</Cylinder>;
    case 'cone':
      return <Cone args={[1, 2, 32]} {...geometryProps}>{content}</Cone>;
    case 'torus':
      return <Torus args={[1, 0.4, 16, 32]} {...geometryProps}>{content}</Torus>;
    case 'capsule':
      return <Capsule args={[0.5, 1, 4, 16]} {...geometryProps}>{content}</Capsule>;
    default:
      return null;
  }
};

export const GeneratedObject: React.FC<Props> = ({ data }) => {
  const groupRef = useRef<Group>(null);

  // Slight gentle floating animation for the whole object
  useFrame((state) => {
    if (groupRef.current) {
        groupRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        {data.modelUrl ? (
          // If a model URL is present, render the GLB wrapped in Resize to ensure it fits the view
          <Resize scale={2.5}>
            <Gltf src={data.modelUrl} castShadow receiveShadow />
          </Resize>
        ) : (
          // Otherwise render the generated shapes
          data.shapes.map((shape, index) => (
            <ShapeRenderer key={index} shape={shape} />
          ))
        )}
      </Suspense>
    </group>
  );
};