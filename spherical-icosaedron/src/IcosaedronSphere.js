import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";

const SphericalIcosahedron = () => {
  const radius = 2;

  // Convert degrees to radians
  const degreeToRadians = (deg) => (deg * Math.PI) / 180;

  // Function to apply slight random distortion
  const applyDistortion = (value, distortionFactor = 0.1) => {
    const randomDistortion = (Math.random() - 0.5) * distortionFactor * 2; // Distortion range: [-distortionFactor, distortionFactor]
    return value + randomDistortion;
  };

  // Calculate cartographic coordinates (latitude, longitude) dynamically with distortion
  const calculateVertices = () => {
    const goldenAngle = 26.57;
    const vertices = [
      { latitude: 90, longitude: 0 }, // North Pole
      { latitude: -90, longitude: 0 }, // South Pole
    ];

    // Add the first equatorial band
    for (let i = 0; i < 5; i++) {
      vertices.push({ latitude: goldenAngle, longitude: i * 72 });
    }

    // Add the second equatorial band
    for (let i = 0; i < 5; i++) {
      vertices.push({ latitude: -goldenAngle, longitude: i * 72 + 36 });
    }

    return vertices.map(({ latitude, longitude }) => {
      // Apply distortion to latitude and longitude
      latitude = applyDistortion(latitude);
      longitude = applyDistortion(longitude);

      const latRad = degreeToRadians(latitude);
      const lonRad = degreeToRadians(longitude);
      const x = Math.cos(latRad) * Math.cos(lonRad) * radius;
      const y = Math.sin(latRad) * radius;
      const z = Math.cos(latRad) * Math.sin(lonRad) * radius;
      return [x, y, z];
    });
  };

  // Convert calculated latitude and longitude to Cartesian coordinates
  const vertices = calculateVertices();

  // Define edges (connections between vertices)
  const edges = [
    [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 7], [1, 8], [1, 9], [1, 10], [1, 11],
    [2, 3], [3, 4], [4, 5], [5, 6], [6, 2],
    [7, 8], [8, 9], [9, 10], [10, 11], [11, 7],
    [2, 7], [3, 8], [4, 9], [5, 10], [6, 11], [3, 7],
    [2, 11], [6, 10], [5, 9], [4, 8],
  ];

  // Generate a great circle arc between two points
  const generateGreatCircle = (start, end, segments = 64) => {
    const startVec = new THREE.Vector3(...start).normalize();
    const endVec = new THREE.Vector3(...end).normalize();
    const axis = new THREE.Vector3().crossVectors(startVec, endVec).normalize();
    const angle = startVec.angleTo(endVec);
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle * t);
      const point = startVec.clone().applyMatrix4(rotationMatrix).multiplyScalar(radius);
      points.push(point.toArray());
    }

    return points;
  };

  // Create grid lines for latitude and longitude
  const generateGridLines = () => {
    const gridLines = [];
    const latitudes = [-60, -30, 0, 30, 60]; // Latitude lines
    const longitudes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]; // Longitude lines

    // Longitude lines (from North to South)
    longitudes.forEach((longitude) => {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 10) {
        const latRad = degreeToRadians(lat);
        const lonRad = degreeToRadians(longitude);
        const x = Math.cos(latRad) * Math.cos(lonRad) * radius;
        const y = Math.sin(latRad) * radius;
        const z = Math.cos(latRad) * Math.sin(lonRad) * radius;
        points.push([x, y, z]);
      }
      gridLines.push(points);
    });

    // Latitude lines (constant latitudes)
    latitudes.forEach((latitude) => {
      const points = [];
      for (let lon = 0; lon < 360; lon += 10) {
        const latRad = degreeToRadians(latitude);
        const lonRad = degreeToRadians(lon);
        const x = Math.cos(latRad) * Math.cos(lonRad) * radius;
        const y = Math.sin(latRad) * radius;
        const z = Math.cos(latRad) * Math.sin(lonRad) * radius;
        points.push([x, y, z]);
      }
      gridLines.push(points);
    });

    return gridLines;
  };

  const gridLines = generateGridLines();

  return (
    <Canvas style={{ height: "100vh", background: "#222" }}>
      {/* Render the sphere */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>

      {/* Render grid lines */}
      {gridLines.map((linePoints, index) => (
        <Line
          key={`grid-line-${index}`}
          points={linePoints}
          color="white"
          lineWidth={1}
        />
      ))}

      {/* Render the edges */}
      {edges.map(([startIndex, endIndex], index) => {
        const start = vertices[startIndex];
        const end = vertices[endIndex];
        const points = generateGreatCircle(start, end);
        return (
          <Line
            key={`line-${index}`}
            points={points}
            color="blue"
            lineWidth={2}
          />
        );
      })}

      {/* Render vertices */}
      {vertices.map(([x, y, z], index) => (
        <>
          {/* Small spheres to represent vertices */}
          <mesh key={`vertex-${index}`} position={[x, y, z]}>
            <sphereGeometry args={[0.05]} />
            <meshStandardMaterial color="blue" />
          </mesh>

          {/* Labels for vertices */}
          <Text
            key={`label-${index}`}
            position={[x * 1.1, y * 1.1, z * 1.1]} // Offset text slightly
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {index === 0 ? "N (0)" : index === 1 ? "S (1)" : index}
          </Text>
        </>
      ))}

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <OrbitControls enablePan={true} enableZoom={true} />
    </Canvas>
  );
};

export default SphericalIcosahedron;
