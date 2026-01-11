'use client'

import React from 'react'
import { ApexOptions } from 'apexcharts'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import type { SkillTrend } from '@/types/skills'

// Dynamically import ReactApexChart for SSR compatibility
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
})

interface SkillTrendChartProps {
  trends: SkillTrend[]
  skillName: string
  color?: string
}

export default function SkillTrendChart({
  trends,
  skillName,
  color = '#465FFF',
}: SkillTrendChartProps) {
  // Sort trends by period
  const sortedTrends = [...trends].sort((a, b) => a.period.localeCompare(b.period))

  // Format dates for display
  const categories = sortedTrends.map((trend) =>
    format(new Date(trend.period), 'MMM yyyy')
  )

  const data = sortedTrends.map((trend) => trend.average_rating)

  const options: ApexOptions = {
    legend: {
      show: false,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: [color],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      height: 300,
      type: 'line',
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    markers: {
      size: 4,
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (value) => value.toFixed(2),
      },
    },
    xaxis: {
      type: 'category',
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: ['#6B7280'],
        },
      },
    },
    yaxis: {
      min: 0,
      max: 5,
      tickAmount: 5,
      labels: {
        style: {
          fontSize: '12px',
          colors: ['#6B7280'],
        },
        formatter: (value) => value.toFixed(1),
      },
      title: {
        text: 'Rating',
        style: {
          fontSize: '12px',
          color: '#6B7280',
        },
      },
    },
  }

  const series = [
    {
      name: skillName,
      data,
    },
  ]

  if (trends.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          {skillName}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No trend data available for this skill
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h4 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
        {skillName} - Trend Over Time
      </h4>
      <div className="max-w-full overflow-x-auto">
        <ReactApexChart options={options} series={series} type="line" height={300} />
      </div>
    </div>
  )
}
