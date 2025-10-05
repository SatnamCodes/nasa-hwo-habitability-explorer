import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

interface ExoplanetData {
  name: string;
  distance: number; // parsecs
  ra: number; // right ascension
  dec: number; // declination
  radius: number; // Earth radii
  mass?: number; // Earth masses
  temperature?: number; // Kelvin
  habitability?: number; // 0-1
  starType?: string;
  discoveryYear?: number;
}

interface EnhancedGalaxyMapProps {
  planets: ExoplanetData[];
  onPlanetClick?: (planet: ExoplanetData) => void;
  onPlanetHover?: (planet: ExoplanetData | null) => void;
}

// Helper: Convert RA/DEC/Distance to Cartesian (galactic coordinates)
const sphericalToCartesian = (ra: number, dec: number, distance: number) => {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const scale = 0.1; // parsecs to scene units
  
  return new THREE.Vector3(
    distance * Math.cos(decRad) * Math.cos(raRad) * scale,
    distance * Math.sin(decRad) * scale,
    distance * Math.cos(decRad) * Math.sin(raRad) * scale
  );
};

// Helper: Get planet color based on temperature and habitability
const getPlanetColor = (temp?: number, habitability?: number): number => {
  if (!temp) return 0x888888;
  
  if (habitability && habitability > 0.7) return 0x4CAF50; // Green for highly habitable
  if (temp < 200) return 0x88CCFF; // Pale blue for cold
  if (temp < 300) return 0x4DA6FF; // Blue for cool
  if (temp < 400) return 0x66BB6A; // Green-blue for temperate
  if (temp < 600) return 0xFFEB3B; // Yellow for warm
  if (temp < 1000) return 0xFF9800; // Orange for hot
  return 0xFF5722; // Red for very hot
};

const EnhancedGalaxyMap: React.FC<EnhancedGalaxyMapProps> = ({ 
  planets, 
  onPlanetClick, 
  onPlanetHover 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const planetMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  
  const [hoveredPlanet, setHoveredPlanet] = useState<ExoplanetData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 50, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing for bloom effect
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 2000;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    // Create starfield background
    createStarfield(scene);

    // Create Sun reference point
    createSun(scene);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Add directional light (from Sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      
      // Rotate planets slightly for visual effect
      planetMeshesRef.current.forEach(mesh => {
        mesh.rotation.y += 0.001;
      });
      
      composer.render();
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer || !composer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      controls.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Create starfield background
  const createStarfield = (scene: THREE.Scene) => {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 15000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      // Random position in sphere
      const radius = 500 + Math.random() * 4500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
      
      // Star colors (slightly varied whites and blues)
      const colorVariation = 0.8 + Math.random() * 0.2;
      colors[i] = colorVariation;
      colors[i + 1] = colorVariation * (0.9 + Math.random() * 0.1);
      colors[i + 2] = 1;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
  };

  // Create Sun at origin
  const createSun = (scene: THREE.Scene) => {
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFDB813
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFDB813,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);
    
    scene.add(sun);
    
    // Add label
    createLabel(scene, 'Solar System', new THREE.Vector3(0, 5, 0));
  };

  // Create text label
  const createLabel = (scene: THREE.Scene, text: string, position: THREE.Vector3) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'Bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(text, 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.scale.set(10, 2.5, 1);
    
    scene.add(sprite);
  };

  // Update planets when data changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Remove old planet meshes
    planetMeshesRef.current.forEach(mesh => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    planetMeshesRef.current.clear();

    // Create new planet meshes
    planets.forEach(planet => {
      const position = sphericalToCartesian(
        planet.ra || 0, 
        planet.dec || 0, 
        planet.distance
      );
      
      // Planet size based on radius (clamped for visibility)
      const size = Math.max(0.3, Math.min(planet.radius * 0.2, 3));
      
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      const color = getPlanetColor(planet.temperature, planet.habitability);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: planet.habitability && planet.habitability > 0.6 ? 0.3 : 0.1,
        roughness: 0.7,
        metalness: 0.3
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData = planet;
      
      // Add selection ring for high habitability planets
      if (planet.habitability && planet.habitability > 0.7) {
        const ringGeometry = new THREE.TorusGeometry(size * 1.5, 0.1, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x4CAF50,
          transparent: true,
          opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
      }
      
      scene.add(mesh);
      planetMeshesRef.current.set(planet.name, mesh);
    });
  }, [planets]);

  // Handle mouse interactions
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(
      Array.from(planetMeshesRef.current.values())
    );
    
    if (intersects.length > 0) {
      const planet = intersects[0].object.userData as ExoplanetData;
      setHoveredPlanet(planet);
      onPlanetHover?.(planet);
      document.body.style.cursor = 'pointer';
    } else {
      setHoveredPlanet(null);
      onPlanetHover?.(null);
      document.body.style.cursor = 'default';
    }
  }, [onPlanetHover]);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || isAnimating) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(
      Array.from(planetMeshesRef.current.values())
    );
    
    if (intersects.length > 0) {
      const planet = intersects[0].object.userData as ExoplanetData;
      onPlanetClick?.(planet);
      
      // Animate camera to planet
      if (cameraRef.current && controlsRef.current) {
        setIsAnimating(true);
        const targetPosition = intersects[0].object.position.clone();
        const offset = new THREE.Vector3(0, 5, 15);
        targetPosition.add(offset);
        
        // Smooth camera animation
        const startPosition = cameraRef.current.position.clone();
        const startTime = Date.now();
        const duration = 1500;
        
        const animateCamera = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(elapsed / duration, 1);
          const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
          
          cameraRef.current!.position.lerpVectors(startPosition, targetPosition, eased);
          controlsRef.current!.target.copy(intersects[0].object.position);
          
          if (t < 1) {
            requestAnimationFrame(animateCamera);
          } else {
            setIsAnimating(false);
          }
        };
        
        animateCamera();
      }
    }
  }, [onPlanetClick, isAnimating]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
    };
  }, [handleMouseMove, handleClick]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default EnhancedGalaxyMap;
