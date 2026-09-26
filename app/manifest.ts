import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Club Serginho",
    short_name: "Club Serginho",
    description: "Personal training and ACL rehab log",
    start_url: "/",
    display: "standalone",
    background_color: "#12081f",
    theme_color: "#12081f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
