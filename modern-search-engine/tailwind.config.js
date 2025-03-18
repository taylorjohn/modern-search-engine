/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        primary: "#646cff",
        "primary-hover": "#535bf2",
        muted: "#f9f9f9",
      },
    },
  },
  plugins: [],
}

