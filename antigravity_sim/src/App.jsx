import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, RefreshCcw, Magnet, Activity } from 'lucide-react';

export default function App() {
  // Physics parameters (Realistic approximation)
  const GRAVITY = 9.81; // m/s^2
  
  // User Controls
  const [mass, setMass] = useState(1.0); // kg
  const [magneticStrength, setMagneticStrength] = useState(500); // k constant
  const [damping, setDamping] = useState(0.05); // Air resistance / magnetic damping
  
  // Simulation State
  const [position, setPosition] = useState(0.1); // Distance from base (meters). 0 is bottom.
  const [velocity, setVelocity] = useState(0);
  const [acceleration, setAcceleration] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  // Constants for visualization
  const MAX_HEIGHT = 1.0; // 1 meter max height in simulation box

  // Physics Loop
  const requestRef = useRef();
  const lastTimeRef = useRef();

  const updatePhysics = (time) => {
    if (lastTimeRef.current != undefined) {
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1); // seconds, capped at 100ms
      
      setPosition((prevPosition) => {
        let currentPos = prevPosition;
        let currentVel = velocity;
        
        // Fg = m * g (downward, negative)
        const Fg = - (mass * GRAVITY);
        
        // Fm = k / (y^2) (upward, positive). Avoid division by zero.
        const safeY = Math.max(currentPos, 0.05); 
        const Fm = magneticStrength / (safeY * safeY);
        
        // Fnet = Fg + Fm
        const Fnet = Fg + Fm;
        
        // a = Fnet / m
        const currentAcc = Fnet / mass;
        setAcceleration(currentAcc);
        
        // v = v + a*dt
        currentVel += currentAcc * deltaTime;
        
        // Apply damping (v = v * (1 - damping))
        currentVel *= (1 - damping);
        
        // y = y + v*dt
        currentPos += currentVel * deltaTime;
        
        // Collision with ground
        if (currentPos <= 0.05) {
          currentPos = 0.05;
          currentVel = 0; // stop or bounce: currentVel * -0.5
        }
        // Collision with ceiling
        if (currentPos >= MAX_HEIGHT) {
          currentPos = MAX_HEIGHT;
          currentVel = 0;
        }

        setVelocity(currentVel);
        return currentPos;
      });
    }
    
    lastTimeRef.current = time;
    if (isSimulating) {
      requestRef.current = requestAnimationFrame(updatePhysics);
    }
  };

  useEffect(() => {
    if (isSimulating) {
      requestRef.current = requestAnimationFrame(updatePhysics);
    } else {
      cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = undefined;
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isSimulating, mass, magneticStrength, damping, velocity]);

  const resetSimulation = () => {
    setPosition(0.1);
    setVelocity(0);
    setAcceleration(0);
  };

  // UI Calculation
  const levitationHeightPct = (position / MAX_HEIGHT) * 100;
  const Fg = mass * GRAVITY;
  const safeY = Math.max(position, 0.05);
  const Fm = magneticStrength / (safeY * safeY);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-5xl w-full">
        
        <header className="mb-8 text-center border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Magnetic Levitation Simulator
          </h1>
          <p className="text-slate-400 text-lg">Demonstrating "Anti-Gravity" via Active Force Balancing</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Visualization */}
          <div className="lg:col-span-1 bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 flex flex-col items-center justify-end relative h-[500px]">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400">1.0 m (Ceiling)</div>
            <div className="absolute bottom-16 left-4 text-xs font-mono text-cyan-400">0.0 m (Base)</div>
            
            {/* Height Indicator Line */}
            <div className="absolute right-8 top-10 bottom-16 w-px bg-slate-600 border-l border-dashed border-slate-500">
               <div 
                 className="absolute w-4 h-px bg-cyan-400 transition-all duration-75"
                 style={{ bottom: `${levitationHeightPct}%`, right: 0 }}
               />
               <span 
                 className="absolute text-xs font-mono text-cyan-400 transition-all duration-75 translate-x-4 translate-y-[-50%]"
                 style={{ bottom: `${levitationHeightPct}%` }}
               >
                 {position.toFixed(2)}m
               </span>
            </div>

            {/* Levitating Object */}
            <div 
              className="absolute w-20 h-20 bg-gradient-to-br from-indigo-400 to-cyan-500 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] border-2 border-cyan-300 transition-all duration-75 flex items-center justify-center font-bold text-white z-10"
              style={{ bottom: `${Math.max(levitationHeightPct, 5)}%`, left: '50%', transform: 'translateX(-50%)' }}
            >
              {mass.toFixed(1)}kg
            </div>

            {/* Base Electromagnet */}
            <div className="w-48 h-12 bg-gradient-to-t from-slate-900 to-slate-700 rounded-t-lg border-t-4 border-cyan-500 shadow-[0_-10px_40px_rgba(6,182,212,0.2)] z-0 flex items-center justify-center">
               <Magnet className="text-cyan-400 w-6 h-6 mr-2" />
               <span className="font-mono text-sm text-cyan-200">Electromagnet</span>
            </div>
          </div>

          {/* Right Panel: Controls & Telemetry */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Telemetry Dashboard */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
              <TelemetryBox label="Height (y)" value={`${position.toFixed(3)} m`} color="text-cyan-400" />
              <TelemetryBox label="Velocity (v)" value={`${velocity.toFixed(3)} m/s`} color="text-emerald-400" />
              <TelemetryBox label="Acceleration (a)" value={`${acceleration.toFixed(2)} m/s²`} color="text-rose-400" />
              <TelemetryBox label="Net Force (Fnet)" value={`${(Fm - Fg).toFixed(1)} N`} color="text-amber-400" />
            </div>

            {/* Forces Diagram */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col md:flex-row justify-around items-center gap-6">
               <div className="text-center">
                 <div className="text-slate-400 text-sm mb-2">Gravity (Downward)</div>
                 <div className="text-3xl font-bold text-rose-400 flex items-center justify-center">
                   <ArrowDown className="mr-2" /> {Fg.toFixed(1)} N
                 </div>
                 <div className="text-xs text-slate-500 mt-1">Fg = m × g</div>
               </div>

               <div className="text-2xl font-black text-slate-600">VS</div>

               <div className="text-center">
                 <div className="text-slate-400 text-sm mb-2">Magnetic Force (Upward)</div>
                 <div className="text-3xl font-bold text-cyan-400 flex items-center justify-center">
                   <ArrowUp className="mr-2" /> {Fm.toFixed(1)} N
                 </div>
                 <div className="text-xs text-slate-500 mt-1">Fm = k / y²</div>
               </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-200 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-cyan-400" /> Control Panel
                </h2>
                <div className="space-x-3">
                  <button 
                    onClick={resetSimulation}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition"
                  >
                    <RefreshCcw className="w-4 h-4 inline mr-1" /> Reset
                  </button>
                  <button 
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition ${
                      isSimulating 
                        ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    }`}
                  >
                    {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Mass Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Object Mass (m)</label>
                    <span className="text-sm font-mono text-cyan-400">{mass.toFixed(1)} kg</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="5.0" step="0.1" value={mass}
                    onChange={(e) => setMass(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Magnetic Strength Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Electromagnet Power (k)</label>
                    <span className="text-sm font-mono text-cyan-400">{magneticStrength} units</span>
                  </div>
                  <input 
                    type="range" min="10" max="2000" step="10" value={magneticStrength}
                    onChange={(e) => setMagneticStrength(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Damping Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Damping (Air Resistance)</label>
                    <span className="text-sm font-mono text-cyan-400">{damping.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0.01" max="0.5" step="0.01" value={damping}
                    onChange={(e) => setDamping(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const TelemetryBox = ({ label, value, color }) => (
  <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
    <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">{label}</div>
    <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
  </div>
);
