import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedModelData } from "../types";

// NOTE: The API key must be provided in the environment variable API_KEY.
// In a real deployment, this would be proxied or handled securely.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// Upgrade to Pro for better spatial reasoning and adherence to complex instructions
const modelName = 'gemini-3-pro-preview'; 

// Library of free, high-quality public assets
const ASSET_LIBRARY: Record<string, string> = {
  duck: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
  robot: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  avocado: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
  boombox: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
  lantern: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
  buggy: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb',
  helmet: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
};

export const generate3DStructure = async (prompt: string): Promise<GeneratedModelData> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set REACT_APP_API_KEY or check your environment.");
  }

  const assetKeys = Object.keys(ASSET_LIBRARY).join(', ');

  const systemInstruction = `
    You are an expert 3D generative artist and geometry engine.
    
    DECISION PROCESS:
    1. First, check if the user's prompt requests one of these specific high-quality assets: [${assetKeys}].
       - If YES (e.g. user asks for "a rubber duck" or "a robot"), return the 'modelKey' for that asset and leave 'shapes' empty.
       - If NO (the request is for something else, or a custom object), use the Geometry Engine to build it.
    
    GEOMETRY ENGINE INSTRUCTIONS (Only if no asset match):
    Your goal is to create a high-fidelity 3D representation of the user's prompt using a composition of geometric primitives.
    
    CRITICAL: Do not just stack simple blocks. Create complex, organic, or mechanical forms by creatively scaling, rotating, and intersecting primitives.
    
    Available Shapes: 'box', 'sphere', 'cylinder', 'cone', 'torus', 'capsule'.
    Available Textures: 'wood', 'brick', 'stone', 'metal', 'tech', 'checkers'.
    
    Strategies for "Perfect" Output:
    1. DECONSTRUCTION: Break the object down into its smallest visual components.
    2. SHAPING: Use non-uniform scaling (e.g., [0.5, 2, 0.5]) to transform basic shapes into custom parts.
    3. OVERLAPPING: Intersect shapes to hide seams and create complex silhouettes.
    4. MATERIALS: Always apply appropriate textures and colors.
    5. DETAIL: Aim for 15-50 shapes for a detailed model.
    
    Return a JSON object strictly matching the schema.
  `;

  // Define the JSON schema for the output
  const schema = {
    type: Type.OBJECT,
    properties: {
      modelKey: {
        type: Type.STRING,
        description: `The key of the pre-made model to use if matched. Values: [${assetKeys}]. Null otherwise.`,
        nullable: true,
      },
      shapes: {
        type: Type.ARRAY,
        description: "List of primitives. Empty if modelKey is set.",
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'capsule'] },
            position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            scale: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            color: { type: Type.STRING },
            metalness: { type: Type.NUMBER },
            roughness: { type: Type.NUMBER },
            texture: { 
              type: Type.STRING, 
              enum: ['wood', 'brick', 'stone', 'metal', 'tech', 'checkers'],
              nullable: true 
            }
          },
          required: ["type", "position", "rotation", "scale", "color"]
        }
      }
    },
    required: ["shapes"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.5, 
        thinkingConfig: { thinkingBudget: 2048 } 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    
    // Process response to inject actual URL if key is present
    const result: GeneratedModelData = {
      shapes: parsed.shapes || []
    };

    if (parsed.modelKey && ASSET_LIBRARY[parsed.modelKey]) {
      result.modelUrl = ASSET_LIBRARY[parsed.modelKey];
    }

    return result;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate 3D model data.");
  }
};