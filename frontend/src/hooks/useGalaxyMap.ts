import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getPlanetData, Planet } from '../services/localData';

interface UseGalaxyMapReturn {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  planetCount: number;
  loading: boolean;
  selectedPlanet: Planet | null;
  onPlanetModalClose: () => void;
  planets: Planet[] | null;
  showOrbitalPaths: (planet: Planet) => void;
  focusOnPlanet: (planet: Planet) => void;
}

export type { UseGalaxyMapReturn };

const useGalaxyMap = (): UseGalaxyMapReturn => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [planetCount, setPlanetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [planets, setPlanets] = useState<Planet[] | null>(null);
  
  // Store references for orbital paths and camera control
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const orbitalPathsRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const container = mapContainerRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ 
      antialias: window.devicePixelRatio <= 1, // Conditional antialiasing
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
    // Disable shadows for performance
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 5000;
    controls.autoRotate = false; // Remove auto-rotation for better user control
    controls.autoRotateSpeed = 0;
    controlsRef.current = controls;

    // Create orbital paths group
    const orbitalPathsGroup = new THREE.Group();
    scene.add(orbitalPathsGroup);
    orbitalPathsRef.current = orbitalPathsGroup;

    // Position camera for optimal Milky Way viewing - slightly above the galactic plane
    camera.position.set(100, 200, 150);

    // Optimized lighting for performance
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Increased ambient
    scene.add(ambientLight);
    
    // Simplified directional lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    // Disable shadows for better performance on lighter systems
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    // Optimized starfield for lighter systems
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8000; // Reduced from 20000 for performance
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      // Create Milky Way spiral structure (simplified for performance)
      const spiralArm = Math.floor(Math.random() * 4); // 4 spiral arms
      const armAngle = (spiralArm * Math.PI * 2) / 4;
      const spiralTightness = 3; // Reduced complexity
      
      // Distance from galactic center (optimized range)
      const r = Math.pow(Math.random(), 1.3) * 6000; // Reduced from 8000
      const theta = armAngle + (r / 1200) * spiralTightness + (Math.random() - 0.5) * 0.4;
      
      // Galactic disk thickness (optimized)
      const diskThickness = Math.max(40, 150 * (r / 3000)); // Reduced thickness
      const z = (Math.random() - 0.5) * diskThickness;
      
      // Convert to Cartesian coordinates
      const x = r * Math.cos(theta) + (Math.random() - 0.5) * 150;
      const y = r * Math.sin(theta) + (Math.random() - 0.5) * 150;
      
      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;
      
      // Simplified color variation
      const distanceFromArm = Math.abs(theta - armAngle - (r / 1200) * spiralTightness);
      const isInSpiral = distanceFromArm < 0.25;
      
      if (isInSpiral && r < 2500) {
        // Young, hot blue stars in spiral arms
        starColors[i * 3] = 0.6 + Math.random() * 0.4;     // R
        starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3; // G  
        starColors[i * 3 + 2] = 1.0;                       // B
      } else {
        // Older, cooler stars elsewhere
        const temp = 0.4 + Math.random() * 0.6;
        starColors[i * 3] = 1.0;                           // R
        starColors[i * 3 + 1] = temp;                      // G
        starColors[i * 3 + 2] = temp * 0.4;               // B
      }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({ 
      size: 1.2, // Slightly smaller for performance
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      sizeAttenuation: true
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Load and plot planet data
    getPlanetData().then((planetsData: Planet[]) => {
      setLoading(false);
      setPlanets(planetsData);
      setPlanetCount(planetsData.length);
      
      planetsData.forEach((planet, index) => {
        if (planet.st_dist && planet.ra && planet.dec) {
          // Optimized planet visualization for lighter systems
          const baseRadius = Math.max(0.4, Math.min(2.5, (planet.pl_radj || 1) * 0.7));
          
          // Simplified distance scaling
          const distanceScale = planet.st_dist > 200 ? 1.3 : 1.0;
          const finalRadius = baseRadius * distanceScale;
          
          // Reduced geometry complexity for performance
          const segments = planet.st_dist < 100 ? 16 : 12; // LOD based on distance
          const geometry = new THREE.SphereGeometry(finalRadius, segments, segments);
          
          // Optimized color system
          let color = new THREE.Color();
          if (planet.st_teff) {
            const temp = planet.st_teff;
            if (temp > 7500) color.setRGB(0.5, 0.6, 1.0);        // Blue-white
            else if (temp > 6000) color.setRGB(0.8, 0.9, 1.0);   // White  
            else if (temp > 5200) color.setRGB(1.0, 1.0, 0.7);   // Yellow-white
            else if (temp > 3700) color.setRGB(1.0, 0.6, 0.3);   // Orange
            else color.setRGB(1.0, 0.3, 0.1);                    // Red
            
            // Simplified enhancement for distant planets
            if (planet.st_dist > 300) {
              color.multiplyScalar(1.2);
            }
          } else {
            const distanceHue = Math.min(0.7, planet.st_dist / 800);
            color.setHSL(0.5 - distanceHue * 0.4, 0.7, 0.6);
          }
          
          // Optimized material - use MeshBasicMaterial for distant planets
          const isDistant = planet.st_dist > 500;
          const material = isDistant 
            ? new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.8
              })
            : new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 20,
                emissive: color.clone().multiplyScalar(0.05), // Reduced emissive
                transparent: false,
                opacity: 1.0
              });
          
          const planetMesh = new THREE.Mesh(geometry, material);
          
          // Disable shadows for distant planets (performance optimization)
          if (!isDistant) {
            planetMesh.castShadow = true;
            planetMesh.receiveShadow = true;
          }

          // Optimized positioning
          const distance = Math.min(planet.st_dist, 1500); // Reduced max distance
          const ra = THREE.MathUtils.degToRad(planet.ra * 15);
          const dec = THREE.MathUtils.degToRad(planet.dec);

          const x = distance * Math.cos(dec) * Math.cos(ra);
          const y = distance * Math.cos(dec) * Math.sin(ra);
          const z = distance * Math.sin(dec);

          planetMesh.position.set(x, y, z);
          
          // Add enhanced planet data for interaction and 3D modal
          planetMesh.userData = { 
            planet: planet,
            originalColor: color.clone(),
            originalEmissive: color.clone().multiplyScalar(0.1)
          };
          
          scene.add(planetMesh);

          // Remove orbital trails - they aren't smooth and ruin the experience
          // Focus on distance-wise Milky Way experience instead
        }
      });
    }).catch(() => {
      setLoading(false);
    });

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedObject: THREE.Mesh | null = null;

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children.filter(child => 
        child instanceof THREE.Mesh && child.userData.planet
      ));

      // Reset previous selection with enhanced emissive handling
      if (selectedObject && selectedObject.userData.originalEmissive) {
        (selectedObject.material as THREE.MeshPhongMaterial).emissive.copy(
          selectedObject.userData.originalEmissive
        );
      }

      if (intersects.length > 0) {
        selectedObject = intersects[0].object as THREE.Mesh;
        // Enhanced hover effect with brighter emissive glow
        (selectedObject.material as THREE.MeshPhongMaterial).emissive.copy(
          selectedObject.userData.originalColor.clone().multiplyScalar(0.6)
        );
        container.style.cursor = 'pointer';
      } else {
        selectedObject = null;
        container.style.cursor = 'grab';
      }
    };

    const onMouseClick = (event: MouseEvent) => {
      if (selectedObject && selectedObject.userData.planet) {
        const planet = selectedObject.userData.planet;
        setSelectedPlanet(planet); // Open modal instead of alert
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onMouseClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // Remove spiral animation - keep starfield stationary
      // starField.rotation.y += 0.0002;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onMouseClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const onPlanetModalClose = () => {
    setSelectedPlanet(null);
  };

  const showOrbitalPaths = useCallback((planet: Planet) => {
    if (!orbitalPathsRef.current) return;
    
    // Clear previous orbital paths
    orbitalPathsRef.current.clear();
    
    // Create orbital path for the planet
    const orbitRadius = planet.st_dist * 10; // Use stellar distance
    const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.5, orbitRadius + 0.5, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitMesh.rotation.x = Math.PI / 2; // Rotate to horizontal plane
    orbitalPathsRef.current.add(orbitMesh);
  }, []);

  const focusOnPlanet = useCallback((planet: Planet) => {
    if (!cameraRef.current || !controlsRef.current || !sceneRef.current) return;
    
    // Find the planet's mesh in the scene
    const planetMesh = sceneRef.current.getObjectByName(`planet-${planet.pl_name}`);
    if (planetMesh) {
      // Animate camera to focus on the planet
      const targetPosition = planetMesh.position.clone();
      const cameraPosition = targetPosition.clone().add(new THREE.Vector3(10, 10, 10));
      
      // Animate camera movement
      cameraRef.current.position.copy(cameraPosition);
      controlsRef.current.target.copy(targetPosition);
      controlsRef.current.update();
    }
  }, []);

  return { 
    mapContainerRef, 
    planetCount, 
    loading, 
    selectedPlanet, 
    onPlanetModalClose,
    planets,
    showOrbitalPaths,
    focusOnPlanet
  };
};

export default useGalaxyMap;
