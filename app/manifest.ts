import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ACL tracker",
    short_name: "ACL",
    description: "Personal ACL rehab session tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ece0",
    theme_color: "#1f1914",
  };
}
