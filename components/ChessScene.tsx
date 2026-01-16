
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, ChessPiece } from '../types';
import { BOARD_OFFSET, COLORS, SQUARE_SIZE } from '../constants';

const SoldierModel: React.FC<{ piece: ChessPiece; isSelected: boolean }> = ({ piece, isSelected }) => {
  const meshRef = useRef<THREE.Group>(null!);
  const [targetPos] = useMemo(() => [
    new THREE.Vector3(
      piece.position[1] * SQUARE_SIZE - BOARD_OFFSET,
      0,
      piece.position[0] * SQUARE_SIZE - BOARD_OFFSET
    )
  ], [piece.position]);

  useFrame((state, delta) => {
    meshRef.current.position.lerp(targetPos, delta * 12);
  });

  const sideColor = piece.side === 'white' ? COLORS.french : COLORS.uk;
  const trouserColor = piece.side === 'white' ? '#fdfefe' : '#566573';
  const goldMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: 1, roughness: 0.2 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: '#d2b48c', roughness: 0.8 });
  const blackMaterial = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 });
  
  const uniformMaterial = new THREE.MeshStandardMaterial({ 
    color: sideColor, 
    metalness: 0.3, 
    roughness: 0.7,
    emissive: isSelected ? '#fbbf24' : '#000',
    emissiveIntensity: isSelected ? 0.3 : 0
  });

  const Pedestal = () => (
    <mesh position={[0, 0.05, 0]} castShadow>
      <cylinderGeometry args={[0.38, 0.42, 0.1, 32]} />
      <meshStandardMaterial color="#212121" metalness={0.9} roughness={0.1} />
    </mesh>
  );

  const Humanoid = ({ hatType = 'shako', showMusket = false, height = 0.5, plumeColor = '#fff' }) => (
    <group>
      {/* Legs */}
      <mesh position={[0.07, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.35, 8]} />
        <meshStandardMaterial color={trouserColor} />
      </mesh>
      <mesh position={[-0.07, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.35, 8]} />
        <meshStandardMaterial color={trouserColor} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.22, 0.35, 0.15]} />
        <primitive object={uniformMaterial} attach="material" />
      </mesh>
      {/* Cross Belts */}
      <mesh position={[0, 0.55, 0.01]} rotation={[0, 0, 0.7]} castShadow>
        <boxGeometry args={[0.03, 0.45, 0.16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.55, 0.01]} rotation={[0, 0, -0.7]} castShadow>
        <boxGeometry args={[0.03, 0.45, 0.16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      {/* Hat */}
      <group position={[0, 0.95, 0]}>
        {hatType === 'shako' && (
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.22, 16]} />
            <primitive object={blackMaterial} attach="material" />
          </mesh>
        )}
        {hatType === 'bearskin' && (
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.35, 16]} />
            <primitive object={blackMaterial} attach="material" />
          </mesh>
        )}
        {hatType === 'bicorne' && (
          <mesh castShadow rotation={[0, Math.PI/2, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 3, 1, false, 0, Math.PI]} />
            <primitive object={blackMaterial} attach="material" />
          </mesh>
        )}
        {/* Plume */}
        <mesh position={[0.08, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={plumeColor} />
        </mesh>
      </group>
      {/* Musket */}
      {showMusket && (
        <group position={[0.18, 0.5, 0.05]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.85, 8]} />
            <meshStandardMaterial color="#3d2b1f" />
          </mesh>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
            <meshStandardMaterial color="#bdc3c7" metalness={1} />
          </mesh>
        </group>
      )}
    </group>
  );

  const renderPiece = () => {
    switch (piece.type) {
      case 'pawn':
        return (
          <group>
            <Pedestal />
            <Humanoid showMusket={true} plumeColor={piece.side === 'white' ? '#ff0000' : '#ffffff'} />
          </group>
        );
      case 'rook':
        return (
          <group rotation={[0, piece.side === 'white' ? 0 : Math.PI, 0]}>
            <Pedestal />
            <group position={[0, 0.2, 0]}>
              {/* Wheels */}
              <mesh position={[0.25, 0.05, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
                <meshStandardMaterial color="#4d2c19" />
              </mesh>
              <mesh position={[-0.25, 0.05, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
                <meshStandardMaterial color="#4d2c19" />
              </mesh>
              {/* Carriage Body */}
              <mesh position={[0, 0.1, -0.2]} castShadow>
                <boxGeometry args={[0.4, 0.2, 0.6]} />
                <meshStandardMaterial color="#4d2c19" />
              </mesh>
              {/* Barrel with Rings */}
              <group position={[0, 0.18, -0.1]} rotation={[0.15, 0, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.07, 0.11, 0.8, 16]} />
                  <meshStandardMaterial color="#7f8c8d" metalness={1} />
                </mesh>
                {[0.1, -0.1, -0.3].map((y, i) => (
                  <mesh key={i} position={[0, y, 0]} castShadow>
                    <torusGeometry args={[0.09, 0.015, 8, 16]} />
                    <meshStandardMaterial color="#7f8c8d" metalness={1} />
                  </mesh>
                ))}
              </group>
            </group>
          </group>
        );
      case 'knight':
        return (
          <group rotation={[0, piece.side === 'white' ? 0 : Math.PI, 0]}>
            <Pedestal />
            {/* Horse Anatomy */}
            <group position={[0, 0.2, 0]}>
              <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[0.25, 0.35, 0.6]} />
                <meshStandardMaterial color={piece.side === 'white' ? '#ecf0f1' : '#2c3e50'} />
              </mesh>
              <mesh position={[0, 0.45, 0.3]} rotation={[-0.6, 0, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.12, 0.45, 12]} />
                <meshStandardMaterial color={piece.side === 'white' ? '#ecf0f1' : '#2c3e50'} />
              </mesh>
              <mesh position={[0, 0.6, 0.5]} rotation={[0.8, 0, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.1, 0.3, 12]} />
                <meshStandardMaterial color={piece.side === 'white' ? '#ecf0f1' : '#2c3e50'} />
              </mesh>
            </group>
            {/* Rider (Hussar) */}
            <group position={[0, 0.2, 0]}>
              <Humanoid hatType="shako" plumeColor="#ffcc00" />
            </group>
          </group>
        );
      case 'bishop':
        return (
          <group>
            <Pedestal />
            <Humanoid hatType="bearskin" plumeColor="#ff0000" />
            {/* Ceremonial Sword */}
            <mesh position={[0.15, 0.5, -0.05]} rotation={[0.1, 0, 0.1]} castShadow>
              <boxGeometry args={[0.02, 0.55, 0.04]} />
              <primitive object={goldMaterial} attach="material" />
            </mesh>
          </group>
        );
      case 'queen':
        return (
          <group>
            <Pedestal />
            <Humanoid hatType="shako" plumeColor="#fff" />
            {/* Large Imperial Banner */}
            <group position={[0.22, 0.5, 0.1]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.025, 0.025, 1.8, 8]} />
                <primitive object={goldMaterial} attach="material" />
              </mesh>
              <mesh position={[0.35, 0.7, 0]} castShadow>
                <boxGeometry args={[0.6, 0.4, 0.03]} />
                <meshStandardMaterial color={sideColor} emissive={sideColor} emissiveIntensity={0.2} />
              </mesh>
              <mesh position={[0, 0.9, 0]} castShadow>
                <sphereGeometry args={[0.06, 12, 12]} />
                <primitive object={goldMaterial} attach="material" />
              </mesh>
            </group>
          </group>
        );
      case 'king':
        return (
          <group rotation={[0, piece.side === 'white' ? 0 : Math.PI, 0]}>
            <Pedestal />
            <Humanoid hatType="bicorne" plumeColor={piece.side === 'white' ? '#ffcc00' : '#fff'} />
            {/* Epaulettes */}
            <mesh position={[0.15, 0.7, 0]} castShadow>
              <boxGeometry args={[0.1, 0.04, 0.1]} />
              <primitive object={goldMaterial} attach="material" />
            </mesh>
            <mesh position={[-0.15, 0.7, 0]} castShadow>
              <boxGeometry args={[0.1, 0.04, 0.1]} />
              <primitive object={goldMaterial} attach="material" />
            </mesh>
            {/* Command Telescope */}
            <mesh position={[0.2, 0.55, 0.2]} rotation={[0.5, 0, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.03, 0.4, 8]} />
              <primitive object={goldMaterial} attach="material" />
            </mesh>
          </group>
        );
      default:
        return <Pedestal />;
    }
  };

  return (
    <group ref={meshRef}>
      {renderPiece()}
    </group>
  );
};

const Board = () => {
  const squares = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const isDark = (i + j) % 2 === 1;
        arr.push({ i, j, isDark });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {squares.map(({ i, j, isDark }) => (
        <mesh 
          key={`${i}-${j}`} 
          position={[j * SQUARE_SIZE - BOARD_OFFSET, -0.05, i * SQUARE_SIZE - BOARD_OFFSET]}
          receiveShadow
        >
          <boxGeometry args={[SQUARE_SIZE, 0.1, SQUARE_SIZE]} />
          <meshStandardMaterial 
            color={isDark ? '#2e4053' : '#d5dbdb'}
            roughness={0.05}
            metalness={0.2}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[8.8, 0.3, 8.8]} />
        <meshStandardMaterial color="#17202a" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
};

interface SceneProps {
  gameState: GameState;
}

const ChessScene: React.FC<SceneProps> = ({ gameState }) => {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={28} />
        <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={8} 
            maxDistance={20}
            autoRotate={gameState.isGameOver}
            autoRotateSpeed={0.3}
        />
        
        <ambientLight intensity={1.0} />
        <directionalLight 
          position={[20, 30, 20]} 
          intensity={2.5} 
          castShadow 
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[0, 5, 0]} intensity={1.5} color="#fff8e1" />
        <pointLight position={[-10, 5, -10]} intensity={1.0} color="#ffffff" />
        
        <Environment preset="studio" />
        
        <Board />
        
        {(Object.values(gameState.pieces) as ChessPiece[]).map((piece) => (
          <SoldierModel key={piece.id} piece={piece} isSelected={false} />
        ))}

        <ContactShadows position={[0, -0.16, 0]} opacity={0.6} scale={20} blur={2} far={6} />
      </Canvas>
    </div>
  );
};

export default ChessScene;
