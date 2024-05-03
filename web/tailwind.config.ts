import { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        brutalist: "2px 2px 0px rgba(0,0,0,1)]",
      },
    },
  },
  plugins: [],
} satisfies Config;
