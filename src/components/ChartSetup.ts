import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  type Plugin,
} from "chart.js";

const darkBgPlugin: Plugin = {
  id: "darkBackground",
  beforeDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  darkBgPlugin
);

ChartJS.defaults.color = "#8CA3AD";
ChartJS.defaults.borderColor = "rgba(255,255,255,0.05)";
ChartJS.defaults.font.family = "system-ui, -apple-system, sans-serif";
ChartJS.defaults.responsive = true;

export default ChartJS;
