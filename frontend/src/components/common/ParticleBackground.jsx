
import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const particlesRef = useRef([]); // Use a ref to store particles

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;

    class Particle {
      constructor(color) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5; // Slower speed
        this.speedY = Math.random() * 1 - 0.5; // Slower speed
        this.color = color;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.1) this.size -= 0.005; // Make them fade out slower

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const createParticles = (color) => {
      particlesRef.current = []; // Clear existing particles
      for (let i = 0; i < 80; i++) { // Fewer particles
        particlesRef.current.push(new Particle(color));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesRef.current.length; i++) {
        particlesRef.current[i].update();
        particlesRef.current[i].draw();
        // If a particle fades out, re-create it
        if (particlesRef.current[i].size <= 0.1) {
            particlesRef.current[i] = new Particle(theme === 'dark' ? '#ffffff' : '#333333');
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial setup
    resizeCanvas();
    createParticles(theme === 'dark' ? '#ffffff' : '#333333');
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Run only once on mount

  // Update particle colors when theme changes
  useEffect(() => {
    const newColor = theme === 'dark' ? '#ffffff' : '#333333';
    particlesRef.current.forEach(p => (p.color = newColor));
  }, [theme]);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10" />;
};

export default ParticleBackground;
