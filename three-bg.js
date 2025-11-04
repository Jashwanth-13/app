
// Subtle 3D animated background using Three.js
const canvas = document.getElementById('bg3d');
if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Gradient fog for depth
  scene.fog = new THREE.FogExp2(0x0b1020, 0.06);

  // Lights
  const aLight = new THREE.AmbientLight(0x8898ff, 0.6);
  const pLight = new THREE.PointLight(0x2575fc, 1.2);
  pLight.position.set(4, 3, 5);
  scene.add(aLight, pLight);

  // Particles
  const particleCount = 280;
  const geom = new THREE.SphereGeometry(0.015, 8, 8);
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x2575fc, emissive: 0x0e2a66 }),
    new THREE.MeshStandardMaterial({ color: 0x6a11cb, emissive: 0x2b0a6a }),
    new THREE.MeshStandardMaterial({ color: 0xee0979, emissive: 0x5a0835 })
  ];
  const group = new THREE.Group();
  for (let i = 0; i < particleCount; i++) {
    const m = mats[i % mats.length];
    const s = new THREE.Mesh(geom, m);
    s.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 8
    );
    group.add(s);
  }
  scene.add(group);

  // Soft wave plane
  const planeGeo = new THREE.PlaneGeometry(16, 10, 48, 32);
  const planeMat = new THREE.MeshStandardMaterial({
    color: 0x0f1731, side: THREE.DoubleSide, wireframe: true, opacity: 0.18, transparent: true
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2.6;
  plane.position.z = -2;
  scene.add(plane);

  camera.position.set(0, 0.6, 4);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.004;

    // Wave deformation
    const pos = plane.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const z = Math.sin(x * 0.4 + t) * 0.12 + Math.cos(y * 0.6 + t * 0.8) * 0.1;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    plane.geometry.computeVertexNormals();

    // Particle drift
    group.children.forEach((p, i) => {
      p.position.y += Math.sin(t + i) * 0.0008;
      p.position.x += Math.cos(t * 0.5 + i) * 0.0006;
      p.rotation.y += 0.003;
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
