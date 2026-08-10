import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function FunnelChart({ data = [], height = 250 }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty" style={{ height: `${height}px` }}>
        No funnel data available
      </div>
    )
  }

  // Example data format: [{ label: 'Created', count: 100 }, { label: 'Assigned', count: 80 }]
  // To create a funnel effect with horizontal bars, we can use a stacked bar chart with a "padding" dataset that is transparent
  
  const maxCount = Math.max(...data.map(d => d.count))
  
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Padding',
        data: data.map(d => (maxCount - d.count) / 2),
        backgroundColor: 'transparent',
        hoverBackgroundColor: 'transparent',
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
      {
        label: 'Count',
        data: data.map(d => d.count),
        backgroundColor: '#0f6e56',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      }
    ]
  }

  const options = {
    indexAxis: 'y', // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        filter: function(tooltipItem) {
          return tooltipItem.datasetIndex === 1 // Only show tooltip for the real data
        },
        callbacks: {
          label: (ctx) => `${ctx.raw} units`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        display: false, // Hide the x axis for cleaner look
      },
      y: {
        stacked: true,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            family: "system-ui, -apple-system, sans-serif",
            size: 13,
            weight: '600'
          },
          color: '#334155'
        }
      }
    }
  }

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
