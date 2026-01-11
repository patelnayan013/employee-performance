'use server'

import { createClient } from '@/lib/supabase/server'
import type { PerformanceSummary, SkillAverage, SkillTrend } from '@/types/skills'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Not authenticated')
  }

  return user
}

export async function getOverallSkillAverages(): Promise<{
  all_skills: SkillAverage[]
  strengths: SkillAverage[]
  growth_opportunities: SkillAverage[]
}> {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_overall_skill_averages', {
      p_user_id: user.id,
    })

    if (error) {
      // If RPC doesn't exist, fallback to manual query
      const { data: manualData, error: manualError } = await supabase
        .from('skill_ratings')
        .select(`
          rating,
          skill:skills (
            id,
            name
          ),
          task:tasks!inner (
            user_id
          )
        `)
        .eq('task.user_id', user.id)

      if (manualError) {
        console.error('Error fetching skill averages:', manualError)
        return { all_skills: [], strengths: [], growth_opportunities: [] }
      }

      console.log('Manual data sample:', manualData?.[0])

      // Group by skill and calculate averages
      const skillMap = new Map<string, { ratings: number[]; name: string }>()

      manualData.forEach((item: any) => {
        // Handle both object and array formats from Supabase
        const skill = Array.isArray(item.skill) ? item.skill[0] : item.skill

        if (skill?.id && skill?.name) {
          if (!skillMap.has(skill.id)) {
            skillMap.set(skill.id, { ratings: [], name: skill.name })
          }
          skillMap.get(skill.id)!.ratings.push(item.rating)
        }
      })

      const all_skills: SkillAverage[] = Array.from(skillMap.entries()).map(
        ([skill_id, { ratings, name }]) => ({
          skill_id,
          skill_name: name,
          average_rating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          rating_count: ratings.length,
          min_rating: Math.min(...ratings),
          max_rating: Math.max(...ratings),
        })
      )

      // Sort by average rating
      all_skills.sort((a, b) => b.average_rating - a.average_rating)

      const strengths = all_skills.slice(0, 5)
      const growth_opportunities = all_skills.slice(-5).reverse()

      return { all_skills, strengths, growth_opportunities }
    }

    // Process RPC result
    const all_skills: SkillAverage[] = data || []
    all_skills.sort((a, b) => b.average_rating - a.average_rating)

    const strengths = all_skills.slice(0, 5)
    const growth_opportunities = all_skills.slice(-5).reverse()

    return { all_skills, strengths, growth_opportunities }
  } catch (error) {
    console.error('Error in getOverallSkillAverages:', error)
    return { all_skills: [], strengths: [], growth_opportunities: [] }
  }
}

export async function getWeeklySkillTrends(weekCount: number = 12): Promise<SkillTrend[]> {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - weekCount * 7)

    const { data, error } = await supabase
      .from('skill_ratings')
      .select(`
        rating,
        skill:skills (
          id,
          name
        ),
        task:tasks!inner (
          user_id,
          task_date
        )
      `)
      .eq('task.user_id', user.id)
      .gte('task.task_date', startDate.toISOString().split('T')[0])
      .lte('task.task_date', endDate.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching weekly skill trends:', error)
      return []
    }

    // Group by skill and week
    const trendMap = new Map<string, Map<string, number[]>>()

    data.forEach((item: any) => {
      // Handle both object and array formats from Supabase
      const skill = Array.isArray(item.skill) ? item.skill[0] : item.skill
      const task = Array.isArray(item.task) ? item.task[0] : item.task

      if (skill?.id && task?.task_date) {
        const taskDate = new Date(task.task_date)

        // Get Monday of the week
        const weekStart = new Date(taskDate)
        weekStart.setDate(taskDate.getDate() - taskDate.getDay() + 1)
        const weekKey = weekStart.toISOString().split('T')[0]

        if (!trendMap.has(skill.id)) {
          trendMap.set(skill.id, new Map())
        }

        const skillWeeks = trendMap.get(skill.id)!
        if (!skillWeeks.has(weekKey)) {
          skillWeeks.set(weekKey, [])
        }

        skillWeeks.get(weekKey)!.push(item.rating)
      }
    })

    // Convert to SkillTrend array
    const trends: SkillTrend[] = []

    trendMap.forEach((weeks, skillId) => {
      weeks.forEach((ratings, weekKey) => {
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

        // Get skill name from the data
        const skillData = data.find((item: any) => {
          const skill = Array.isArray(item.skill) ? item.skill[0] : item.skill
          return skill?.id === skillId
        })
        const skill = Array.isArray(skillData?.skill) ? skillData.skill[0] : skillData?.skill
        const skillName = skill?.name || 'Unknown'

        trends.push({
          skill_id: skillId,
          skill_name: skillName,
          period: weekKey,
          average_rating: avgRating,
          rating_count: ratings.length,
        })
      })
    })

    // Sort by period
    trends.sort((a, b) => a.period.localeCompare(b.period))

    return trends
  } catch (error) {
    console.error('Error in getWeeklySkillTrends:', error)
    return []
  }
}

