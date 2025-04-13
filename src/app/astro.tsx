"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

const Astronaut = () => {
  const [position, setPosition] = useState({ top: 10, left: 10 });
  const [velocity, setVelocity] = useState({ x: 2, y: 2 });

  useEffect(() => {
    const moveAstronaut = () => {
      setPosition((prev) => {
        const newTop = prev.top + velocity.y;
        const newLeft = prev.left + velocity.x;

        // Define the bounds of the container
        const maxTop = 85; // % of the container height
        const maxLeft = 90; // % of the container width

        let newVelocityX = velocity.x;
        let newVelocityY = velocity.y;

        // Reverse direction if the astronaut hits the bounds
        if (newTop <= 0 || newTop >= maxTop) {
          newVelocityY = -velocity.y;
        }
        if (newLeft <= 0 || newLeft >= maxLeft) {
          newVelocityX = -velocity.x;
        }

        setVelocity({ x: newVelocityX, y: newVelocityY });

        return {
          top: Math.max(0, Math.min(newTop, maxTop)),
          left: Math.max(0, Math.min(newLeft, maxLeft)),
        };
      });
    };

    const interval = setInterval(moveAstronaut, 20); // Adjust speed by changing interval time
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [velocity]);

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      {/* Moving astronaut */}
      <div
        style={{
          position: "absolute",
          top: `${position.top}%`,
          left: `${position.left}%`,
          width: "100px",
          height: "100px",
        }}
      >
        <Image
          src="/astronaut.png"
          alt="Astronaut"
          width={100}
          height={100}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default Astronaut;