import wave from "@/assets/landingpage/wave.png";
import "./wave-loop.css";

export function WaveLoop() {
  return (
    <div
      className="wave-loop-viewport pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden opacity-40"
      aria-hidden
    >
      <div className="wave-loop-track">
        <img
          src={wave}
          alt=""
          className="wave-loop-img"
        />

        <img
          src={wave}
          alt=""
          className="wave-loop-img"
        />
      </div>
    </div>
  );
}