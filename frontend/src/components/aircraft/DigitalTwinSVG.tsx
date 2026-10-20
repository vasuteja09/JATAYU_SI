import React from 'react';

interface DigitalTwinSVGProps {
  selectedComponent: string;
  onSelectComponent: (componentType: string) => void;
  componentHealthMap?: Record<string, { health: number; status: string; risk: string }>;
}

export const DigitalTwinSVG: React.FC<DigitalTwinSVGProps> = ({
  selectedComponent,
  onSelectComponent,
  componentHealthMap = {}
}) => {
  const getComponentColor = (type: string) => {
    const data = componentHealthMap[type];
    if (!data) return '#10B981'; // Green default
    if (data.risk === 'CRITICAL' || data.health < 60) return '#EF4444'; // Red
    if (data.risk === 'HIGH' || data.health < 75) return '#F59E0B'; // Amber
    if (data.risk === 'MEDIUM') return '#3B82F6'; // Blue
    return '#10B981'; // Emerald
  };

  const systems = [
    { id: 'AVIONICS', label: 'Avionics System', x: 260, y: 110, dotX: 230, dotY: 135 },
    { id: 'ENGINE', label: 'Engine Subsystem', x: 480, y: 70, dotX: 430, dotY: 155 },
    { id: 'HYDRAULIC', label: 'Hydraulic Actuation', x: 490, y: 240, dotX: 380, dotY: 175 },
    { id: 'FUEL', label: 'Fuel & Booster System', x: 270, y: 235, dotX: 340, dotY: 160 },
    { id: 'ELECTRICAL', label: 'Electrical & Starter Unit', x: 120, y: 195, dotX: 190, dotY: 150 },
  ];

  return (
    <div className="relative w-full bg-white rounded-lg border border-slate-200 p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
            Airframe Schematic 2D Digital Twin
          </span>
          <h3 className="text-sm font-semibold text-slate-800">
            Interactive Subsystem Diagnostics Matrix
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Monitoring</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical Risk</span>
        </div>
      </div>

      <div className="relative w-full h-[320px] flex items-center justify-center bg-slate-50/50 rounded-lg border border-slate-100">
        <svg viewBox="0 0 700 300" className="w-full h-full max-w-[650px] drop-shadow-sm">
          {/* Subtle Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="700" height="300" fill="url(#grid)" opacity="0.6" />

          {/* Clean Aerospace Aircraft Silhouette Outline (Transport / Patrol multi-engine class) */}
          <g fill="#F1F5F9" stroke="#334155" strokeWidth="1.75" strokeLinejoin="round">
            {/* Fuselage */}
            <path d="M 120 150 C 130 135, 170 130, 260 130 L 460 130 C 530 130, 580 135, 620 148 C 625 150, 625 152, 620 154 C 580 167, 530 172, 460 172 L 260 172 C 170 172, 130 167, 120 152 Z" />
            
            {/* Cockpit canopy */}
            <path d="M 160 138 C 170 133, 195 133, 210 138 Z" fill="#CBD5E1" stroke="#475569" strokeWidth="1.2" />

            {/* Wings */}
            {/* Port Wing */}
            <path d="M 330 130 L 370 45 C 375 35, 395 35, 400 45 L 420 130 Z" fill="#E2E8F0" />
            {/* Starboard Wing */}
            <path d="M 330 172 L 370 257 C 375 267, 395 267, 400 257 L 420 172 Z" fill="#E2E8F0" />

            {/* Horizontal Stabilizer (Tail) */}
            <path d="M 570 142 L 610 85 C 613 80, 625 80, 628 85 L 625 142 Z" fill="#E2E8F0" />
            <path d="M 570 160 L 610 217 C 613 222, 625 222, 628 217 L 625 160 Z" fill="#E2E8F0" />

            {/* Engines on wings */}
            <rect x="360" y="70" width="38" height="18" rx="4" fill="#94A3B8" stroke="#334155" />
            <rect x="360" y="214" width="38" height="18" rx="4" fill="#94A3B8" stroke="#334155" />
          </g>

          {/* Connection Lines from Subsystems to Aircraft Hotspots */}
          {systems.map((s) => {
            const isSelected = selectedComponent === s.id;
            const color = getComponentColor(s.id);

            return (
              <g key={`line-${s.id}`}>
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={s.dotX}
                  y2={s.dotY}
                  stroke={isSelected ? '#0F2855' : '#94A3B8'}
                  strokeWidth={isSelected ? '2' : '1'}
                  strokeDasharray={isSelected ? 'none' : '3 3'}
                />
                {/* Hotspot Ring on Aircraft */}
                <circle
                  cx={s.dotX}
                  cy={s.dotY}
                  r="7"
                  fill="white"
                  stroke={color}
                  strokeWidth="2.5"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => onSelectComponent(s.id)}
                />
                <circle
                  cx={s.dotX}
                  cy={s.dotY}
                  r="3"
                  fill={color}
                />
              </g>
            );
          })}
        </svg>

        {/* Hotspot Interactive Labels */}
        {systems.map((s) => {
          const isSelected = selectedComponent === s.id;
          const color = getComponentColor(s.id);
          const data = componentHealthMap[s.id];

          return (
            <div
              key={`btn-${s.id}`}
              style={{ left: `${(s.x / 700) * 100}%`, top: `${(s.y / 300) * 100}%` }}
              onClick={() => onSelectComponent(s.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 select-none ${
                isSelected ? 'scale-105 z-20' : 'hover:scale-105 z-10'
              }`}
            >
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 shadow-sm ${
                  isSelected
                    ? 'bg-aerospace-900 text-white border-aerospace-900 ring-2 ring-aerospace-500/30'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold whitespace-nowrap">{s.label}</span>
                {data && (
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    isSelected ? 'bg-aerospace-800 text-sky-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {data.health}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
