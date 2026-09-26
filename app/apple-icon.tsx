import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home screens need a PNG, so draw the same sunset-and-dumbbell mark here.
export default function AppleIcon() {
  const stripe = (top: number, height: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: 180,
        height,
        background: "#12081f",
      }}
    />
  );
  const bar = (left: number, top: number, width: number, height: number) => (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: 6,
        background: "#26e7ff",
      }}
    />
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          position: "relative",
          background: "#12081f",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 34,
            top: 44,
            width: 112,
            height: 112,
            borderRadius: 56,
            background: "linear-gradient(180deg, #ffcc33, #ff8a3d 55%, #ff2e93)",
          }}
        />
        {stripe(108, 5)}
        {stripe(122, 8)}
        {stripe(138, 11)}
        {stripe(152, 28)}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 152,
            width: 180,
            height: 4,
            background: "#ff2e93",
          }}
        />
        {bar(48, 74, 84, 11)}
        {bar(36, 52, 11, 55)}
        {bar(54, 60, 11, 39)}
        {bar(115, 60, 11, 39)}
        {bar(133, 52, 11, 55)}
      </div>
    ),
    size,
  );
}
