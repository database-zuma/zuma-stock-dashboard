"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

ChartJS.defaults.color = "#8CA3AD";
ChartJS.defaults.borderColor = "rgba(255,255,255,0.05)";
ChartJS.defaults.font.family = "system-ui, -apple-system, sans-serif";
ChartJS.defaults.responsive = true;

export default ChartJS;
