"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";

interface SlotMesh extends THREE.Mesh {
  slotIndex?: number;
  slotPosition?: THREE.Vector3;
}

interface GoldBar {
  mesh: THREE.Mesh;
  slotIndex: number;
  slot: THREE.Mesh;
}

export default function VaultPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuration state
  const [shelfRows, setShelfRows] = useState(5);
  const [shelfCols, setShelfCols] = useState(10);
  const [totalBars, setTotalBars] = useState(200);
  const [pricePerBar, setPricePerBar] = useState(30);
  const [showSettings, setShowSettings] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationAmount, setNotificationAmount] = useState(0);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    goldBars: GoldBar[];
    shelves: THREE.Group[];
    vaultDoor: THREE.Group;
    doorLight: THREE.Mesh;
    ledLights: THREE.PointLight[];
    mainLight: THREE.DirectionalLight;
    godRayLight: THREE.SpotLight;
    ambientLight: THREE.HemisphereLight;
    thief?: THREE.Mesh;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous scene if it exists
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f0f);
    scene.fog = new THREE.FogExp2(0x0f0f0f, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 6, 15);
    camera.lookAt(0, 3, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 3, 0);
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 8;
    controls.maxDistance = 25;

    // Lighting - Normal mode
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    scene.add(mainLight);

    const godRayLight = new THREE.SpotLight(0xffffff, 1.2);
    godRayLight.position.set(0, 10, 0);
    godRayLight.angle = Math.PI / 5;
    godRayLight.penumbra = 0.5;
    godRayLight.castShadow = true;
    scene.add(godRayLight);

    // Materials
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a8a8a,
      roughness: 0.95,
      metalness: 0.1,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
    });

    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.3,
      metalness: 0.8,
    });

    const slotMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.95,
      metalness: 0.0,
    });

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.3,
      metalness: 0.9,
    });

    // Room structure
    const roomSize = 20;
    const roomHeight = 8; // Decreased from 10 to 8

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomSize),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const walls: THREE.Mesh[] = [];

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomHeight),
      wallMaterial
    );
    backWall.position.set(0, roomHeight / 2, -roomSize / 2);
    scene.add(backWall);
    walls.push(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomHeight),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomSize / 2, roomHeight / 2, 0);
    scene.add(leftWall);
    walls.push(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomHeight),
      wallMaterial
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomSize / 2, roomHeight / 2, 0);
    scene.add(rightWall);
    walls.push(rightWall);

    // Vault door - positioned on back wall
    const vaultDoor = new THREE.Group();
    const doorRadius = 3;
    const doorDepth = 0.5;
    const doorY = 5; // Height of door center
    const doorZ = -roomSize / 2; // Back wall position

    // Main door cylinder - rotate around X axis to lay flat against wall
    const doorCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(doorRadius, doorRadius, doorDepth, 64),
      doorMaterial
    );
    doorCylinder.rotation.x = Math.PI / 2; // Rotate to lay flat
    doorCylinder.position.set(0, doorY, doorZ);
    doorCylinder.castShadow = true;
    vaultDoor.add(doorCylinder);

    // Locking bolts (8 radiating cylinders)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16),
        doorMaterial
      );
      bolt.rotation.x = Math.PI / 2; // Rotate to lay flat
      bolt.position.set(
        Math.cos(angle) * (doorRadius - 0.4),
        doorY + Math.sin(angle) * (doorRadius - 0.4),
        doorZ
      );
      vaultDoor.add(bolt);
    }

    // Three-spoked wheel
    const wheel = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, doorRadius * 0.6, 16),
        doorMaterial
      );
      spoke.rotation.x = Math.PI / 2; // Rotate to lay flat
      spoke.rotation.z = (i / 3) * Math.PI * 2; // Rotate spokes around center
      wheel.add(spoke);
    }
    wheel.position.set(0, doorY, doorZ + doorDepth / 2 + 0.1);
    vaultDoor.add(wheel);

    // Status light (green initially)
    const doorLightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const doorLightMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 1.0,
    });
    const doorLight = new THREE.Mesh(doorLightGeometry, doorLightMaterial);
    doorLight.position.set(
      0,
      doorY - doorRadius * 0.6,
      doorZ + doorDepth / 2 + 0.15
    );
    vaultDoor.add(doorLight);

    // Position the entire door group at origin (children are positioned relative to this)
    vaultDoor.position.set(0, 0, 0);
    scene.add(vaultDoor);

    // Shelving system
    const createShelves = (wallSide: "left" | "right"): THREE.Group => {
      const shelfGroup = new THREE.Group();
      // FORCE 5 ROWS - ignore state for now to fix the issue
      const cols = shelfCols;
      const shelfWidth = 2.2; // Increased to fit larger slots
      const shelfDepth = 0.4; // Increased depth
      const slotWidth = 2.2; // Increased to fit larger bars
      const slotHeight = 0.45; // Increased height
      const slotDepth = 1.4; // Increased depth
      // Calculate spacing to fit within room height - ensure all rows are visible
      const bottomMargin = 0.5; // Space from floor
      const topMargin = 1.0; // Space from ceiling
      const availableHeight = roomHeight - bottomMargin - topMargin;
      // Fixed spacing for 5 rows
      const verticalSpacing = availableHeight / 4; // 5 rows means 4 gaps
      const horizontalSpacing = 1.8; // Increased spacing for larger bars
      const wallOffset = roomSize / 2 - 0.5;
      const xPos = wallSide === "left" ? -wallOffset : wallOffset;

      const ledLights: THREE.PointLight[] = [];

      // Create exactly 5 rows
      for (let row = 0; row < 5; row++) {
        const yPos = bottomMargin + row * verticalSpacing;

        // LED light above shelf
        const ledLight = new THREE.PointLight(0xffffff, 0.5, 10);
        ledLight.position.set(xPos, yPos + 1, 0);
        scene.add(ledLight);
        ledLights.push(ledLight);

        // Center the shelves in the room (not stuck to edges)
        const totalShelfWidth = (cols - 1) * horizontalSpacing;
        const startZ = -totalShelfWidth / 2; // Center the shelves

        for (let col = 0; col < cols; col++) {
          const zPos = startZ + col * horizontalSpacing;

          // Shelf
          const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(shelfWidth, 0.05, shelfDepth),
            shelfMaterial
          );
          shelf.position.set(xPos, yPos, zPos);
          shelf.castShadow = true;
          shelf.receiveShadow = true;
          shelfGroup.add(shelf);

          // Slot tray (recessed)
          const slotTray = new THREE.Mesh(
            new THREE.BoxGeometry(slotWidth, slotHeight, slotDepth),
            slotMaterial
          );
          slotTray.position.set(xPos, yPos - 0.05, zPos);
          slotTray.receiveShadow = true;
          shelfGroup.add(slotTray);

          // Store slot reference for gold bar placement
          const slotMesh = slotTray as SlotMesh;
          slotMesh.slotIndex = row * cols + col;
          slotMesh.slotPosition = new THREE.Vector3(xPos, yPos + 0.1, zPos);
        }
      }

      return shelfGroup;
    };

    const leftShelves = createShelves("left");
    scene.add(leftShelves);

    const rightShelves = createShelves("right");
    scene.add(rightShelves);

    // Create middle shelves (facing forward/backward)
    const createMiddleShelves = (): THREE.Group => {
      const shelfGroup = new THREE.Group();
      // FORCE 5 ROWS - ignore state for now to fix the issue
      const cols = Math.floor(shelfCols * 0.8); // Slightly fewer columns for middle
      const shelfWidth = 2.2; // Increased to fit larger slots
      const shelfDepth = 0.4; // Increased depth
      const slotWidth = 2.2; // Increased to fit larger bars
      const slotHeight = 0.45; // Increased height
      const slotDepth = 1.4; // Increased depth

      // Calculate spacing to fit within room height - ensure all rows are visible
      const bottomMargin = 0.5; // Space from floor
      const topMargin = 1.0; // Space from ceiling
      const availableHeight = roomHeight - bottomMargin - topMargin;
      // Fixed spacing for 5 rows
      const verticalSpacing = availableHeight / 4; // 5 rows means 4 gaps
      const horizontalSpacing = 1.8; // Increased spacing for larger bars
      const centerX = 0; // Middle of room

      // Center the shelves (not stuck to edges)
      const totalShelfWidth = (cols - 1) * horizontalSpacing;
      const startZ = -totalShelfWidth / 2; // Center the shelves

      // Create exactly 5 rows
      for (let row = 0; row < 5; row++) {
        const yPos = bottomMargin + row * verticalSpacing;

        // LED light above shelf
        const ledLight = new THREE.PointLight(0xffffff, 0.5, 10);
        ledLight.position.set(centerX, yPos + 1, 0);
        scene.add(ledLight);

        for (let col = 0; col < cols; col++) {
          const zPos = startZ + col * horizontalSpacing;

          // Shelf (rotated 90 degrees to face forward/backward)
          const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(shelfDepth, 0.05, shelfWidth),
            shelfMaterial
          );
          shelf.rotation.y = Math.PI / 2; // Rotate to face forward
          shelf.position.set(centerX, yPos, zPos);
          shelf.castShadow = true;
          shelf.receiveShadow = true;
          shelfGroup.add(shelf);

          // Slot tray (recessed)
          const slotTray = new THREE.Mesh(
            new THREE.BoxGeometry(slotDepth, slotHeight, slotWidth),
            slotMaterial
          );
          slotTray.rotation.y = Math.PI / 2; // Rotate to match shelf
          slotTray.position.set(centerX, yPos - 0.05, zPos);
          slotTray.receiveShadow = true;
          shelfGroup.add(slotTray);

          // Store slot reference for gold bar placement
          const slotMesh = slotTray as SlotMesh;
          slotMesh.slotIndex = row * cols + col;
          slotMesh.slotPosition = new THREE.Vector3(centerX, yPos + 0.1, zPos);
        }
      }

      return shelfGroup;
    };

    const middleShelves = createMiddleShelves();
    scene.add(middleShelves);

    // Collect all LED lights
    const ledLights: THREE.PointLight[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.PointLight) {
        ledLights.push(object);
      }
    });

    // Gold bars - increased size
    const goldBars: GoldBar[] = [];
    const goldBarGeometry = new THREE.BoxGeometry(2.0, 0.8, 1.2); // Increased: 2.0×0.8×1.2
    const maxVisibleBars = totalBars;

    const createGoldBar = (position: THREE.Vector3): THREE.Mesh => {
      const goldMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.12, 1.0, 0.5 + Math.random() * 0.1),
        metalness: 0.95,
        roughness: 0.1,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.1,
      });

      const bar = new THREE.Mesh(goldBarGeometry, goldMaterial);
      bar.position.copy(position);
      bar.castShadow = true;
      bar.receiveShadow = true;
      return bar;
    };

    // Initialize gold bars in slots
    const initializeGoldBars = () => {
      const slots: { position: THREE.Vector3; slot: THREE.Mesh }[] = [];

      // Collect all slot positions
      leftShelves.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const slotMesh = object as SlotMesh;
          if (slotMesh.slotIndex !== undefined && slotMesh.slotPosition) {
            slots.push({
              position: slotMesh.slotPosition,
              slot: object,
            });
          }
        }
      });
      rightShelves.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const slotMesh = object as SlotMesh;
          if (slotMesh.slotIndex !== undefined && slotMesh.slotPosition) {
            slots.push({
              position: slotMesh.slotPosition,
              slot: object,
            });
          }
        }
      });

      // Collect slots from middle shelves
      middleShelves.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const slotMesh = object as SlotMesh;
          if (slotMesh.slotIndex !== undefined && slotMesh.slotPosition) {
            slots.push({
              position: slotMesh.slotPosition,
              slot: object,
            });
          }
        }
      });

      // Place bars in all available slots (no floor bars)
      const barsToPlace = Math.min(slots.length, maxVisibleBars);
      for (let i = 0; i < barsToPlace; i++) {
        const slot = slots[i];
        const bar = createGoldBar(slot.position);
        scene.add(bar);
        goldBars.push({
          mesh: bar,
          slotIndex: i,
          slot: slot.slot,
        });
      }
    };

    initializeGoldBars();

    // Store scene references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      goldBars,
      shelves: [leftShelves, rightShelves, middleShelves],
      vaultDoor,
      doorLight,
      ledLights,
      mainLight,
      godRayLight,
      ambientLight,
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [shelfRows, shelfCols, totalBars, pricePerBar]);

  const setEmergencyMode = (enabled: boolean) => {
    if (!sceneRef.current) return;

    const { mainLight, godRayLight, ambientLight, ledLights, doorLight } =
      sceneRef.current;

    if (enabled) {
      // Emergency mode - keep lights brighter so scene remains visible
      // Use proxy objects to safely animate Three.js light properties
      const mainLightProxy = { intensity: mainLight.intensity };
      const godRayLightProxy = { intensity: godRayLight.intensity };
      const ambientLightProxy = { intensity: ambientLight.intensity };

      gsap.to(mainLightProxy, {
        intensity: 0.6,
        duration: 0.5,
        ease: "power2.inOut",
        onUpdate: () => {
          mainLight.intensity = mainLightProxy.intensity;
        },
      });
      gsap.to(godRayLightProxy, {
        intensity: 0.5,
        duration: 0.5,
        ease: "power2.inOut",
        onUpdate: () => {
          godRayLight.intensity = godRayLightProxy.intensity;
        },
      });
      gsap.to(ambientLightProxy, {
        intensity: 0.3,
        duration: 0.5,
        ease: "power2.inOut",
        onUpdate: () => {
          ambientLight.intensity = ambientLightProxy.intensity;
        },
      });

      // Animate LED lights to red with higher intensity
      ledLights.forEach((light) => {
        const startColor = new THREE.Color(light.color);
        const targetColor = new THREE.Color(0xff0000);
        const colorObj = { r: startColor.r, g: startColor.g, b: startColor.b };

        gsap.to(colorObj, {
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b,
          duration: 0.5,
          ease: "power2.inOut",
          onUpdate: function () {
            light.color.setRGB(colorObj.r, colorObj.g, colorObj.b);
          },
        });

        const intensityProxy = { intensity: light.intensity };
        gsap.to(intensityProxy, {
          intensity: 1.2,
          duration: 0.5,
          ease: "power2.inOut",
          onUpdate: () => {
            light.intensity = intensityProxy.intensity;
          },
        });
      });

      // Update door light to red
      if (doorLight.material instanceof THREE.MeshStandardMaterial) {
        doorLight.material.color.setHex(0xff0000);
        doorLight.material.emissive.setHex(0xff0000);
        doorLight.material.emissiveIntensity = 1.5;
      }

      // Door animation
      gsap.to(sceneRef.current.vaultDoor.rotation, {
        z: 0.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    } else {
      // Normal mode
      // Use proxy objects to safely animate Three.js light properties
      const mainLightProxy = { intensity: mainLight.intensity };
      const godRayLightProxy = { intensity: godRayLight.intensity };
      const ambientLightProxy = { intensity: ambientLight.intensity };

      gsap.to(mainLightProxy, {
        intensity: 1.2,
        duration: 0.5,
        ease: "power2.inOut",
        onUpdate: () => {
          mainLight.intensity = mainLightProxy.intensity;
        },
      });
      gsap.to(godRayLightProxy, {
        intensity: 1.2,
        duration: 0.5,
        ease: "power2.inOut",
        onUpdate: () => {
          godRayLight.intensity = godRayLightProxy.intensity;
        },
      });
      gsap.to(ambientLightProxy, {
        intensity: 0.4,
        duration: 0.5,
        ease: "power2.inOut",
        onUpdate: () => {
          ambientLight.intensity = ambientLightProxy.intensity;
        },
      });

      // Animate LED lights back to white
      ledLights.forEach((light) => {
        const startColor = new THREE.Color(light.color);
        const targetColor = new THREE.Color(0xffffff);
        const colorObj = { r: startColor.r, g: startColor.g, b: startColor.b };

        gsap.to(colorObj, {
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b,
          duration: 0.5,
          ease: "power2.inOut",
          onUpdate: function () {
            light.color.setRGB(colorObj.r, colorObj.g, colorObj.b);
          },
        });

        const intensityProxy = { intensity: light.intensity };
        gsap.to(intensityProxy, {
          intensity: 0.5,
          duration: 0.5,
          ease: "power2.inOut",
          onUpdate: () => {
            light.intensity = intensityProxy.intensity;
          },
        });
      });

      // Update door light back to green
      if (doorLight.material instanceof THREE.MeshStandardMaterial) {
        doorLight.material.color.setHex(0x00ff00);
        doorLight.material.emissive.setHex(0x00ff00);
        doorLight.material.emissiveIntensity = 1.0;
      }
    }
  };

  const performHeist = () => {
    if (
      !sceneRef.current ||
      isAnimating ||
      sceneRef.current.goldBars.length === 0
    )
      return;

    setIsAnimating(true);
    const { scene, goldBars } = sceneRef.current;

    // Select random bar
    const randomIndex = Math.floor(Math.random() * goldBars.length);
    const targetBar = goldBars[randomIndex];
    const barPosition = targetBar.mesh.position.clone();

    // Create thief
    const thiefGeometry = new THREE.BoxGeometry(1, 1, 1);
    const thiefMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.5,
    });
    const thief = new THREE.Mesh(thiefGeometry, thiefMaterial);
    thief.position.set(0, 8, 10);
    thief.castShadow = true;
    scene.add(thief);
    sceneRef.current.thief = thief;

    // Show notification
    setNotificationAmount(pricePerBar);
    setShowNotification(true);

    // Activate emergency mode
    setEmergencyMode(true);

    // Animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // Remove thief and bar
        scene.remove(thief);
        scene.remove(targetBar.mesh);
        delete sceneRef.current!.thief;

        // Remove from array
        goldBars.splice(randomIndex, 1);

        // Update UI
        setTotalBars((prev) => Math.max(0, prev - 1));

        // Restore normal mode
        setEmergencyMode(false);
        setShowNotification(false);
        setIsAnimating(false);
      },
    });

    // Thief entry (faster)
    tl.to(thief.position, {
      x: barPosition.x,
      y: barPosition.y + 1,
      z: barPosition.z,
      duration: 0.8,
      ease: "power2.out",
    });

    // Bar theft (faster)
    tl.to(
      targetBar.mesh.position,
      {
        y: barPosition.y + 1.5,
        duration: 0.3,
        ease: "back.out(1.7)",
      },
      "-=0.2"
    );

    // Exit (faster)
    tl.to(
      [thief.position, targetBar.mesh.position],
      {
        x: 0,
        y: 12,
        z: 15,
        duration: 1.0,
        ease: "power3.in",
      },
      "-=0.1"
    );
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  const getWealthColor = (): string => {
    if (totalBars === 0) return "#ff4757";
    if (totalBars < 20) return "#ff9500";
    return "#ffd700";
  };

  const getWealthText = (): string => {
    if (totalBars === 0) return "BANKRUPT";
    return formatCurrency(totalBars * pricePerBar);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0f0f0f]">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top Bar - Wealth Display */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <div
          className="px-8 py-4 rounded-[20px] backdrop-blur-[20px]"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="text-center">
            <div
              className="text-xs uppercase tracking-[2px] mb-1"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}
            >
              VAULT SECURITY
            </div>
            <div className="text-[0.85rem] uppercase mb-2 opacity-80">
              Total Assets
            </div>
            <div
              className="text-[2.5rem] font-mono transition-colors duration-500"
              style={{
                color: getWealthColor(),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {getWealthText()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div
          className="px-6 py-3 rounded-[50px] backdrop-blur-[20px] flex items-center gap-4"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAnimating}
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
          >
            🍔
          </button>
          <button
            onClick={performHeist}
            disabled={isAnimating || totalBars === 0}
            className="px-6 py-2 rounded-full hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
            }}
          >
            Buy Meal ({formatCurrency(pricePerBar)})
          </button>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAnimating}
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
            title="History"
          >
            📋
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAnimating}
            style={{
              background: showSettings
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(255, 255, 255, 0.05)",
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div
          className="absolute bottom-8 right-8 z-10 px-6 py-4 rounded-lg backdrop-blur-[20px]"
          style={{
            background: "rgba(255, 71, 87, 0.9)",
            border: "2px solid #ffd700",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            animation: "notificationAppear 0.3s ease-out",
          }}
        >
          <div className="text-white font-bold text-lg">
            MCDONALD&apos;S RAID!
          </div>
          <div className="text-white/90 text-sm mt-1">
            -{formatCurrency(notificationAmount)}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div
          className="absolute top-20 right-8 z-20 p-6 rounded-[20px] backdrop-blur-[20px] min-w-[300px]"
          style={{
            background: "rgba(15, 15, 15, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="text-white mb-4 font-bold text-lg">Configuration</div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Shelf Rows: {shelfRows}
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={shelfRows}
                onChange={(e) => setShelfRows(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">
                Shelf Columns: {shelfCols}
              </label>
              <input
                type="range"
                min="4"
                max="16"
                value={shelfCols}
                onChange={(e) => setShelfCols(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">
                Total Gold Bars: {totalBars}
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={totalBars}
                onChange={(e) => setTotalBars(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">
                Price Per Bar (USD): ${pricePerBar}
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={pricePerBar}
                onChange={(e) => setPricePerBar(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="text-white/60 text-xs">
                Total Value: {formatCurrency(totalBars * pricePerBar)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        className="absolute bottom-8 left-8 z-10 text-sm"
        style={{
          color: "rgba(255, 255, 255, 0.3)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        CLICK & DRAG to rotate • SCROLL to zoom
      </div>

      <style jsx>{`
        @keyframes notificationAppear {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
