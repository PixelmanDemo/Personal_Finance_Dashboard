const FinanceScene = (() => {
  let renderer, scene, camera, group, knotMat, particleMat;
  let targetScale = 1;
  let currentScale = 1;
  let animId = null;
  let currentSpeed = 0.005;
  let targetSpeed = 0.005;
  let realBalance = 0;
  let currentColor = new THREE.Color(0x6366f1);
  let targetColor = new THREE.Color(0x6366f1);

  var COLORS = { indigo: 0x6366f1, amber: 0xf59e0b, crimson: 0xf43f5e };
  var HIGH = 400, MID = 150;

  function init(container) {
    if (!container) return;
    var w = container.clientWidth || 800;
    var h = container.clientHeight || 300;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);

    var knotGeo = new THREE.TorusKnotGeometry(1.2, 0.45, 128, 16);
    var edges = new THREE.EdgesGeometry(knotGeo);
    knotMat = new THREE.LineBasicMaterial({ color: COLORS.indigo, transparent: true, opacity: 0.7 });
    var knotLine = new THREE.LineSegments(edges, knotMat);

    var count = 600;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 7;
    }
    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleMat = new THREE.PointsMaterial({
      color: COLORS.indigo,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    var particles = new THREE.Points(particleGeo, particleMat);

    group = new THREE.Group();
    group.add(knotLine);
    group.add(particles);
    scene.add(group);

    animate();
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    currentColor.lerp(targetColor, 0.05);
    currentSpeed += (targetSpeed - currentSpeed) * 0.05;
    currentScale += (targetScale - currentScale) * 0.05;
    knotMat.color.copy(currentColor);
    particleMat.color.copy(currentColor);
    group.rotation.x += currentSpeed * 0.3;
    group.rotation.y += currentSpeed;
    group.scale.set(currentScale, currentScale, currentScale);
    renderer.render(scene, camera);
  }

  function applyState(balance) {
    var color, speed, scale;
    if (balance > HIGH) {
      color = COLORS.indigo;  speed = 0.005;  scale = 1.0;
    } else if (balance >= MID) {
      color = COLORS.amber;   speed = 0.0075; scale = 1.0;
    } else {
      color = COLORS.crimson; speed = 0.0125; scale = 0.85;
    }
    targetColor.setHex(color);
    targetSpeed = speed;
    targetScale = scale;
  }

  function setBalanceState(balance) {
    realBalance = balance;
    applyState(balance);
  }

  function setSimulatedState(simBalance) {
    var color, speed, scale;
    if (simBalance >= 300) {
      color = 0x22c55e;  speed = 0.005;  scale = 1.0;
    } else if (simBalance >= 100) {
      color = COLORS.amber;  speed = 0.0075; scale = 1.0;
    } else {
      color = 0xef4444;  speed = 0.0125; scale = 0.85;
    }
    targetColor.setHex(color);
    targetSpeed = speed;
    targetScale = scale;
  }

  function clearSimulation() {
    applyState(realBalance);
  }

  function resize() {
    var el = renderer && renderer.domElement && renderer.domElement.parentElement;
    if (!el) return;
    var w = el.clientWidth;
    var h = el.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
    if (renderer) { renderer.dispose(); renderer.domElement.remove(); }
  }

  return { init: init, setBalanceState: setBalanceState, setSimulatedState: setSimulatedState, clearSimulation: clearSimulation, resize: resize, destroy: destroy };
})();
