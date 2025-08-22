import React, { useRef, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Modal,
  Backdrop,
  Fade,
  IconButton
} from '@mui/material';
import {
  Close,
  Public
} from '@mui/icons-material';
import * as THREE from 'three';
import { Planet } from '../services/localData';

interface Planet3DModalProps {
  planet: Planet | null;
  open: boolean;
  onClose: () => void;
}

const Planet3DModal: React.FC<Planet3DModalProps> = ({ planet, open, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!open || !planet || !mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(400, 400);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // Planet geometry
    const planetRadius = Math.max(1.0, Math.min(2.5, (planet.pl_radj || 1) * 1.5));
    const geometry = new THREE.SphereGeometry(planetRadius, 64, 64);
    
    // Planet material based on properties
    const getTemperatureColor = (temp: number) => {
      if (temp > 6000) return new THREE.Color(0x4488ff); // Hot blue-white
      if (temp > 5000) return new THREE.Color(0xffdd44); // Yellow like sun
      if (temp > 4000) return new THREE.Color(0xff8844); // Orange
      if (temp > 3000) return new THREE.Color(0xff4444); // Red
      return new THREE.Color(0xff2222); // Deep red
    };

    const color = getTemperatureColor(planet.st_teff || 5000);
    
    // Create planet texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient for planet surface
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`);
    gradient.addColorStop(0.7, `rgb(${color.r * 200}, ${color.g * 200}, ${color.b * 200})`);
    gradient.addColorStop(1, `rgb(${color.r * 100}, ${color.g * 100}, ${color.b * 100})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add surface details
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 20 + 5;
      
      ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 30,
      transparent: false
    });

    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    scene.add(planetMesh);

    // Add atmospheric glow
    const glowGeometry = new THREE.SphereGeometry(planetRadius * 1.1, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Add ring system if it's a gas giant (large radius)
    if (planet.pl_radj && planet.pl_radj > 0.8) {
      const ringGeometry = new THREE.RingGeometry(planetRadius * 1.3, planetRadius * 2, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.7, 0.7, 0.8),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      scene.add(ringMesh);
    }

    // Add small moons for larger planets
    const moons: THREE.Mesh[] = [];
    if (planet.pl_radj && planet.pl_radj > 0.5) {
      const moonCount = Math.min(3, Math.floor(planet.pl_radj * 2));
      for (let i = 0; i < moonCount; i++) {
        const moonRadius = 0.1 + Math.random() * 0.15;
        const moonGeometry = new THREE.SphereGeometry(moonRadius, 16, 16);
        const moonMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(0.6, 0.6, 0.7)
        });
        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        
        const orbitRadius = planetRadius * (2 + i * 0.8);
        const angle = (Math.PI * 2 * i) / moonCount;
        moonMesh.position.set(
          Math.cos(angle) * orbitRadius,
          Math.sin(angle) * orbitRadius * 0.3,
          Math.sin(angle) * orbitRadius
        );
        
        scene.add(moonMesh);
        moons.push(moonMesh);
      }
    }

    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.6, 100);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    // Add rim lighting
    const rimLight = new THREE.DirectionalLight(color, 0.3);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    // Stars background
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 500; i++) {
      starVertices.push((Math.random() - 0.5) * 100);
      starVertices.push((Math.random() - 0.5) * 100);
      starVertices.push((Math.random() - 0.5) * 100);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 0.3,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate planet
      planetMesh.rotation.y += 0.005;
      glowMesh.rotation.y += 0.005;
      
      // Rotate rings
      if (planet.pl_radj && planet.pl_radj > 0.8) {
        const ring = scene.children.find(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry);
        if (ring) ring.rotation.z += 0.003;
      }
      
      // Animate moons
      moons.forEach((moon, i) => {
        const time = Date.now() * 0.001;
        const orbitRadius = planetRadius * (2 + i * 0.8);
        const speed = 0.5 + i * 0.2;
        const angle = time * speed + (Math.PI * 2 * i) / moons.length;
        
        moon.position.set(
          Math.cos(angle) * orbitRadius,
          Math.sin(angle) * orbitRadius * 0.3,
          Math.sin(angle) * orbitRadius
        );
      });
      
      // Gentle star rotation
      stars.rotation.y += 0.0003;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [open, planet]);

  if (!planet) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
          minWidth: 900,
          maxHeight: '95vh',
          overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Public color="primary" />
              {planet.pl_name}
            </Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            {/* 3D Planet Visualization */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(45deg, #1a1a1a, #2d2d2d)' }}>
                <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                  3D Planet Visualization
                </Typography>
                <Box ref={mountRef} sx={{ display: 'flex', justifyContent: 'center' }} />
                <Typography variant="caption" color="white" sx={{ mt: 1, display: 'block' }}>
                  Interactive 3D model based on actual planetary data
                </Typography>
              </Paper>
            </Grid>

            {/* Planet Details */}
            <Grid item xs={12} md={7}>
              <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
                Planetary System Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, mb: 2, background: 'linear-gradient(45deg, #f5f5f5, #ffffff)' }}>
                    <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                      🌍 Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Planet Name</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{planet.pl_name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Host Star</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{planet.hostname}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">Radius</Typography>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                      {planet.pl_radj ? planet.pl_radj.toFixed(3) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Jupiter Radii</Typography>
                    {planet.pl_radj && (
                      <Typography variant="caption" color="info.main">
                        ≈ {(planet.pl_radj * 69911).toFixed(0)} km
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="caption" color="text.secondary">Mass</Typography>
                    <Typography variant="h5" color="secondary" sx={{ fontWeight: 700 }}>
                      {planet.pl_bmassj ? planet.pl_bmassj.toFixed(3) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Jupiter Masses</Typography>
                    {planet.pl_bmassj && (
                      <Typography variant="caption" color="info.main">
                        ≈ {(planet.pl_bmassj * 1.898e27).toExponential(2)} kg
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Orbital Period</Typography>
                    <Typography variant="h5" color="info.main" sx={{ fontWeight: 700 }}>
                      {planet.pl_orbper ? planet.pl_orbper.toFixed(1) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Earth Days</Typography>
                    {planet.pl_orbper && (
                      <Typography variant="caption" color="info.main">
                        ≈ {(planet.pl_orbper / 365.25).toFixed(2)} Earth years
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Semi-major Axis</Typography>
                    <Typography variant="h5" color="warning.main" sx={{ fontWeight: 700 }}>
                      {planet.pl_orbsmax ? planet.pl_orbsmax.toFixed(4) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Astronomical Units</Typography>
                    {planet.pl_orbsmax && (
                      <Typography variant="caption" color="info.main">
                        ≈ {(planet.pl_orbsmax * 149.6e6).toFixed(1)} million km
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Stellar Temperature</Typography>
                    <Typography variant="h5" color="error.main" sx={{ fontWeight: 700 }}>
                      {planet.st_teff ? planet.st_teff.toFixed(0) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Kelvin</Typography>
                    {planet.st_teff && (
                      <Typography variant="caption" color="info.main">
                        ≈ {(planet.st_teff - 273.15).toFixed(0)}°C
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Distance from Earth</Typography>
                    <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
                      {planet.st_dist ? planet.st_dist.toFixed(1) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Parsecs</Typography>
                    {planet.st_dist && (
                      <Typography variant="caption" color="info.main">
                        ≈ {(planet.st_dist * 3.26).toFixed(1)} light-years
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3, background: 'linear-gradient(45deg, #e3f2fd, #f3e5f5)' }}>
                    <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                      🌌 Astronomical Coordinates
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Right Ascension</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {planet.ra ? `${planet.ra.toFixed(4)}°` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Declination</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {planet.dec ? `${planet.dec.toFixed(4)}°` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Modal>
  );
};

export default Planet3DModal;
