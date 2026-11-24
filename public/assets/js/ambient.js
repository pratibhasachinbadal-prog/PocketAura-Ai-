(() => {
    const canvas = document.querySelector("[data-ambient-canvas]");
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
        console.warn("PocketAura ambient canvas is unavailable.");
        return;
    }

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0 };
    let points = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let lastTimestamp = 0;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const mobile = width < 760;
        const count = Math.max(14, Math.min(mobile ? 28 : 64, Math.round(width * height / 26000)));
        points = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            phase: Math.random() * Math.PI * 2,
            hue: Math.random() > 0.5 ? 218 : 258
        }));

        if (motionPreference.matches) {
            drawFrame(0);
        } else {
            requestFrame();
        }
    }

    function drawWave(timestamp, baseline, phase, amplitude, color) {
        context.beginPath();
        const step = Math.max(18, width / 70);
        for (let x = 0; x <= width + step; x += step) {
            const y = baseline
                + Math.sin(x * 0.004 + timestamp * 0.00022 + phase) * amplitude
                + Math.sin(x * 0.0025 - timestamp * 0.00016 + phase) * amplitude * 0.42;
            if (x === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
    }

    function drawFrame(timestamp) {
        animationFrame = 0;
        if (document.hidden) return;

        const isReducedMotion = motionPreference.matches;
        const delta = isReducedMotion || !lastTimestamp
            ? 0
            : Math.min((timestamp - lastTimestamp) / 16.67, 2);
        lastTimestamp = timestamp;

        context.clearRect(0, 0, width, height);
        const parallaxX = pointer.x * 8;
        const parallaxY = pointer.y * 8;
        const connectionDistance = width < 760 ? 92 : 142;
        const time = isReducedMotion ? 0 : timestamp;

        drawWave(time, height * 0.68, 0, 15, "rgba(89, 143, 255, 0.055)");
        drawWave(time, height * 0.76, 2.1, 11, "rgba(157, 105, 255, 0.045)");

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (!isReducedMotion) {
                point.x = (point.x + point.vx * delta + width) % width;
                point.y = (point.y + point.vy * delta + height) % height;
            }

            const x = point.x + parallaxX;
            const y = point.y + parallaxY;
            for (let j = i + 1; j < points.length; j++) {
                const other = points[j];
                const otherX = other.x + parallaxX;
                const otherY = other.y + parallaxY;
                const distance = Math.hypot(x - otherX, y - otherY);
                if (distance >= connectionDistance) continue;

                const opacity = (1 - distance / connectionDistance) * 0.13;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(otherX, otherY);
                context.strokeStyle = `hsla(${point.hue}, 95%, 73%, ${opacity})`;
                context.lineWidth = 0.7;
                context.stroke();
            }

            const pulse = isReducedMotion ? 0.5 : 0.5 + Math.sin(time * 0.0012 + point.phase) * 0.18;
            context.beginPath();
            context.arc(x, y, 1.1 + pulse, 0, Math.PI * 2);
            context.fillStyle = `hsla(${point.hue}, 100%, 83%, ${0.22 + pulse * 0.25})`;
            context.fill();
        }

        if (!isReducedMotion) requestFrame();
    }

    function requestFrame() {
        if (!animationFrame && !document.hidden) {
            animationFrame = window.requestAnimationFrame(drawFrame);
        }
    }

    function handleMotionPreferenceChange() {
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
        }
        lastTimestamp = 0;
        if (motionPreference.matches) drawFrame(0);
        else requestFrame();
    }

    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("pointermove", event => {
        pointer.x = event.clientX / Math.max(width, 1) - 0.5;
        pointer.y = event.clientY / Math.max(height, 1) - 0.5;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
        } else if (!document.hidden) {
            if (motionPreference.matches) drawFrame(0);
            else requestFrame();
        }
    });

    if (motionPreference.addEventListener) {
        motionPreference.addEventListener("change", handleMotionPreferenceChange);
    } else {
        motionPreference.addListener(handleMotionPreferenceChange);
    }

    resizeCanvas();
})();