export async function getMonthlySkillTrends(monthCount: number = 6): Promise<SkillTrend[]> {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthCount)

    const { data, error } = await supabase
      .from('skill_ratings')
      .select(`
        rating,
        skill:skills (
          id,
          name
        ),
        task:tasks!inner (
          user_id,
          task_date
        )
      `)
      .eq('task.user_id', user.id)
      .gte('task.task_date', startDate.toISOString().split('T')[0])
      .lte('task.task_date', endDate.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching monthly skill trends:', error)
      return []
    }

    // Group by skill and month
    const trendMap = new Map<string, Map<string, number[]>>()

    data.forEach((item: any) => {
      // Handle both object and array formats from Supabase
      const skill = Array.isArray(item.skill) ? item.skill[0] : item.skill
      const task = Array.isArray(item.task) ? item.task[0] : item.task

      if (skill?.id && task?.task_date) {
        const taskDate = new Date(task.task_date)

        // Get first day of month
        const monthStart = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1)
        const monthKey = monthStart.toISOString().split('T')[0]

        if (!trendMap.has(skill.id)) {
          trendMap.set(skill.id, new Map())
        }

        const skillMonths = trendMap.get(skill.id)!
        if (!skillMonths.has(monthKey)) {
          skillMonths.set(monthKey, [])
        }

        skillMonths.get(monthKey)!.push(item.rating)
      }
    })

    // Convert to SkillTrend array
    const trends: SkillTrend[] = []

    trendMap.forEach((months, skillId) => {
      months.forEach((ratings, monthKey) => {
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

        // Get skill name from the data
        const skillData = data.find((item: any) => {
          const skill = Array.isArray(item.skill) ? item.skill[0] : item.skill
          return skill?.id === skillId
        })
        const skill = Array.isArray(skillData?.skill) ? skillData.skill[0] : skillData?.skill
        const skillName = skill?.name || 'Unknown'

        trends.push({
          skill_id: skillId,
          skill_name: skillName,
          period: monthKey,
          average_rating: avgRating,
          rating_count: ratings.length,
        })
      })
    })

    // Sort by period
    trends.sort((a, b) => a.period.localeCompare(b.period))

    return trends
  } catch (error) {
    console.error('Error in getMonthlySkillTrends:', error)
    return []
  }
}

export async function getPerformanceSummary(
  startDate?: string,
  endDate?: string
): Promise<PerformanceSummary> {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    // Build query
    let tasksQuery = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)

    if (startDate) {
      tasksQuery = tasksQuery.gte('task_date', startDate)
    }
    if (endDate) {
      tasksQuery = tasksQuery.lte('task_date', endDate)
    }

    const { data: tasks, error: tasksError } = await tasksQuery

    if (tasksError) {
      console.error('Error fetching tasks for summary:', tasksError)
      throw new Error('Failed to fetch performance summary')
    }

    const total_tasks = tasks?.length || 0

    if (total_tasks === 0) {
      return {
        total_tasks: 0,
        overall_average: 0,
        skill_averages: [],
        strengths: [],
        growth_opportunities: [],
        on_time_delivery_rate: 0,
        manager_issues_rate: 0,
        manager_helped_rate: 0,
      }
    }

    // Calculate delivery and manager metrics
    const on_time_count = tasks?.filter((t) => t.delivered_on_time).length || 0
    const manager_issues_count = tasks?.filter((t) => t.manager_found_issues).length || 0
    const manager_helped_count = tasks?.filter((t) => t.manager_helped_analysis).length || 0

    const on_time_delivery_rate = (on_time_count / total_tasks) * 100
    const manager_issues_rate = (manager_issues_count / total_tasks) * 100
    const manager_helped_rate = (manager_helped_count / total_tasks) * 100

    // Get skill averages for the period
    const { all_skills, strengths, growth_opportunities } = await getOverallSkillAverages()

    const overall_average = all_skills.length > 0
      ? all_skills.reduce((sum, skill) => sum + skill.average_rating, 0) / all_skills.length
      : 0

    return {
      total_tasks,
      overall_average,
      skill_averages: all_skills,
      strengths,
      growth_opportunities,
      on_time_delivery_rate,
      manager_issues_rate,
      manager_helped_rate,
    }
  } catch (error) {
    console.error('Error in getPerformanceSummary:', error)
    return {
      total_tasks: 0,
      overall_average: 0,
      skill_averages: [],
      strengths: [],
      growth_opportunities: [],
      on_time_delivery_rate: 0,
      manager_issues_rate: 0,
      manager_helped_rate: 0,
    }
  }
}
