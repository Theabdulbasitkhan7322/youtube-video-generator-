import { CalculateMetadataFunction, Composition, useCurrentFrame, interpolate } from "remotion";

type Props = {};

const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};

export const MyComposition = () => {
  return (
    <Composition
      id="MyComp"
      component={MyComponent}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
      calculateMetadata={calculateMetadata}
    />
  );
};

export const MyComponent: React.FC<Props> = () => {
  const frame = useCurrentFrame();

  // Simple bounce animation - stick figure moves up and down
  const bounce = interpolate(
    frame % 30,
    [0, 15, 30],
    [0, -30, 0]
  );

  // Fade in over first 15 frames
  const opacity = interpolate(
    frame,
    [0, 15],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#F5A623",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg
        viewBox="0 0 1920 1080"
        style={{ opacity }}
      >
        {/* Ground */}
        <rect x="0" y="900" width="1920" height="180" fill="#8B6914" />

        {/* Stick figure - head */}
        <circle
          cx="960"
          cy={400 + bounce}
          r="80"
          fill="white"
          stroke="black"
          strokeWidth="8"
        />

        {/* Eyes */}
        <circle cx="930" cy={380 + bounce} r="8" fill="black" />
        <circle cx="990" cy={380 + bounce} r="8" fill="black" />

        {/* Body */}
        <line
          x1="960"
          y1={480 + bounce}
          x2="960"
          y2={700 + bounce}
          stroke="black"
          strokeWidth="8"
        />

        {/* Arms */}
        <line
          x1="960"
          y1={550 + bounce}
          x2="850"
          y2={620 + bounce}
          stroke="black"
          strokeWidth="8"
        />
        <line
          x1="960"
          y1={550 + bounce}
          x2="1070"
          y2={620 + bounce}
          stroke="black"
          strokeWidth="8"
        />

        {/* Legs */}
        <line
          x1="960"
          y1={700 + bounce}
          x2="880"
          y2={880 + bounce}
          stroke="black"
          strokeWidth="8"
        />
        <line
          x1="960"
          y1={700 + bounce}
          x2="1040"
          y2={880 + bounce}
          stroke="black"
          strokeWidth="8"
        />

        {/* Text */}
        <text
          x="960"
          y="200"
          fontSize="60"
          fill="black"
          textAnchor="middle"
          fontFamily="Arial"
          fontWeight="bold"
        >
          BEYOND OBVIOUS - TEST
        </text>
      </svg>
    </div>
  );
};