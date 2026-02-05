import React, { useEffect, useState } from 'react';

const ParallaxBlob = ({ color = 'bg-primary', size = 'w-96 h-96', top = '-top-20', left = '-left-20', opacity = 'opacity-30' }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 50; // Adjust multiplier for parallax effect
      const y = (clientY / window.innerHeight - 0.5) * 50;
      setPosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div 
      className={`absolute ${top} ${left} ${size} ${color} rounded-full filter blur-3xl ${opacity} animate-pulse`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.5s ease-out'
      }}
    />
  );
};

export default ParallaxBlob;
