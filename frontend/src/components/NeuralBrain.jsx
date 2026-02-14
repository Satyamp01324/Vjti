import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

function BrainParticles(props) {
  const ref = useRef();
  // Generate particles in a sphere - optimized count for performance
  const sphere = useMemo(() => random.inSphere(new Float32Array(1500), { radius: 1.2 }), []);

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 15;
    ref.current.rotation.y -= delta / 20;
    
    // Subtle breathing effect
    const t = state.clock.getElapsedTime();
    ref.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.02);
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#10B981" // Emerald
          size={0.004}
          sizeAttenuation={true}
          depthWrite={false}
          blending={2} // Additive blending
        />
      </Points>
    </group>
  );
}

const NeuralBrain = () => {
    return (
        <div className="absolute inset-0 z-0">
             <Canvas camera={{ position: [0, 0, 2.5], fov: 60 }} dpr={[1, 2]} gl={{ antialias: false }}>
                 <color attach="background" args={['#0F172A']} />
                 <BrainParticles />
                 <ambientLight intensity={0.5} />
             </Canvas>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900 pointer-events-none"></div>
        </div>
    )
}

export default NeuralBrain;
