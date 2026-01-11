import React from 'react'
import type { SkillAverage } from '@/types/skills'
import Badge from '@/components/ui/badge/Badge'

interface SkillsOverviewProps {
  strengths: SkillAverage[]
  growthOpportunities: SkillAverage[]
}

export default function SkillsOverview({
  strengths,
  growthOpportunities,
}: SkillsOverviewProps) {
  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4.5) return 'success'
    if (rating >= 3.5) return 'primary'
    if (rating >= 2.5) return 'warning'
    return 'error'
  }

  const renderSkillList = (skills: SkillAverage[], title: string, icon: string) => {
    if (skills.length === 0) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {icon} {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No data available yet. Submit more tasks to see your {title.toLowerCase()}.
          </p>
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {icon} {title}
        </h3>
        <div className="space-y-3">
          {skills.map((skill, index) => (
            <div
              key={skill.skill_id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {skill.skill_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {skill.rating_count} rating{skill.rating_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge
                size="sm"
                color={getRatingBadgeColor(skill.average_rating) as any}
              >
                {skill.average_rating.toFixed(1)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {renderSkillList(strengths, 'Your Strengths', '🌟')}
      {renderSkillList(growthOpportunities, 'Growth Opportunities', '📈')}
    </div>
  )
}
