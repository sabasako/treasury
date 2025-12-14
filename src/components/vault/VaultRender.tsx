"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { PendingAnimationTransaction } from "@/app/vault/page";

interface SlotMesh extends THREE.Mesh {
  slotIndex?: number;
  slotPosition?: THREE.Vector3;
}

interface GoldBar {
  mesh: THREE.Mesh | THREE.Group;
  slotIndex: number;
  slot: THREE.Mesh;
}

// ============================================================================
// CONFIGURATION - Edit these constants to customize the vault
// ============================================================================
const SHELF_ROWS = 5;
const SHELF_COLS = 10;
const TOTAL_BARS = 200;
const BALANCE = 6000; // Current balance in USD (will be updated dynamically)
const THIEF_ENTRY_DURATION = 1.5; // Thief entry animation duration (seconds)
const THIEF_THEFT_DURATION = 0.6; // Bar theft animation duration (seconds)
const THIEF_EXIT_DURATION = 1.8; // Thief exit animation duration (seconds)
// ============================================================================

export default function VaultRender({
  modelPath,
  pricePerBar,
  notAnimatedTransactions = [],
}: {
  modelPath: string;
  pricePerBar: number;
  notAnimatedTransactions?: PendingAnimationTransaction[];
}) {
  //   const modelPath =
  //     Math.random() > 0.5 ? "/models/kfc.glb" : "/models/mcdonalds.glb";

  const containerRef = useRef<HTMLDivElement>(null);

  // Display state (doesn't trigger scene rebuild)
  const [currentBalance, setCurrentBalance] = useState(BALANCE); // Track balance in USD
  const [totalBars, setTotalBars] = useState(Math.floor(BALANCE / pricePerBar)); // Calculate from balance
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationAmount, setNotificationAmount] = useState(0);
  const [processedTransactionIds, setProcessedTransactionIds] = useState<
    Set<number>
  >(new Set());
  const isAnimatingRef = useRef(false); // Ref to track animation state for async operations
  const [sceneReady, setSceneReady] = useState(false); // Track when scene is initialized
  const [modelReady, setModelReady] = useState(false); // Track when 3D model is loaded

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
    thief?: THREE.Group;
    thiefModel?: THREE.Group; // Cached loaded model
    priceLabel?: THREE.Sprite; // Price label above thief
  } | null>(null);

  // Load thief model function
  const loadThiefModel = async (
    modelPath: string
  ): Promise<THREE.Group | null> => {
    if (!modelPath) return null;

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      console.log("Loading thief model from:", modelPath);
      loader.load(
        modelPath,
        (gltf) => {
          console.log("Model loaded successfully:", gltf);
          const model = gltf.scene.clone(); // Clone so we can reuse
          // Enable shadows on all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          // Scale model to appropriate size (adjust as needed)
          // Calculate bounding box to scale appropriately
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);
          const targetSize = 2; // Target size in units
          const scale = targetSize / maxDimension;
          model.scale.set(scale, scale, scale);
          console.log("Model scaled to:", scale, "Original size:", size);
          resolve(model);
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            console.log(
              "Model loading progress:",
              percentComplete.toFixed(2) + "%"
            );
          }
        },
        (error) => {
          console.error(
            "Error loading thief model from",
            modelPath,
            ":",
            error
          );
          reject(error);
        }
      );
    });
  };

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
    camera.position.set(0, 15, 25); // Further back (z: 25) and higher (y: 8)
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
      const cols = SHELF_COLS;
      const shelfWidth = 2.2; // Increased to fit larger slots
      const shelfDepth = 0.4; // Increased depth
      const slotWidth = 2.2; // Increased to fit larger bars
      const slotHeight = 0.45; // Increased height
      const slotDepth = 1.4; // Increased depth
      // Calculate spacing to fit within room height - ensure all rows are visible
      const bottomMargin = 0.5; // Space from floor
      const topMargin = 1.0; // Space from ceiling
      const availableHeight = roomHeight - bottomMargin - topMargin;
      // Fixed spacing for rows
      const verticalSpacing = availableHeight / (SHELF_ROWS - 1 || 1); // rows means (rows-1) gaps
      const horizontalSpacing = 1.8; // Increased spacing for larger bars
      const wallOffset = roomSize / 2 - 3.5; // Moved inward by 3 units
      const xPos = wallSide === "left" ? -wallOffset : wallOffset;

      const ledLights: THREE.PointLight[] = [];

      // Create rows based on configuration
      for (let row = 0; row < SHELF_ROWS; row++) {
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
      const cols = Math.floor(SHELF_COLS * 0.8); // Slightly fewer columns for middle
      const shelfWidth = 2.2; // Increased to fit larger slots
      const shelfDepth = 0.4; // Increased depth
      const slotWidth = 2.2; // Increased to fit larger bars
      const slotHeight = 0.45; // Increased height
      const slotDepth = 1.4; // Increased depth

      // Calculate spacing to fit within room height - ensure all rows are visible
      const bottomMargin = 0.5; // Space from floor
      const topMargin = 1.0; // Space from ceiling
      const availableHeight = roomHeight - bottomMargin - topMargin;
      // Fixed spacing for rows
      const verticalSpacing = availableHeight / (SHELF_ROWS - 1 || 1); // rows means (rows-1) gaps
      const horizontalSpacing = 1.8; // Increased spacing for larger bars
      const centerX = 0; // Middle of room

      // Center the shelves (not stuck to edges)
      const totalShelfWidth = (cols - 1) * horizontalSpacing;
      const startZ = -totalShelfWidth / 2; // Center the shelves

      // Create rows based on configuration
      for (let row = 0; row < SHELF_ROWS; row++) {
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

    // Gold bars - detailed design
    const goldBars: GoldBar[] = [];
    const initialBars = Math.floor(BALANCE / pricePerBar);
    const maxVisibleBars = Math.min(initialBars, TOTAL_BARS); // Don't exceed shelf capacity

    const createGoldBar = (position: THREE.Vector3): THREE.Group => {
      const barGroup = new THREE.Group();

      // Main bar dimensions
      const barWidth = 2.0;
      const barHeight = 0.8;
      const barDepth = 1.2;
      const bevelSize = 0.05; // Size of beveled edges

      // Base gold material
      const goldMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.12, 1.0, 0.5 + Math.random() * 0.1),
        metalness: 0.98,
        roughness: 0.15,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.08,
      });

      // Main body with beveled top edges
      const mainBody = new THREE.Mesh(
        new THREE.BoxGeometry(barWidth, barHeight - bevelSize * 2, barDepth),
        goldMaterial
      );
      mainBody.position.y = -bevelSize;
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      barGroup.add(mainBody);

      // Top face with beveled edges (trapezoid shape)
      const topFaceGeometry = new THREE.BufferGeometry();
      const topVertices = new Float32Array([
        // Bottom face vertices (wider)
        -barWidth / 2,
        barHeight / 2 - bevelSize,
        -barDepth / 2,
        barWidth / 2,
        barHeight / 2 - bevelSize,
        -barDepth / 2,
        barWidth / 2,
        barHeight / 2 - bevelSize,
        barDepth / 2,
        -barWidth / 2,
        barHeight / 2 - bevelSize,
        barDepth / 2,
        // Top face vertices (narrower - beveled)
        -barWidth / 2 + bevelSize,
        barHeight / 2,
        -barDepth / 2 + bevelSize,
        barWidth / 2 - bevelSize,
        barHeight / 2,
        -barDepth / 2 + bevelSize,
        barWidth / 2 - bevelSize,
        barHeight / 2,
        barDepth / 2 - bevelSize,
        -barWidth / 2 + bevelSize,
        barHeight / 2,
        barDepth / 2 - bevelSize,
      ]);
      topFaceGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(topVertices, 3)
      );

      // Create faces for the beveled top
      const topIndices = new Uint16Array([
        // Bottom face
        0, 1, 2, 0, 2, 3,
        // Top face
        4, 7, 6, 4, 6, 5,
        // Side faces (bevels)
        0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
      ]);
      topFaceGeometry.setIndex(new THREE.BufferAttribute(topIndices, 1));
      topFaceGeometry.computeVertexNormals();

      const topFace = new THREE.Mesh(topFaceGeometry, goldMaterial);
      topFace.castShadow = true;
      topFace.receiveShadow = true;
      barGroup.add(topFace);

      // Engraved details on top face - serial number and purity marks
      const engravingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.12, 0.8, 0.3), // Darker gold for engravings
        metalness: 0.9,
        roughness: 0.3,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.02,
      });

      // Serial number text area (simplified as a rectangle)
      const serialNumber = new THREE.Mesh(
        new THREE.PlaneGeometry(barWidth * 0.6, barHeight * 0.15),
        engravingMaterial
      );
      serialNumber.position.set(0, barHeight / 2 + 0.001, 0);
      serialNumber.rotation.x = -Math.PI / 2;
      barGroup.add(serialNumber);

      // Purity mark (999.9 or similar)
      const purityMark = new THREE.Mesh(
        new THREE.PlaneGeometry(barWidth * 0.3, barHeight * 0.1),
        engravingMaterial
      );
      purityMark.position.set(0, barHeight / 2 + 0.001, barDepth * 0.3);
      purityMark.rotation.x = -Math.PI / 2;
      barGroup.add(purityMark);

      // Weight mark
      const weightMark = new THREE.Mesh(
        new THREE.PlaneGeometry(barWidth * 0.3, barHeight * 0.1),
        engravingMaterial
      );
      weightMark.position.set(0, barHeight / 2 + 0.001, -barDepth * 0.3);
      weightMark.rotation.x = -Math.PI / 2;
      barGroup.add(weightMark);

      // Corner accents (small decorative elements)
      const cornerAccent = new THREE.Mesh(
        new THREE.BoxGeometry(bevelSize * 2, bevelSize, bevelSize * 2),
        engravingMaterial
      );
      for (let i = 0; i < 4; i++) {
        const corner = cornerAccent.clone();
        const angle = (i / 4) * Math.PI * 2;
        corner.position.set(
          Math.cos(angle) * (barWidth / 2 - bevelSize),
          barHeight / 2 - bevelSize / 2,
          Math.sin(angle) * (barDepth / 2 - bevelSize)
        );
        barGroup.add(corner);
      }

      // Add slight rotation variation for visual interest
      barGroup.rotation.y = (Math.random() - 0.5) * 0.1;
      barGroup.position.copy(position);
      barGroup.castShadow = true;
      barGroup.receiveShadow = true;

      return barGroup;
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

    // Preload thief model if path is provided
    if (modelPath) {
      console.log("Preloading thief model from:", modelPath);
      loadThiefModel(modelPath)
        .then((model) => {
          if (model && sceneRef.current) {
            sceneRef.current.thiefModel = model;
            setModelReady(true);
            console.log("✅ Thief model loaded and cached successfully");
          } else {
            console.error("Model loaded but sceneRef is null");
            // If sceneRef is null, mark as ready anyway (will use fallback)
            setModelReady(true);
          }
        })
        .catch((error) => {
          console.error("❌ Failed to load thief model:", error);
          // Mark as ready even if loading failed (will use fallback)
          setModelReady(true);
        });
    } else {
      console.log("No thief model path specified, using default primitive");
      // No model path means we'll use fallback, so mark as ready
      setModelReady(true);
    }

    // Mark scene as ready
    setSceneReady(true);
    console.log("Scene initialized and ready for transactions");

    // Don't override totalBars - keep it based on BALANCE
    // The actual bars created may be limited by shelf capacity, but balance should reflect actual balance

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Scene only builds once on mount - config is in constants above

  // Process transactions sequentially
  useEffect(() => {
    console.log("Transaction processing useEffect triggered", {
      sceneReady,
      modelReady,
      hasScene: !!sceneRef.current,
      transactionCount: notAnimatedTransactions?.length || 0,
      transactions: notAnimatedTransactions,
    });

    // Don't process if scene or model isn't ready yet
    if (!sceneReady || !modelReady || !sceneRef.current) {
      console.log("Waiting for scene/model to be ready...", {
        sceneReady,
        modelReady,
        hasScene: !!sceneRef.current,
      });
      return;
    }

    const processTransactions = async () => {
      const unprocessed = notAnimatedTransactions.filter(
        (tx) => !processedTransactionIds.has(tx.id)
      );

      if (unprocessed.length === 0) {
        console.log("No unprocessed transactions");
        return;
      }

      console.log(
        "Processing transactions:",
        unprocessed.length,
        "Scene ready:",
        sceneReady
      );

      for (const transaction of unprocessed) {
        // Wait for any ongoing animation to finish
        while (isAnimatingRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Mark as processed
        setProcessedTransactionIds((prev) => new Set(prev).add(transaction.id));

        console.log(
          "Starting heist for transaction:",
          transaction.id,
          "amount:",
          transaction.amount
        );

        // Perform heist with transaction amount
        await performHeist(transaction.amount);
      }
    };

    // Start processing transactions when scene is ready and transactions exist
    if (notAnimatedTransactions.length > 0) {
      console.log(
        "Transactions received:",
        notAnimatedTransactions.length,
        "Scene ready:",
        sceneReady
      );
      processTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notAnimatedTransactions, sceneReady, modelReady]);

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

  // Create price label sprite
  const createPriceLabel = (price: number): THREE.Sprite => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");

    // Set canvas size
    canvas.width = 256;
    canvas.height = 128;

    // Draw background
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    context.strokeStyle = "#ffd700";
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Draw text
    context.fillStyle = "#ffd700";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    const priceText = `$${price.toLocaleString()}`;
    context.fillText(priceText, canvas.width / 2, canvas.height / 2);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create sprite material
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
    });

    // Create sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1); // Adjust size as needed
    sprite.position.set(0, 2.5, 0); // Position above thief (relative to thief)

    return sprite;
  };

  const performHeist = (amount: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!sceneRef.current) {
        console.warn("Scene not ready for heist");
        resolve();
        return;
      }

      if (sceneRef.current.goldBars.length === 0) {
        console.warn("No gold bars available for heist");
        resolve();
        return;
      }

      console.log("Starting heist animation, amount:", amount);
      setIsAnimating(true);
      isAnimatingRef.current = true;
      const { scene, goldBars } = sceneRef.current;

      // Select random bar
      const randomIndex = Math.floor(Math.random() * goldBars.length);
      const targetBar = goldBars[randomIndex];
      const barPosition = targetBar.mesh.position.clone();

      // Create thief - use 3D model if available, otherwise use fallback
      let thief: THREE.Group;

      if (modelPath && sceneRef.current?.thiefModel) {
        // Use cached loaded model
        thief = sceneRef.current.thiefModel.clone();
        console.log("Using loaded 3D model for thief");
      } else if (modelPath) {
        // Model path is set but model not loaded yet - try loading now
        console.warn("Thief model not loaded yet, attempting to load now...");
        // Use fallback for now, but try to load for next time
        thief = createPrimitiveThief();
        loadThiefModel(modelPath)
          .then((model) => {
            if (model && sceneRef.current) {
              sceneRef.current.thiefModel = model;
              console.log("Thief model loaded successfully");
            }
          })
          .catch((error) => {
            console.error("Failed to load thief model:", error);
          });
      } else {
        // Use primitive fallback
        thief = createPrimitiveThief();
      }

      function createPrimitiveThief(): THREE.Group {
        const thiefGroup = new THREE.Group();

        // Body (main torso)
        const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          roughness: 0.7,
          metalness: 0.1,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0.6, 0);
        body.castShadow = true;
        thiefGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
          color: 0xffdbac,
          roughness: 0.8,
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.5, 0);
        head.castShadow = true;
        thiefGroup.add(head);

        // Left arm
        const leftArmGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const leftArm = new THREE.Mesh(leftArmGeometry, bodyMaterial);
        leftArm.position.set(-0.5, 0.6, 0);
        leftArm.castShadow = true;
        thiefGroup.add(leftArm);

        // Right arm
        const rightArmGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const rightArm = new THREE.Mesh(rightArmGeometry, bodyMaterial);
        rightArm.position.set(0.5, 0.6, 0);
        rightArm.castShadow = true;
        thiefGroup.add(rightArm);

        // Left leg
        const leftLegGeometry = new THREE.BoxGeometry(0.25, 0.9, 0.25);
        const leftLeg = new THREE.Mesh(leftLegGeometry, bodyMaterial);
        leftLeg.position.set(-0.2, -0.45, 0);
        leftLeg.castShadow = true;
        thiefGroup.add(leftLeg);

        // Right leg
        const rightLegGeometry = new THREE.BoxGeometry(0.25, 0.9, 0.25);
        const rightLeg = new THREE.Mesh(rightLegGeometry, bodyMaterial);
        rightLeg.position.set(0.2, -0.45, 0);
        rightLeg.castShadow = true;
        thiefGroup.add(rightLeg);

        const badgeGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        const badgeMaterial = new THREE.MeshStandardMaterial({
          color: 0xffc72c,
          emissive: 0xffc72c,
          emissiveIntensity: 0.5,
          side: THREE.DoubleSide,
        });
        const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
        badge.position.set(0, 0.6, 0.21);
        badge.rotation.x = -Math.PI / 2;
        thiefGroup.add(badge);

        // Add simple M symbol (using boxes to form an M shape)
        const mPart1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.15, 0.01),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        mPart1.position.set(-0.08, 0.6, 0.22);
        thiefGroup.add(mPart1);

        const mPart2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.15, 0.01),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        mPart2.position.set(0.08, 0.6, 0.22);
        thiefGroup.add(mPart2);

        const mPart3 = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.02, 0.01),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        mPart3.position.set(0, 0.52, 0.22);
        mPart3.rotation.z = Math.PI / 4;
        thiefGroup.add(mPart3);

        return thiefGroup;
      }

      // Model should be preloaded in useEffect, but if not, log a warning
      if (modelPath && !sceneRef.current?.thiefModel) {
        console.warn(
          "Thief model not yet loaded, using fallback. Model may still be loading."
        );
      }

      thief.position.set(0, 8, 10);
      thief.castShadow = true;
      scene.add(thief);

      // Create and add price label above thief (use transaction amount)
      const priceLabel = createPriceLabel(amount);
      priceLabel.position.set(0, 8 + 2.5, 10); // Position above thief
      scene.add(priceLabel);

      if (sceneRef.current) {
        sceneRef.current.thief = thief;
        sceneRef.current.priceLabel = priceLabel;
      }

      // Show notification
      setNotificationAmount(amount);
      setShowNotification(true);

      // Activate emergency mode
      setEmergencyMode(true);

      // Animation timeline
      const tl = gsap.timeline({
        onComplete: () => {
          // Remove thief, price label, and bar
          scene.remove(thief);
          if (priceLabel) scene.remove(priceLabel);
          scene.remove(targetBar.mesh);
          delete sceneRef.current!.thief;
          delete sceneRef.current!.priceLabel;

          // Remove from array
          goldBars.splice(randomIndex, 1);

          // Update UI - subtract exact amount from balance, then recalculate bars
          setCurrentBalance((prevBalance) => {
            const newBalance = Math.max(0, prevBalance - amount);
            const newBars = Math.floor(newBalance / pricePerBar);
            setTotalBars(newBars);
            return newBalance;
          });

          // Restore normal mode
          setEmergencyMode(false);
          setShowNotification(false);
          setIsAnimating(false);
          isAnimatingRef.current = false;

          // Resolve promise to continue with next transaction
          resolve();
        },
      });

      // Thief entry (slower) - animate thief and price label together
      const thiefPos = {
        x: thief.position.x,
        y: thief.position.y,
        z: thief.position.z,
      };
      tl.to(thiefPos, {
        x: barPosition.x,
        y: barPosition.y + 1,
        z: barPosition.z,
        duration: THIEF_ENTRY_DURATION,
        ease: "power2.out",
        onUpdate: function () {
          thief.position.set(thiefPos.x, thiefPos.y, thiefPos.z);
          priceLabel.position.set(thiefPos.x, thiefPos.y + 2.5, thiefPos.z);
        },
      });

      // Bar theft (slower)
      tl.to(
        targetBar.mesh.position,
        {
          y: barPosition.y + 1.5,
          duration: THIEF_THEFT_DURATION,
          ease: "back.out(1.7)",
        },
        "-=0.3"
      );

      // Exit (slower) - animate thief, price label, and bar together
      tl.to(
        thiefPos,
        {
          x: 0,
          y: 12,
          z: 15,
          duration: THIEF_EXIT_DURATION,
          ease: "power3.in",
          onUpdate: function () {
            thief.position.set(thiefPos.x, thiefPos.y, thiefPos.z);
            priceLabel.position.set(thiefPos.x, thiefPos.y + 2.5, thiefPos.z);
          },
        },
        "-=0.2"
      );

      // Also animate the bar position
      tl.to(
        targetBar.mesh.position,
        {
          x: 0,
          y: 12,
          z: 15,
          duration: THIEF_EXIT_DURATION,
          ease: "power3.in",
        },
        "-=" + THIEF_EXIT_DURATION
      );
    });
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  const getWealthColor = (): string => {
    if (currentBalance <= 0) return "#ff4757";
    const barsValue = 20 * pricePerBar; // 20 bars worth
    if (currentBalance < barsValue) return "#ff9500";
    return "#ffd700";
  };

  const getWealthText = (): string => {
    if (currentBalance <= 0) return "BANKRUPT";
    return formatCurrency(currentBalance);
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
            onClick={() => performHeist(pricePerBar)}
            disabled={isAnimating || totalBars === 0}
            className="px-6 py-2 rounded-full hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        </div>
      </div>

      {/* Notification */}
      {/* {showNotification && (
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
            {raider}&apos;s RAID!
          </div>
          <div className="text-white/90 text-sm mt-1">
            -{formatCurrency(notificationAmount)}
          </div>
        </div>
      )} */}

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
