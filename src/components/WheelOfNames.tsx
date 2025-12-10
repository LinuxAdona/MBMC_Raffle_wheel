import React, { useState, useRef, useEffect } from "react";

interface WheelOfNamesProps {
  allNames: string[];
  selectedSetNames: string[];
  onWinner: (winner: string) => void;
}

const WheelOfNames: React.FC<WheelOfNamesProps> = ({
  allNames,
  selectedSetNames,
  onWinner,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const spinVelocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const targetRotationRef = useRef(0);
  const targetWinnerRef = useRef<string | null>(null);
  const currentRotationRef = useRef(0);

  const colors = [
    "#FF8FA3",
    "#FFB347",
    "#FFE66D",
    "#90EE90",
    "#87CEEB",
    "#DDA0DD",
    "#FFB6C1",
    "#B19CD9",
    "#77DD77",
    "#FFB3BA",
    "#C6A4D8",
    "#FFD1A9",
    "#A8C8E1",
    "#FFB6D9",
    "#B4E7CE",
  ];

  useEffect(() => {
    drawWheel();
  }, [allNames]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    const numSegments = allNames.length || 1;
    const anglePerSegment = (2 * Math.PI) / numSegments;

    for (let i = 0; i < numSegments; i++) {
      const startAngle = i * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;
      const color = colors[i % colors.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const text = allNames[i] || "";
      const textRadius = radius * 0.7;
      ctx.fillText(text, textRadius, 7);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = "#121212";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 5, centerY);
    ctx.lineTo(centerX + radius - 30, centerY - 20);
    ctx.lineTo(centerX + radius - 30, centerY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const animate = (currentTime: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    // friction to slow down
    spinVelocityRef.current *= 0.985;

    // update rotation using ref
    const newRotation =
      currentRotationRef.current + spinVelocityRef.current * deltaTime;
    currentRotationRef.current = newRotation;
    setRotation(newRotation);

    // stop spinning only when velocity is very low
    if (Math.abs(spinVelocityRef.current) < 10) {
      // Set final rotation to exact target
      currentRotationRef.current = targetRotationRef.current;
      setRotation(targetRotationRef.current);

      setIsSpinning(false);
      spinVelocityRef.current = 0;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;

      setTimeout(() => {
        calculateWinner();
      }, 100);
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  const calculateWinner = () => {
    if (targetWinnerRef.current) {
      onWinner(targetWinnerRef.current);
      targetWinnerRef.current = null;
    }
  };

  // TODO: spin doesn't consistently land on the target winner, needs fixing
  const startSpin = () => {
    if (isSpinning) {
      // stop spinning
      setIsSpinning(false);
      spinVelocityRef.current = 0;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;
      calculateWinner();
    } else {
      // start spinning
      if (selectedSetNames.length === 0 || allNames.length === 0) return;

      // pick a random winner from the selected set
      const winnerIndex = Math.floor(Math.random() * selectedSetNames.length);
      const preSelectedWinner = selectedSetNames[winnerIndex];
      targetWinnerRef.current = preSelectedWinner;

      // find the index of this winner in allNames
      const winnerPositionInAll = allNames.indexOf(preSelectedWinner);

      if (winnerPositionInAll === -1) {
        console.error("Winner not found in allNames!", preSelectedWinner);
        return;
      }

      // calculate target rotation to land on this winner
      const segmentAngle = 360 / allNames.length;
      const targetPointerAngle = (winnerPositionInAll + 0.5) * segmentAngle;
      const baseRotation = 360 - targetPointerAngle;

      // add multiple full rotations
      const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
      const totalRotation = extraSpins * 360 + baseRotation;

      // store target rotation
      targetRotationRef.current = currentRotationRef.current + totalRotation;

      setIsSpinning(true);

      // Calculate required velocity to reach target with deceleration
      // With friction 0.985 per frame: distance ≈ velocity × (1/60) × (1/0.015) = velocity × 1.111
      // velocity = distance / 1.111 ≈ distance × 0.9
      // Add extra margin since we stop at velocity < 10
      const totalRotationNeeded = totalRotation;
      const velocityMultiplier = 1.5; // Higher value to account for early stopping at velocity < 10
      spinVelocityRef.current = totalRotationNeeded * velocityMultiplier;

      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isSpinning) {
      drawWheel();
    }
  }, [rotation, isSpinning]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 max-h-full">
      <div className="relative shrink-0">
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          className="drop-shadow-2xl max-w-full h-auto"
          style={{ maxHeight: "60vh", width: "auto" }}
        />
      </div>

      <button
        onClick={startSpin}
        disabled={allNames.length === 0 || selectedSetNames.length === 0}
        className={`
          px-12 py-4 text-xl font-bold rounded-full transition-all duration-300 transform
          ${
            isSpinning
              ? "bg-red-400 hover:bg-red-500 active:scale-95"
              : "bg-linear-to-r from-indigo-400 to-blue-400 hover:from-indigo-500 hover:to-blue-500 active:scale-95"
          }
          text-white shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        `}
      >
        {isSpinning ? "🛑 STOP" : "🎯 SPIN THE WHEEL"}
      </button>
    </div>
  );
};

export default WheelOfNames;
