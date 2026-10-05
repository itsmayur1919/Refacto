const STAGES = ["Uploaded", "Use cases", "Requirements", "Test cases"];

export function TraceThread({ stage }: { stage: number }) {
  // stage: 0 = nothing yet, 1-4 = how many pipeline steps have output
  const positions = [14, 76, 140, 204];

  return (
    <div>
      <svg width="100%" height="34" viewBox="0 0 220 34">
        <line x1="14" y1="17" x2="204" y2="17" stroke="#D8D6CD" strokeWidth={2} />
        {stage > 0 && (
          <line
            x1="14"
            y1="17"
            x2={positions[Math.min(stage, 4) - 1]}
            y2="17"
            stroke="#1F6E5C"
            strokeWidth={2}
          />
        )}
        {positions.map((x, i) => {
          const stepNum = i + 1;
          const done = stage >= stepNum;
          const current = stage === stepNum - 1 && stage < 4;
          return (
            <circle
              key={x}
              cx={x}
              cy={17}
              r={6}
              fill={done ? "#1F6E5C" : "#F6F6F3"}
              stroke={current ? "#B8863B" : done ? "#1F6E5C" : "#D8D6CD"}
              strokeWidth={current ? 2 : done ? 0 : 2}
            />
          );
        })}
      </svg>
      <div className="mt-0.5 flex justify-between text-[9px] text-[#9A9D9F]">
        {STAGES.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}
