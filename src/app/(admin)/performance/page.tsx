import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOverallSkillAverages, getMonthlySkillTrends } from '@/app/actions/performance'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import SkillsOverview from '@/components/performance/SkillsOverview'
import SkillTrendChart from '@/components/performance/SkillTrendChart'

export const metadata: Metadata = {
  title: 'Performance Dashboard | Employee Performance',
  description: 'View your performance analytics and skill trends',
}

export default async function PerformancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch data in parallel
  const [skillAverages, monthlyTrends] = await Promise.all([
    getOverallSkillAverages(),
    getMonthlySkillTrends(6),
  ])

  // Debug: Log the data to check what's being fetched
  console.log('Performance Debug:', {
    all_skills_count: skillAverages.all_skills.length,
    strengths_count: skillAverages.strengths.length,
    growth_count: skillAverages.growth_opportunities.length,
    trends_count: monthlyTrends.length,
    user_id: user.id,
  })

  // Group trends by skill for charting
  const trendsBySkill = new Map<string, typeof monthlyTrends>()
  monthlyTrends.forEach((trend) => {
    if (!trendsBySkill.has(trend.skill_id)) {
      trendsBySkill.set(trend.skill_id, [])
    }
    trendsBySkill.get(trend.skill_id)!.push(trend)
  })

  // Get top 4 skills to show trends for
  const topSkillsToChart = skillAverages.strengths.slice(0, 4)

  const hasData = skillAverages.all_skills.length > 0

  return (
    <div>
      <PageBreadcrumb pageTitle="Performance Dashboard" />

      {!hasData ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            No Performance Data Yet
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Start submitting tasks to see your performance analytics and skill trends.
          </p>
          <a
            href="/tasks/new"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          >
            Submit Your First Task
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Skills Overview Section */}
          <SkillsOverview
            strengths={skillAverages.strengths}
            growthOpportunities={skillAverages.growth_opportunities}
          />

          {/* Skill Trends Section */}
          {topSkillsToChart.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Performance Trends (Last 6 Months)
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {topSkillsToChart.map((skill, index) => {
                  const skillTrends = trendsBySkill.get(skill.skill_id) || []
                  const colors = ['#465FFF', '#10B981', '#F59E0B', '#EF4444']
                  return (
                    <SkillTrendChart
                      key={skill.skill_id}
                      trends={skillTrends}
                      skillName={skill.skill_name}
                      color={colors[index % colors.length]}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Skills Tracked</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {skillAverages.all_skills.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overall Average Rating
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {skillAverages.all_skills.length > 0
                  ? (
                      skillAverages.all_skills.reduce(
                        (sum, s) => sum + s.average_rating,
                        0
                      ) / skillAverages.all_skills.length
                    ).toFixed(2)
                  : '0.00'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Ratings Submitted
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {skillAverages.all_skills.reduce(
                  (sum, s) => sum + s.rating_count,
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
