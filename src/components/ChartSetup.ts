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

ChartJS.defaults.color = "#86868b";
ChartJS.defaults.borderColor = "rgba(0,0,0,0.06)";
ChartJS.defaults.font.family = '"Inter", system-ui, sans-serif';
ChartJS.defaults.responsive = true;

export default ChartJS;
