"use client";

export function GeometricBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large ring - top right */}
      <div
        className="geo-shape geo-ring animate-float"
        style={{
          top: "-100px",
          right: "-100px",
          animationDelay: "0s",
          animationDuration: "20s",
        }}
      />

      {/* Medium ring - bottom left */}
      <div
        className="geo-shape geo-ring"
        style={{
          bottom: "10%",
          left: "-150px",
          width: "400px",
          height: "400px",
          animationDelay: "5s",
        }}
      />

      {/* Hexagon cluster - top left */}
      <div
        className="geo-shape geo-hexagon animate-float"
        style={{
          top: "15%",
          left: "5%",
          animationDelay: "2s",
          animationDuration: "15s",
        }}
      />
      <div
        className="geo-shape geo-hexagon"
        style={{
          top: "20%",
          left: "8%",
          width: "80px",
          height: "93px",
          opacity: "0.5",
        }}
      />

      {/* Triangle - right side */}
      <div
        className="geo-shape geo-triangle animate-float"
        style={{
          top: "40%",
          right: "10%",
          animationDelay: "3s",
          animationDuration: "18s",
        }}
      />

      {/* Small circles - scattered */}
      <div
        className="geo-shape geo-circle"
        style={{
          top: "60%",
          left: "15%",
          width: "100px",
          height: "100px",
        }}
      />
      <div
        className="geo-shape geo-circle animate-float"
        style={{
          top: "30%",
          right: "25%",
          width: "60px",
          height: "60px",
          animationDelay: "4s",
          animationDuration: "12s",
        }}
      />

      {/* Hexagon - bottom right */}
      <div
        className="geo-shape geo-hexagon animate-float"
        style={{
          bottom: "20%",
          right: "15%",
          animationDelay: "1s",
          animationDuration: "22s",
        }}
      />

      {/* Neural network lines - SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.03 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Diagonal lines suggesting data flow */}
        <line
          x1="0%"
          y1="20%"
          x2="30%"
          y2="50%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
        />
        <line
          x1="70%"
          y1="10%"
          x2="100%"
          y2="40%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
        />
        <line
          x1="20%"
          y1="80%"
          x2="50%"
          y2="100%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
        />
        <line
          x1="80%"
          y1="60%"
          x2="100%"
          y2="80%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
        />

        {/* Connection nodes */}
        <circle cx="30%" cy="50%" r="3" fill="#06b6d4" fillOpacity="0.3" />
        <circle cx="70%" cy="40%" r="2" fill="#06b6d4" fillOpacity="0.2" />
        <circle cx="50%" cy="70%" r="2.5" fill="#06b6d4" fillOpacity="0.25" />
      </svg>

      {/* Gradient orbs for depth */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          top: "-200px",
          right: "-200px",
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          bottom: "-100px",
          left: "-100px",
          background:
            "radial-gradient(circle, rgba(13, 148, 136, 0.04) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
