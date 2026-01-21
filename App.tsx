import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, Stars } from '@react-three/drei';
import Webcam from 'react-webcam';
import { Camera, Box, RotateCw, Sparkles, AlertCircle, Maximize2, RefreshCw } from 'lucide-react';
import { generate3DStructure } from './services/geminiService';
import { GeneratedObject } from './components/GeneratedObject';
import { GeneratedModelData } from './types';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isARMode, setIsARMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelData, setModelData] = useState<GeneratedModelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial demo model
  useEffect(() => {
    // A simple textured tree/totem to show off capabilities
    setModelData({
      shapes: [
        // Base
        { type: 'cylinder', position: [0, -1, 0], scale: [1.2, 0.2, 1.2], rotation: [0, 0, 0], color: '#555555', texture: 'stone', roughness: 0.9 },
        // Trunk
        { type: 'cylinder', position: [0, -0.2, 0], scale: [0.4, 1.5, 0.4], rotation: [0, 0, 0], color: '#8B4513', texture: 'wood', roughness: 0.8 },
        // Foliage Layers
        { type: 'cone', position: [0, 0.5, 0], scale: [1.3, 1.2, 1.3], rotation: [0, 0, 0], color: '#228B22', roughness: 1 },
        { type: 'cone', position: [0, 1.2, 0], scale: [1.0, 1.0, 1.0], rotation: [0, 0, 0], color: '#32CD32', roughness: 1 },
        { type: 'cone', position: [0, 1.8, 0], scale: [0.7, 0.8, 0.7], rotation: [0, 0, 0], color: '#7CFC00', roughness: 1 },
        // Decorative Orbs
        { type: 'sphere', position: [0.6, 0.4, 0.6], scale: [0.15, 0.15, 0.15], rotation: [0, 0, 0], color: '#FF0000', metalness: 0.8, roughness: 0.2 },
        { type: 'sphere', position: [-0.5, 1.0, 0.5], scale: [0.15, 0.15, 0.15], rotation: [0, 0, 0], color: '#FFFF00', metalness: 0.8, roughness: 0.2 },
      ]
    });
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await generate3DStructure(prompt);
      setModelData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate object");
    } finally {
      setLoading(false);
    }
  };

  const toggleAR = () => {
    setIsARMode(!isARMode);
  };

  return (
    <div className="relative w-full h-full bg-gray-900 text-white overflow-hidden font-sans">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {isARMode ? (
          <Webcam
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "environment" }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800" />
        )}
      </div>

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-10">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 5], fov: 50 }}>
           {/* If not in AR mode, show an environment and stars for aesthetics */}
          {!isARMode && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
          
          <OrbitControls makeDefault autoRotate={loading} autoRotateSpeed={4} />

          <group position={[0, -0.5, 0]}>
            {modelData ? (
               // We wrap in Stage for nice lighting and centering, but in AR we might want more manual control
               // For simplicity, we use Stage in non-AR, and manual lights in AR to match video feed better
               isARMode ? (
                 <>
                   <ambientLight intensity={0.8} />
                   <directionalLight position={[10, 10, 5]} intensity={1.5} />
                   <GeneratedObject data={modelData} />
                 </>
               ) : (
                 <Stage environment="city" intensity={0.6} adjustCamera={false}>
                   <GeneratedObject data={modelData} />
                 </Stage>
               )
            ) : null}
          </group>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <div className="pointer-events-auto flex justify-between items-start">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              Gen3D AR
            </h1>
            <p className="text-xs text-gray-300 mt-1">
              Gemini-powered 3D Object Generator
            </p>
          </div>

          <button
            onClick={toggleAR}
            className={`p-3 rounded-full transition-all duration-300 border backdrop-blur-md shadow-lg flex items-center gap-2 ${
              isARMode 
                ? 'bg-red-500/80 border-red-400 hover:bg-red-600' 
                : 'bg-indigo-600/80 border-indigo-400 hover:bg-indigo-700'
            }`}
          >
            {isARMode ? <Box size={20} /> : <Camera size={20} />}
            <span className="font-medium text-sm hidden sm:inline">{isARMode ? 'Exit AR' : 'Enter AR'}</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="pointer-events-auto mx-auto mt-4 bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-lg animate-bounce">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="pointer-events-auto w-full max-w-lg mx-auto bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl mb-4 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Describe a 3D object (e.g., 'a red futuristic rocket')"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                  loading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Building...
                  </>
                ) : (
                  <>
                    <Maximize2 size={18} />
                    Generate Object
                  </>
                )}
              </button>
            </div>
            
            <div className="flex justify-center gap-4 text-[10px] text-gray-500 uppercase tracking-widest">
               <span>Powered by Gemini 2.5</span>
               <span>•</span>
               <span>Three.js</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;