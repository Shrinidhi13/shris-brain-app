(function () {
  "use strict";

  const APP_BUILD = "2026.07.12-brain-r2";
  const profile = window.SHRI_PROFILE;
  console.info(`Shri's Stock Brain build ${APP_BUILD}.`);
  const scoring = window.ShriScoring;
  const state = {
    uploadedData: null,
    currentRaw: null,
    currentResult: null,
    brainGraph: null,
    defaultWeights: JSON.parse(JSON.stringify(profile.weights))
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch (_) {
      return null;
    }
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function toast(message, type = "info") {
    const previous = $(".toast");
    if (previous) previous.remove();
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("visible"));
    window.setTimeout(() => {
      el.classList.remove("visible");
      window.setTimeout(() => el.remove(), 280);
    }, 3600);
  }

  function loadSavedPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem("shriBrainWeights") || "null");
      if (saved && typeof saved === "object") Object.assign(profile.weights, saved);
      const key = localStorage.getItem("shriBrainAlphaKey");
      if (key) {
        $("#apiKey").value = key;
        $("#rememberKey").checked = true;
      }
    } catch (error) {
      console.warn("Could not load local preferences", error);
    }
  }

  function initializeReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(item => item.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    items.forEach(item => observer.observe(item));
  }

  function initializeHeader() {
    const header = $(".site-header");
    const update = () => header.classList.toggle("scrolled", window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    $$('[data-scroll]').forEach(button => button.addEventListener("click", () => {
      const target = $(button.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  function initializeCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const glow = $("#cursorGlow");
    const dot = $("#cursorDot");
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let glowX = targetX;
    let glowY = targetY;

    window.addEventListener("pointermove", event => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.left = `${targetX}px`;
      dot.style.top = `${targetY}px`;
      glow.style.opacity = "1";
      dot.style.opacity = "1";
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      glow.style.opacity = "0";
      dot.style.opacity = "0";
    });

    function animate() {
      glowX += (targetX - glowX) * 0.12;
      glowY += (targetY - glowY) * 0.12;
      glow.style.left = `${glowX}px`;
      glow.style.top = `${glowY}px`;
      requestAnimationFrame(animate);
    }
    animate();
  }

  function initializeCardEffects() {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener("pointermove", event => {
        if (window.matchMedia("(pointer: coarse)").matches) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform = `perspective(1200px) rotateX(${(0.5 - y) * 2.4}deg) rotateY(${(x - 0.5) * 3.2}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    $$(".glass-card").forEach(card => card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    }));

    if (!window.matchMedia("(pointer: coarse)").matches) {
      $$(".magnetic").forEach(element => {
        element.addEventListener("pointermove", event => {
          const rect = element.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
        });
        element.addEventListener("pointerleave", () => { element.style.transform = ""; });
      });
    }
  }

  function initializeAmbientCanvas() {
    const canvas = $("#ambientCanvas");
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let pointer = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(76, Math.max(34, Math.floor((width * height) / 26000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.3 + 0.3,
        tone: Math.random() > 0.72 ? "lime" : "blue"
      }));
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", event => { pointer = { x: event.clientX, y: event.clientY }; }, { passive: true });
    resize();

    function frame() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;
        const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
        if (pointerDistance < 160) {
          const force = (160 - pointerDistance) / 1600;
          particle.x += (particle.x - pointer.x) * force;
          particle.y += (particle.y - pointer.y) * force;
        }
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = particle.tone === "lime" ? "rgba(183,255,90,.28)" : "rgba(90,247,255,.17)";
        ctx.fill();
        for (let j = index + 1; j < particles.length; j += 1) {
          const other = particles[j];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance < 105) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(130,180,190,${0.045 * (1 - distance / 105)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  function initializeBrainGraph() {
    const canvas = $("#brainCanvas");
    const wrapper = canvas.parentElement;
    const tooltip = $("#brainTooltip");
    const ctx = canvas.getContext("2d");
    const clusterById = Object.fromEntries(profile.clusters.map(cluster => [cluster.id, cluster]));
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pointer = { x: -9999, y: -9999 };
    let hovered = null;
    let pinned = null;
    let time = 0;

    const clusterLayout = {
      quality: [0.32, 0.22],
      financial: [0.68, 0.2],
      capex: [0.82, 0.48],
      cyclical: [0.68, 0.78],
      turnaround: [0.32, 0.8],
      special: [0.16, 0.55],
      diversifier: [0.5, 0.9]
    };

    const nodes = [{ id: "shri", type: "core", label: "SHRI", x: 0, y: 0, r: 46, color: "#b7ff5a" }];
    profile.clusters.forEach(cluster => {
      const [px, py] = clusterLayout[cluster.id] || [Math.random(), Math.random()];
      nodes.push({ id: `cluster-${cluster.id}`, type: "cluster", cluster: cluster.id, label: cluster.label, px, py, r: 12, color: cluster.accent, description: cluster.description });
    });
    profile.holdings.forEach((holding, index) => {
      const clusterHoldings = profile.holdings.filter(item => item.cluster === holding.cluster);
      const localIndex = clusterHoldings.findIndex(item => item.symbol === holding.symbol);
      const angle = (localIndex / Math.max(1, clusterHoldings.length)) * Math.PI * 2 + index * 0.13;
      const radius = 55 + (localIndex % 2) * 25;
      nodes.push({
        id: `holding-${holding.symbol}`,
        type: "holding",
        cluster: holding.cluster,
        label: holding.symbol,
        name: holding.name,
        status: holding.status,
        signal: holding.signal,
        traits: holding.traits,
        thesis: holding.thesis,
        angle,
        orbit: radius,
        r: 5 + holding.signal * 5,
        color: clusterById[holding.cluster].accent
      });
    });

    const edges = [];
    profile.clusters.forEach(cluster => edges.push(["shri", `cluster-${cluster.id}`]));
    profile.holdings.forEach(holding => edges.push([`cluster-${holding.cluster}`, `holding-${holding.symbol}`]));

    function resize() {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      updatePositions();
    }

    function updatePositions() {
      const centerX = width * 0.5;
      const centerY = height * 0.47;
      nodes.forEach(node => {
        if (node.type === "core") {
          node.x = centerX;
          node.y = centerY;
        } else if (node.type === "cluster") {
          node.x = width * node.px;
          node.y = height * node.py;
        } else {
          const cluster = nodes.find(item => item.id === `cluster-${node.cluster}`);
          const scale = Math.min(width, height) / 520;
          node.x = cluster.x + Math.cos(node.angle) * node.orbit * scale;
          node.y = cluster.y + Math.sin(node.angle) * node.orbit * 0.72 * scale;
        }
      });
    }

    function displayTooltip(node, clientX, clientY) {
      if (!node || node.type === "core") {
        tooltip.classList.remove("visible");
        return;
      }
      let html = "";
      if (node.type === "cluster") {
        html = `<strong>${escapeHtml(node.label)}</strong><span>Philosophy cluster</span><small>${escapeHtml(node.description)}</small>`;
      } else {
        const status = node.status === "realised" ? "Realised winner · user-reported" : node.status === "inherited" ? "Inherited / corporate action" : node.status === "context" ? "Context-only signal" : "Current calibration holding";
        html = `<strong>${escapeHtml(node.name)}</strong><span>${escapeHtml(status)}</span><small>${escapeHtml(node.thesis)}</small>`;
      }
      tooltip.innerHTML = html;
      const wrapRect = wrapper.getBoundingClientRect();
      const localX = (clientX ?? (wrapRect.left + node.x)) - wrapRect.left;
      const localY = (clientY ?? (wrapRect.top + node.y)) - wrapRect.top;
      const tooltipWidth = Math.min(280, Math.max(180, width - 24));
      const left = Math.max(12, Math.min(width - tooltipWidth - 12, localX + 16));
      const top = Math.max(12, Math.min(height - 160, localY - 30));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.classList.add("visible");
    }

    function hitTest(x, y) {
      let best = null;
      let bestDistance = Infinity;
      nodes.forEach(node => {
        const distance = Math.hypot(x - node.x, y - node.y);
        const hitRadius = node.r + (node.type === "cluster" ? 14 : 9);
        if (distance < hitRadius && distance < bestDistance) {
          best = node;
          bestDistance = distance;
        }
      });
      return best;
    }

    canvas.addEventListener("pointermove", event => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      hovered = hitTest(pointer.x, pointer.y);
      canvas.style.cursor = hovered && hovered.type !== "core" ? "pointer" : "default";
      if (hovered && !pinned) displayTooltip(hovered, event.clientX, event.clientY);
      else if (!pinned) tooltip.classList.remove("visible");
    });

    canvas.addEventListener("pointerleave", () => {
      pointer = { x: -9999, y: -9999 };
      hovered = null;
      if (!pinned) tooltip.classList.remove("visible");
    });

    canvas.addEventListener("click", event => {
      const rect = canvas.getBoundingClientRect();
      const node = hitTest(event.clientX - rect.left, event.clientY - rect.top);
      if (node && node.type !== "core") {
        pinned = pinned === node ? null : node;
        if (pinned) displayTooltip(pinned, event.clientX, event.clientY);
        else tooltip.classList.remove("visible");
      } else {
        pinned = null;
        tooltip.classList.remove("visible");
      }
    });

    function draw() {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);
      updatePositions();

      edges.forEach(([aId, bId], index) => {
        const a = nodes.find(node => node.id === aId);
        const b = nodes.find(node => node.id === bId);
        if (!a || !b) return;
        const active = [hovered, pinned].some(node => node && (node.id === a.id || node.id === b.id || (node.cluster && (node.cluster === a.cluster || node.cluster === b.cluster))));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const mx = (a.x + b.x) / 2 + Math.sin(time + index) * 4;
        const my = (a.y + b.y) / 2 + Math.cos(time * 0.8 + index) * 4;
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.strokeStyle = active ? "rgba(183,255,90,.36)" : "rgba(130,170,180,.11)";
        ctx.lineWidth = active ? 1.25 : 0.7;
        ctx.stroke();

        const pulse = (time * 0.18 + index * 0.071) % 1;
        const oneMinus = 1 - pulse;
        const px = oneMinus * oneMinus * a.x + 2 * oneMinus * pulse * mx + pulse * pulse * b.x;
        const py = oneMinus * oneMinus * a.y + 2 * oneMinus * pulse * my + pulse * pulse * b.y;
        ctx.beginPath();
        ctx.arc(px, py, active ? 2.2 : 1.25, 0, Math.PI * 2);
        ctx.fillStyle = active ? "rgba(183,255,90,.8)" : "rgba(90,247,255,.25)";
        ctx.fill();
      });

      nodes.forEach((node, index) => {
        const floatY = node.type === "holding" ? Math.sin(time * 1.4 + index) * 2 : Math.sin(time + index) * 1.3;
        const x = node.x;
        const y = node.y + floatY;
        const active = node === hovered || node === pinned;
        const near = Math.hypot(pointer.x - x, pointer.y - y) < 80;

        if (node.type === "core") {
          const scale = (width < 560 ? 0.83 : 1) * (1 + Math.sin(time * 1.15) * 0.018);
          const pulse = (Math.sin(time * 2.1) + 1) / 2;

          const traceBrain = () => {
            ctx.beginPath();
            ctx.moveTo(x, y - 34 * scale);
            ctx.bezierCurveTo(x + 6 * scale, y - 43 * scale, x + 17 * scale, y - 43 * scale, x + 22 * scale, y - 33 * scale);
            ctx.bezierCurveTo(x + 32 * scale, y - 36 * scale, x + 41 * scale, y - 27 * scale, x + 38 * scale, y - 17 * scale);
            ctx.bezierCurveTo(x + 48 * scale, y - 13 * scale, x + 49 * scale, y, x + 41 * scale, y + 6 * scale);
            ctx.bezierCurveTo(x + 45 * scale, y + 17 * scale, x + 37 * scale, y + 29 * scale, x + 26 * scale, y + 28 * scale);
            ctx.bezierCurveTo(x + 24 * scale, y + 37 * scale, x + 13 * scale, y + 40 * scale, x + 7 * scale, y + 33 * scale);
            ctx.bezierCurveTo(x + 4 * scale, y + 38 * scale, x - 4 * scale, y + 38 * scale, x - 7 * scale, y + 33 * scale);
            ctx.bezierCurveTo(x - 13 * scale, y + 40 * scale, x - 24 * scale, y + 37 * scale, x - 26 * scale, y + 28 * scale);
            ctx.bezierCurveTo(x - 37 * scale, y + 29 * scale, x - 45 * scale, y + 17 * scale, x - 41 * scale, y + 6 * scale);
            ctx.bezierCurveTo(x - 49 * scale, y, x - 48 * scale, y - 13 * scale, x - 38 * scale, y - 17 * scale);
            ctx.bezierCurveTo(x - 41 * scale, y - 27 * scale, x - 32 * scale, y - 36 * scale, x - 22 * scale, y - 33 * scale);
            ctx.bezierCurveTo(x - 17 * scale, y - 43 * scale, x - 6 * scale, y - 43 * scale, x, y - 34 * scale);
            ctx.closePath();
          };

          const halo = ctx.createRadialGradient(x, y, 7, x, y, 88);
          halo.addColorStop(0, `rgba(183,255,90,${0.24 + pulse * 0.08})`);
          halo.addColorStop(0.45, "rgba(80,255,167,.08)");
          halo.addColorStop(1, "rgba(183,255,90,0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(x, y, 84 + Math.sin(time) * 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.shadowColor = "rgba(183,255,90,.85)";
          ctx.shadowBlur = 18 + pulse * 8;
          traceBrain();
          const brainFill = ctx.createLinearGradient(x, y - 45 * scale, x, y + 42 * scale);
          brainFill.addColorStop(0, "rgba(213,255,139,.95)");
          brainFill.addColorStop(0.42, "rgba(116,245,108,.82)");
          brainFill.addColorStop(1, "rgba(24,116,74,.92)");
          ctx.fillStyle = brainFill;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(211,255,157,.95)";
          ctx.lineWidth = 1.55;
          ctx.stroke();

          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "rgba(8,62,43,.72)";
          ctx.lineWidth = 2.1 * scale;

          const fold = points => {
            ctx.beginPath();
            ctx.moveTo(x + points[0][0] * scale, y + points[0][1] * scale);
            for (let i = 1; i < points.length; i += 3) {
              ctx.bezierCurveTo(
                x + points[i][0] * scale, y + points[i][1] * scale,
                x + points[i + 1][0] * scale, y + points[i + 1][1] * scale,
                x + points[i + 2][0] * scale, y + points[i + 2][1] * scale
              );
            }
            ctx.stroke();
          };

          fold([[0,-31],[-3,-19],[-3,-5],[0,2],[3,10],[3,22],[0,30]]);
          fold([[-10,-34],[-17,-26],[-18,-18],[-12,-12],[-27,-13],[-31,-5],[-22,2]]);
          fold([[-35,-14],[-25,-18],[-17,-12],[-16,-4],[-31,1],[-31,12],[-21,15]]);
          fold([[-34,12],[-23,8],[-14,15],[-16,25],[-12,29],[-8,29],[-5,23]]);
          fold([[-21,-31],[-15,-23],[-8,-22],[-7,-14],[-5,-9],[-7,-3],[-13,1]]);
          fold([[10,-34],[17,-26],[18,-18],[12,-12],[27,-13],[31,-5],[22,2]]);
          fold([[35,-14],[25,-18],[17,-12],[16,-4],[31,1],[31,12],[21,15]]);
          fold([[34,12],[23,8],[14,15],[16,25],[12,29],[8,29],[5,23]]);
          fold([[21,-31],[15,-23],[8,-22],[7,-14],[5,-9],[7,-3],[13,1]]);

          ctx.strokeStyle = "rgba(235,255,202,.48)";
          ctx.lineWidth = 0.9 * scale;
          fold([[-29,-20],[-23,-25],[-17,-24],[-14,-19]]);
          fold([[29,-20],[23,-25],[17,-24],[14,-19]]);

          const signalY = y - 23 * scale + pulse * 45 * scale;
          ctx.shadowColor = "rgba(241,255,213,.95)";
          ctx.shadowBlur = 12;
          ctx.fillStyle = "#efffd2";
          ctx.beginPath();
          ctx.arc(x, signalY, 1.8 + pulse * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgba(5,26,19,.82)";
          ctx.font = `800 ${width < 560 ? 7 : 8}px system-ui`;
          ctx.fillText("SHRI", x, y + 2);
          ctx.fillStyle = "rgba(4,37,25,.7)";
          ctx.font = `700 ${width < 560 ? 5 : 5.5}px system-ui`;
          ctx.fillText("BRAIN", x, y + 11);
          ctx.restore();
          return;
        }

        if (node.type === "cluster") {
          ctx.beginPath();
          ctx.arc(x, y, node.r + (active ? 4 : 0), 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}20`;
          ctx.fill();
          ctx.strokeStyle = active ? node.color : `${node.color}80`;
          ctx.lineWidth = active ? 1.7 : 1;
          ctx.stroke();
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = active ? "#f4f7ef" : "rgba(244,247,239,.65)";
          ctx.font = `${active ? 650 : 550} ${width < 560 ? 8 : 9}px system-ui`;
          ctx.textAlign = "center";
          ctx.fillText(node.label.toUpperCase(), x, y + 27);
          return;
        }

        const radius = node.r + (active || near ? 2.5 : 0);
        ctx.beginPath();
        ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
        ctx.fillStyle = active ? `${node.color}1f` : `${node.color}08`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.status === "realised" ? "rgba(7,10,15,.9)" : `${node.color}55`;
        ctx.fill();
        ctx.strokeStyle = node.status === "realised" ? node.color : active ? "#f4f7ef" : `${node.color}bb`;
        ctx.lineWidth = node.status === "realised" ? 1.3 : active ? 1.4 : 0.8;
        if (node.status === "realised") ctx.setLineDash([2.5, 2.5]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (active || near || width > 620) {
          ctx.fillStyle = active ? "#f4f7ef" : "rgba(244,247,239,.62)";
          ctx.font = `${active ? 650 : 500} ${width < 560 ? 7 : 8}px system-ui`;
          ctx.textAlign = "center";
          ctx.fillText(node.label, x, y + radius + 14);
        }
      });
      requestAnimationFrame(draw);
    }

    function focusSymbol(symbol) {
      const node = nodes.find(item => item.id === `holding-${symbol}` || item.id === `cluster-${symbol}`);
      if (!node) return;
      pinned = node;
      const rect = wrapper.getBoundingClientRect();
      displayTooltip(node, rect.left + node.x, rect.top + node.y);
      $("#brain").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    async function tour() {
      const sequence = ["KTKBANK", "GESHIP", "IRB", "CHOLAFIN", "CIPLA", "TMPV", "VALORESTATE"];
      for (const symbol of sequence) {
        focusSymbol(symbol);
        await new Promise(resolve => window.setTimeout(resolve, 1150));
      }
      pinned = null;
      tooltip.classList.remove("visible");
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
    state.brainGraph = { focusSymbol, tour };
  }

  function renderProfile() {
    $("#profileConfidence").textContent = `${profile.confidence}%`;
    $("#profileName").textContent = profile.name;
    $("#profileNote").textContent = profile.note;

    $("#clusterLegend").innerHTML = profile.clusters.map(cluster => (
      `<span class="legend-item" style="color:${cluster.accent}"><i></i><span>${escapeHtml(cluster.label)}</span></span>`
    )).join("");

    const traitLabels = {
      valuation: "Valuation comfort",
      catalyst: "Catalyst / rerating",
      tangible: "Tangible assets",
      indiaTailwind: "India tailwind",
      balanceSheet: "Balance-sheet resilience",
      improvement: "Operating improvement",
      quality: "Fundamental quality",
      assetBacking: "Cash returns / asset backing",
      diversification: "Diversification"
    };

    $("#traitBars").innerHTML = Object.entries(profile.weights).map(([key, value]) => (
      `<div class="trait-row"><span>${escapeHtml(traitLabels[key] || key)}</span><div class="trait-track"><div class="trait-fill" data-width="${value}"></div></div><strong>${value}</strong></div>`
    )).join("");
    requestAnimationFrame(() => $$(".trait-fill").forEach(fill => { fill.style.width = `${fill.dataset.width}%`; }));

    $("#clusterBoard").innerHTML = profile.clusters.map(cluster => {
      const holdings = profile.holdings.filter(holding => holding.cluster === cluster.id);
      return `<div class="cluster-line" style="--cluster-color:${cluster.accent}"><i></i><strong>${escapeHtml(cluster.label)}</strong><div class="cluster-holdings">${holdings.map(holding => `<button data-focus-symbol="${escapeHtml(holding.symbol)}" title="${escapeHtml(holding.thesis)}">${escapeHtml(holding.symbol)}</button>`).join("")}</div></div>`;
    }).join("");
    $$('[data-focus-symbol]').forEach(button => button.addEventListener("click", () => state.brainGraph?.focusSymbol(button.dataset.focusSymbol)));

    $("#biasList").innerHTML = profile.biasGuard.map((item, index) => (
      `<div class="bias-item"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></div></div>`
    )).join("");

    $("#excludedList").innerHTML = profile.excludedFromCalibration.map(item => `<span>${escapeHtml(item)}</span>`).join("");

    const editor = $("#weightEditor");
    editor.innerHTML = `<div class="card-heading"><span>PROFILE CONTROLS</span><strong>0–100</strong></div>` + Object.entries(profile.weights).map(([key, value]) => (
      `<div class="weight-row"><label for="weight-${key}">${escapeHtml(traitLabels[key] || key)}</label><input id="weight-${key}" data-weight-key="${key}" type="range" min="0" max="100" value="${value}"><output>${value}</output></div>`
    )).join("");
    $$('[data-weight-key]').forEach(input => input.addEventListener("input", () => {
      input.nextElementSibling.value = input.value;
      profile.weights[input.dataset.weightKey] = Number(input.value);
      updateTraitBarWithoutRebuild(input.dataset.weightKey, Number(input.value));
    }));
  }

  function updateTraitBarWithoutRebuild() {
    const rows = $$("#traitBars .trait-row");
    Object.values(profile.weights).forEach((value, index) => {
      const row = rows[index];
      if (!row) return;
      row.querySelector(".trait-fill").style.width = `${value}%`;
      row.querySelector("strong").textContent = value;
    });
  }

  function initializeProfileControls() {
    $("#saveProfileButton").addEventListener("click", () => {
      localStorage.setItem("shriBrainWeights", JSON.stringify(profile.weights));
      toast("Shri's philosophy weights were saved on this device.");
      reanalyzeCurrent();
    });
    $("#resetProfileButton").addEventListener("click", () => {
      profile.weights = JSON.parse(JSON.stringify(state.defaultWeights));
      localStorage.removeItem("shriBrainWeights");
      renderProfile();
      initializeProfileControlsAfterRender();
      toast("Default philosophy restored.");
      reanalyzeCurrent();
    });
  }

  function initializeProfileControlsAfterRender() {
    // renderProfile recreates the editor only; global action buttons remain unchanged.
  }

  function initializeTabs() {
    $$(".mode-tab").forEach(tab => tab.addEventListener("click", () => {
      $$(".mode-tab").forEach(item => {
        item.classList.toggle("active", item === tab);
        item.setAttribute("aria-selected", item === tab ? "true" : "false");
      });
      $$(".mode-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === tab.dataset.mode));
    }));

    $$(".detail-tab").forEach(tab => tab.addEventListener("click", () => {
      $$(".detail-tab").forEach(item => item.classList.toggle("active", item === tab));
      $$('[data-detail-panel]').forEach(panel => panel.classList.toggle("active", panel.dataset.detailPanel === tab.dataset.detail));
    }));
  }

  function initializeRangeOutputs() {
    $$('input[type="range"]').forEach(input => {
      const output = input.nextElementSibling;
      if (output && output.tagName === "OUTPUT") {
        output.value = input.value;
        input.addEventListener("input", () => { output.value = input.value; });
      }
    });
  }

  function initializeDialog() {
    const dialog = $("#infoDialog");
    $("#apiHelpButton").addEventListener("click", () => dialog.showModal());
    dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  }

  function setButtonLoading(button, loading, label) {
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.innerHTML = `<span class="loading-ring"></span>${escapeHtml(label || "Working")}`;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || label || "Done";
      button.disabled = false;
    }
  }

  async function alphaLookup() {
    const symbolInput = $("#lookupSymbol");
    const keyInput = $("#apiKey");
    const symbol = symbolInput.value.trim().toUpperCase();
    const apiKey = keyInput.value.trim();
    if (!symbol) return toast("Enter a BSE symbol such as RELIANCE.BSE.", "error");
    if (!apiKey) return toast("Paste a free Alpha Vantage API key or use upload/manual mode.", "error");
    if (!symbol.includes(".")) toast("Tip: Alpha Vantage's documented Indian example uses the .BSE suffix.");
    if ($("#rememberKey").checked) localStorage.setItem("shriBrainAlphaKey", apiKey);
    else localStorage.removeItem("shriBrainAlphaKey");

    const button = $("#lookupButton");
    setButtonLoading(button, true, "Fetching");
    try {
      const base = "https://www.alphavantage.co/query";
      const dailyUrl = `${base}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${encodeURIComponent(apiKey)}`;
      const overviewUrl = `${base}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
      const [dailyResponse, overviewResponse] = await Promise.all([fetch(dailyUrl), fetch(overviewUrl)]);
      if (!dailyResponse.ok) throw new Error(`Daily data request failed (${dailyResponse.status}).`);
      const daily = await dailyResponse.json();
      const overview = overviewResponse.ok ? await overviewResponse.json() : {};
      const data = scoring.alphaToInput(symbol, daily, overview);
      state.currentRaw = data;
      renderResult(scoring.analyze(data));
      const confidence = state.currentResult.scores.confidence_score;
      if (confidence < 50) toast("Price found. Fundamental evidence is thin, so the app correctly lowered confidence.");
    } catch (error) {
      console.error(error);
      toast(error.message || "The free lookup failed. Upload current filings or a Skill JSON instead.", "error");
    } finally {
      setButtonLoading(button, false, "Fetch & inspect");
    }
  }

  function initializeFileUpload() {
    const input = $("#fileInput");
    const dropZone = $("#dropZone");
    const status = $("#fileStatus");
    const analyzeButton = $("#analyzeUploadButton");

    async function loadFile(file) {
      if (!file) return;
      try {
        const text = await file.text();
        const data = file.name.toLowerCase().endsWith(".csv") ? scoring.csvToObject(text) : JSON.parse(text);
        if (!data || typeof data !== "object") throw new Error("The file must contain one JSON object or a usable CSV row.");
        state.uploadedData = data;
        status.textContent = `${file.name} loaded · ${(file.size / 1024).toFixed(1)} KB`;
        analyzeButton.disabled = false;
        toast("File loaded locally. Nothing was uploaded to a server.");
      } catch (error) {
        state.uploadedData = null;
        status.textContent = "Could not read the file.";
        analyzeButton.disabled = true;
        toast(error.message || "Invalid file.", "error");
      }
    }

    input.addEventListener("change", () => loadFile(input.files[0]));
    ["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => {
      event.preventDefault();
      dropZone.classList.add("dragging");
    }));
    ["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => {
      event.preventDefault();
      dropZone.classList.remove("dragging");
    }));
    dropZone.addEventListener("drop", event => loadFile(event.dataTransfer.files[0]));
    analyzeButton.addEventListener("click", () => {
      if (!state.uploadedData) return;
      state.currentRaw = state.uploadedData.schema_version && state.uploadedData.scores ? state.uploadedData.raw_input || null : state.uploadedData;
      renderResult(scoring.analyze(state.uploadedData));
    });
  }

  function manualData() {
    const sector = $("#manualSector").value;
    const returnMetric = scoring.num($("#manualReturn").value);
    const isBank = ["bank", "nbfc"].includes(sector);
    return {
      company: {
        name: $("#manualName").value.trim() || "Manual company",
        symbol: $("#manualSymbol").value.trim().toUpperCase() || "MANUAL",
        exchange: "User supplied",
        security_type: "equity",
        sector,
        subsector: null,
        market_cap_band: $("#manualBand").value,
        currency: "INR"
      },
      dates: { price_as_of: todayIso(), fundamentals_as_of: null, freshness: "user_uploaded" },
      valuation: {
        price: null,
        market_cap_cr: null,
        pe: scoring.num($("#manualPe").value),
        pb: scoring.num($("#manualPb").value),
        ev_ebitda: null,
        dividend_yield: null,
        fcf_yield: null
      },
      quality: {
        roe: scoring.num($("#manualRoe").value),
        roa: isBank ? returnMetric : null,
        roce: isBank ? null : returnMetric,
        revenue_cagr_3y: null,
        profit_cagr_3y: scoring.num($("#manualGrowth").value),
        ocf_to_pat: null,
        fcf_positive_years_5: null,
        interest_coverage: null,
        debt_to_equity: null,
        net_debt_to_ebitda: scoring.num($("#manualDebt").value)
      },
      banking: {},
      operating: {},
      qualitative: {
        governance: Number($("#manualGovernance").value),
        management_execution: 55,
        capital_allocation: 55,
        tangible_assets: Number($("#manualTangible").value),
        understandability: Number($("#manualTangible").value),
        india_tailwind: 65,
        catalyst: Number($("#manualCatalyst").value),
        regulatory_or_pipeline_quality: null,
        cyclicality: sector === "cyclical" ? 80 : 45,
        data_confidence: 30
      },
      portfolio: {},
      red_flags: [],
      sources: [],
      analyst_notes: ["Low-confidence manual screen. Upload current filings or Skill JSON before relying on the details."]
    };
  }

  function initializeManual() {
    $("#manualAnalyzeButton").addEventListener("click", () => {
      const data = manualData();
      state.currentRaw = data;
      renderResult(scoring.analyze(data));
      toast("Low-confidence screen complete. Evidence gaps are listed in the detailed view.");
    });
  }

  const demoBank = {
    company: { name: "Illustrative Regional Bank", symbol: "DEMO.BSE", exchange: "BSE", security_type: "equity", sector: "bank", subsector: "regional bank", market_cap_band: "small", currency: "INR" },
    dates: { price_as_of: "2026-07-10", fundamentals_as_of: "2026-03-31", freshness: "illustrative_demo" },
    valuation: { price: 100, market_cap_cr: 5000, pe: 8.5, pb: 1.05, ev_ebitda: null, dividend_yield: 1.5, fcf_yield: null },
    quality: { roe: 15.5, roa: 1.25, roce: null, revenue_cagr_3y: 12, profit_cagr_3y: 17, ocf_to_pat: null, fcf_positive_years_5: null, interest_coverage: null, debt_to_equity: null, net_debt_to_ebitda: null },
    banking: { gross_npa: 2, net_npa: 0.65, credit_cost: 0.45, provision_coverage: 76, capital_adequacy: 16.2, casa: 33, nim: 3.25, loan_growth: 14, deposit_growth: 13 },
    operating: {},
    qualitative: { governance: 72, management_execution: 70, capital_allocation: 68, tangible_assets: 82, understandability: 86, india_tailwind: 78, catalyst: 74, regulatory_or_pipeline_quality: null, cyclicality: 38, data_confidence: 78 },
    portfolio: { current_weight: 0, sector_weight: 28, overlap_score: 76 },
    red_flags: [], sources: [], analyst_notes: ["All values are fictional and for interface demonstration only."]
  };

  const demoTrap = {
    company: { name: "Illustrative EPC Limited", symbol: "EPCDEMO.BSE", exchange: "BSE", security_type: "equity", sector: "infrastructure", subsector: "roads and EPC", market_cap_band: "small", currency: "INR" },
    dates: { price_as_of: "2026-07-10", fundamentals_as_of: "2026-03-31", freshness: "illustrative_demo" },
    valuation: { price: 100, market_cap_cr: 4000, pe: 8, pb: 1.4, ev_ebitda: 6, dividend_yield: 0.5, fcf_yield: -2 },
    quality: { roe: 13, roa: 4, roce: 12, revenue_cagr_3y: 18, profit_cagr_3y: 22, ocf_to_pat: 0.25, fcf_positive_years_5: 1, interest_coverage: 2.1, debt_to_equity: 1.7, net_debt_to_ebitda: 4.3 },
    banking: {},
    operating: { operating_margin: 11, net_margin: 5, order_book_to_revenue: 3.1, working_capital_days: 190, market_share_trend: null, presales_growth: null, collections_to_sales: null, nav_discount: null },
    qualitative: { governance: 58, management_execution: 65, capital_allocation: 48, tangible_assets: 88, understandability: 82, india_tailwind: 92, catalyst: 80, regulatory_or_pipeline_quality: null, cyclicality: 72, data_confidence: 82 },
    portfolio: { current_weight: 0, sector_weight: 14, overlap_score: 82 },
    red_flags: [{ code: "cash_conversion", severity: "medium", note: "Operating cash flow is weak relative to profit" }],
    sources: [], analyst_notes: ["All values are fictional and for interface demonstration only."]
  };

  function initializeDemos() {
    $("#demoBankButton").addEventListener("click", () => {
      state.currentRaw = JSON.parse(JSON.stringify(demoBank));
      renderResult(scoring.analyze(state.currentRaw));
      toast("Loaded a fictional small-bank example. No real company data is implied.");
    });
    $("#demoTrapButton").addEventListener("click", () => {
      state.currentRaw = JSON.parse(JSON.stringify(demoTrap));
      renderResult(scoring.analyze(state.currentRaw));
      toast("Loaded a fictional cheap-looking EPC example with weak cash conversion.");
    });
  }

  function animateNumber(element, target) {
    const start = performance.now();
    const duration = 900;
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
      else element.textContent = String(Math.round(target));
    }
    requestAnimationFrame(frame);
  }

  function resultVerdict(result) {
    const confidence = result.scores.confidence_score;
    if (confidence < 40) return "The model refuses false precision. Add the missing sector evidence before interpreting the score.";
    if (result.classification.quadrant.includes("value-trap")) return "This looks like Shri's kind of idea, but the business evidence is not strong enough yet.";
    if (result.classification.quadrant.includes("quality candidate")) return "The philosophy and the fundamentals point in the same direction; valuation, concentration and fresh filings still matter.";
    if (result.classification.quadrant.includes("not naturally")) return "The company may be good, but it does not currently match Shri's preferred price-and-catalyst setup.";
    return "The evidence is mixed. Treat it as a research queue item rather than a conclusion.";
  }

  function renderResult(result) {
    state.currentResult = result;
    $("#resultPlaceholder").hidden = true;
    $("#resultDashboard").hidden = false;
    const company = result.company || {};
    const asOf = result.as_of || {};
    $("#resultTicker").textContent = company.symbol || "UNTICKERED";
    $("#resultCompany").textContent = company.name || "Unnamed company";
    const dateParts = [];
    if (company.exchange) dateParts.push(company.exchange);
    if (company.sector) dateParts.push(String(company.sector).replace(/_/g, " "));
    if (asOf.price_as_of) dateParts.push(`price ${asOf.price_as_of}`);
    if (asOf.fundamentals_as_of) dateParts.push(`fundamentals ${asOf.fundamentals_as_of}`);
    if (asOf.freshness) dateParts.push(String(asOf.freshness).replace(/_/g, " "));
    $("#resultMeta").textContent = dateParts.join(" · ") || "Evidence dates unavailable";

    const scores = result.scores;
    $("#meterLabel").textContent = result.classification.label;
    $("#meterVerdict").textContent = resultVerdict(result);
    animateNumber($("#happinessScore"), scores.happiness_score);
    $("#confidenceScore").textContent = `${Math.round(scores.confidence_score)}% · ${result.classification.confidence_label}`;
    const gaugeLength = 267;
    requestAnimationFrame(() => { $("#gaugeProgress").style.strokeDashoffset = String(gaugeLength * (1 - scores.happiness_score / 100)); });

    $("#quadrantLabel").textContent = result.classification.quadrant;
    $("#fitScore").textContent = Math.round(scores.shri_fit_score);
    $("#qualityScore").textContent = Math.round(scores.fundamental_quality_score);
    const dot = $("#quadrantDot");
    dot.style.left = `${Math.max(4, Math.min(96, scores.shri_fit_score))}%`;
    dot.style.top = `${Math.max(4, Math.min(96, 100 - scores.fundamental_quality_score))}%`;
    const dotColor = result.classification.quadrant.includes("value-trap") ? "#ff6f78" : scores.happiness_score >= 72 ? "#b7ff5a" : "#ffd45a";
    dot.style.background = `${dotColor}33`;
    dot.querySelector("span").style.background = dotColor;

    const ribbon = [
      ["Valuation", scores.valuation_score, "sector-aware"],
      ["Balance sheet", scores.balance_sheet_score, "resilience"],
      ["Trend", scores.trend_score, "operating direction"],
      ["Portfolio fit", scores.portfolio_fit_score, "overlap & size"]
    ];
    $("#scoreRibbon").innerHTML = ribbon.map(([name, score, note]) => `<div class="score-chip"><span>${escapeHtml(name)}</span><strong>${Math.round(score)}</strong><small>${escapeHtml(note)}</small></div>`).join("");

    const positive = result.reasons?.positive || [];
    const cautions = result.reasons?.cautions || [];
    $("#positiveReasons").innerHTML = (positive.length ? positive : ["No positive claim is strong enough with the supplied data."]).map(item => `<li>${escapeHtml(item)}</li>`).join("");
    $("#cautionReasons").innerHTML = (cautions.length ? cautions : ["No explicit caution was supplied; verify governance, cash flow and valuation freshness anyway."]).map(item => `<li>${escapeHtml(item)}</li>`).join("");

    const missing = result.reasons?.missing || [];
    $("#evidencePanel").innerHTML = `<h4>${missing.length ? `${missing.length} material fields are still missing` : "Material sector fields supplied"}</h4><p>${missing.length ? "Missing evidence lowers confidence; it is not scored as zero." : "Completeness does not guarantee correctness. Verify source dates and accounting definitions."}</p>${missing.length ? `<div class="missing-pill-grid">${missing.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : `<ul class="detail-list"><li>Run the latest filing and governance checks before using the result.</li></ul>`}${(result.analyst_notes || []).length ? `<ul class="detail-list">${result.analyst_notes.map(note => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : ""}`;

    const relationship = result.portfolio_relationship || {};
    $("#portfolioPanel").innerHTML = `<h4>${escapeHtml(relationship.note || "Portfolio relationship not available")}</h4><p>Closest philosophy neighbors are based on sector and thesis resemblance, not statistical return correlation.</p><div class="portfolio-neighbors">${(relationship.closest_holdings || []).map(item => `<span>${escapeHtml(item)}</span>`).join("") || "<span>No close neighbor mapped</span>"}</div><p class="microcopy">For true price correlation, import aligned historical returns. Theme similarity and return correlation are different questions.</p>`;

    $("#killPanel").innerHTML = `<h4>What would invalidate the thesis</h4><ul class="kill-list">${(result.reasons?.kill_conditions || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

    const sources = result.sources || [];
    $("#sourcesPanel").innerHTML = `<h4>${sources.length ? `${sources.length} source${sources.length === 1 ? "" : "s"}` : "No sources attached"}</h4><p>${sources.length ? "Open the original evidence and verify dates before relying on any metric." : "Import a Skill result or upload a current filing-backed dataset for a serious analysis."}</p><div class="source-list">${sources.map(source => {
      const safeUrl = safeHttpUrl(source.url);
      const label = escapeHtml(source.title || source.url || "Untitled source");
      return `<div class="source-item">${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>` : `<strong>${label}</strong>`}<small>${escapeHtml([source.type, source.date].filter(Boolean).join(" · "))}</small></div>`;
    }).join("")}</div><p class="microcopy">${escapeHtml(result.disclaimer || scoring.DISCLAIMER)}</p>`;

    const raw = result.raw_input || state.currentRaw;
    if (raw) {
      const price = scoring.get(raw, "valuation.price");
      const pe = scoring.get(raw, "valuation.pe");
      if (price !== null && price !== undefined) $("#scenarioPrice").value = price;
      if (pe !== null && pe !== undefined) $("#scenarioPe").value = pe;
    }

    $("#resultDashboard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reanalyzeCurrent() {
    if (!state.currentRaw) return;
    renderResult(scoring.analyze(state.currentRaw));
  }

  function initializeResultActions() {
    $("#resetResultButton").addEventListener("click", () => {
      state.currentRaw = null;
      state.currentResult = null;
      $("#resultDashboard").hidden = true;
      $("#resultPlaceholder").hidden = false;
      $("#gaugeProgress").style.strokeDashoffset = "267";
    });

    $("#downloadResultButton").addEventListener("click", () => {
      if (!state.currentResult) return;
      const blob = new Blob([JSON.stringify(state.currentResult, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const symbol = state.currentResult.company?.symbol || "stock";
      anchor.href = url;
      anchor.download = `${symbol.replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}-shri-analysis.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  function initializeScenario() {
    $("#runScenarioButton").addEventListener("click", () => {
      const price = scoring.num($("#scenarioPrice").value);
      const pe = scoring.num($("#scenarioPe").value);
      const years = scoring.num($("#scenarioYears").value);
      if (price === null || pe === null || pe <= 0 || years === null || years <= 0) return toast("Enter a positive current price, P/E and horizon.", "error");
      const currentEps = price / pe;
      const cases = [
        ["Bear", scoring.num($("#bearGrowth").value), scoring.num($("#bearExit").value)],
        ["Base", scoring.num($("#baseGrowth").value), scoring.num($("#baseExit").value)],
        ["Bull", scoring.num($("#bullGrowth").value), scoring.num($("#bullExit").value)]
      ];
      $("#scenarioOutput").innerHTML = cases.map(([label, growth, exitPe]) => {
        if (growth === null || exitPe === null || exitPe <= 0) return `<div class="scenario-result"><span>${label}</span><strong>Invalid</strong><small>Check assumptions</small></div>`;
        const futureEps = currentEps * Math.pow(1 + growth / 100, years);
        const futurePrice = futureEps * exitPe;
        const total = (futurePrice / price - 1) * 100;
        const cagr = (Math.pow(futurePrice / price, 1 / years) - 1) * 100;
        return `<div class="scenario-result"><span>${label}</span><strong>${cagr >= 0 ? "+" : ""}${cagr.toFixed(1)}% CAGR</strong><small>₹${futurePrice.toFixed(0)} implied · ${total >= 0 ? "+" : ""}${total.toFixed(0)}% total</small></div>`;
      }).join("");
    });
  }

  function initializeTour() {
    $("#tourButton").addEventListener("click", () => state.brainGraph?.tour());
  }

  function initializeActions() {
    $("#lookupButton").addEventListener("click", alphaLookup);
  }

  function boot() {
    loadSavedPreferences();
    initializeReveal();
    initializeHeader();
    initializeCursor();
    initializeCardEffects();
    initializeAmbientCanvas();
    renderProfile();
    initializeBrainGraph();
    initializeProfileControls();
    initializeTabs();
    initializeRangeOutputs();
    initializeDialog();
    initializeFileUpload();
    initializeManual();
    initializeDemos();
    initializeResultActions();
    initializeScenario();
    initializeTour();
    initializeActions();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}());
