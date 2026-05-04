import RoomEnvironment from './RoomEnvironment.js';
import Hotspot from './Hotspot.js';
import type { HotspotState } from './Hotspot.js';
import type { RoomTheme } from '../themes/rooms.js';

export interface Hotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  solved?: boolean;
}

interface RoomSceneProps {
  hotspots: Hotspot[];
  onHotspotClick: (hotspotId: string) => void;
  theme: RoomTheme;
  children?: React.ReactNode;
}

export default function RoomScene({ hotspots, onHotspotClick, theme, children }: RoomSceneProps) {
  return (
    <div className="room-scene room-scene-enter">
      <RoomEnvironment theme={theme} />

      <div className="room-zones">
        <div className="room-zone room-zone-left" />
        <div className="room-zone room-zone-center" />
        <div className="room-zone room-zone-right" />
      </div>

      <div className="room-floor" />

      {hotspots.map((hs) => {
        const state: HotspotState = hs.solved ? 'completed' : 'available';
        return (
          <Hotspot
            key={hs.id}
            id={hs.id}
            label={hs.label}
            x={hs.x}
            y={hs.y}
            width={hs.width}
            height={hs.height}
            state={state}
            theme={theme}
            onClick={() => onHotspotClick(hs.id)}
          />
        );
      })}

      {children}
    </div>
  );
}
