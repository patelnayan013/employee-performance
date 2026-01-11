'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Skill, Task, TaskWithDetails, TaskSubmissionFormData } from '@/types/skills'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Not authenticated')
  }

  return user
}

export async function getAllSkills(): Promise<Skill[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching skills:', error)
    throw new Error('Failed to fetch skills')
  }

  return data || []
}

export async function submitTask(formData: TaskSubmissionFormData) {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    // Validate all skills are rated
    const skills = await getAllSkills()
    if (formData.skill_ratings.size !== skills.length) {
      return { error: 'All skills must be rated' }
    }

    // Insert task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        task_date: formData.task_date,
        external_link: formData.external_link || null,
        priority: formData.priority,
        delivered_on_time: formData.delivered_on_time,
        manager_found_issues: formData.manager_found_issues,
        manager_notes: formData.manager_notes || null,
        manager_helped_analysis: formData.manager_helped_analysis,
      })
      .select()
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return { error: 'Failed to create task' }
    }

    // Insert skill ratings
    const ratingsToInsert = Array.from(formData.skill_ratings.entries()).map(
      ([skill_id, rating]) => ({
        task_id: task.id,
        skill_id,
        rating,
      })
    )

    const { error: ratingsError } = await supabase
      .from('skill_ratings')
      .insert(ratingsToInsert)

    if (ratingsError) {
      console.error('Error creating skill ratings:', ratingsError)
      // Rollback: delete the task
      await supabase.from('tasks').delete().eq('id', task.id)
      return { error: 'Failed to save skill ratings' }
    }

    revalidatePath('/tasks')
    revalidatePath('/performance')

    return { success: true, task }
  } catch (error) {
    console.error('Error in submitTask:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function updateTask(taskId: string, formData: TaskSubmissionFormData) {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    // Verify ownership
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return { error: 'Task not found' }
    }

    if (existingTask.user_id !== user.id) {
      return { error: 'Not authorized to update this task' }
    }

    // Validate all skills are rated
    const skills = await getAllSkills()
    if (formData.skill_ratings.size !== skills.length) {
      return { error: 'All skills must be rated' }
    }

    // Update task
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        title: formData.title,
        description: formData.description,
        task_date: formData.task_date,
        external_link: formData.external_link || null,
        priority: formData.priority,
        delivered_on_time: formData.delivered_on_time,
        manager_found_issues: formData.manager_found_issues,
        manager_notes: formData.manager_notes || null,
        manager_helped_analysis: formData.manager_helped_analysis,
      })
      .eq('id', taskId)

    if (taskError) {
      console.error('Error updating task:', taskError)
      return { error: 'Failed to update task' }
    }

    // Delete existing ratings
    await supabase.from('skill_ratings').delete().eq('task_id', taskId)

    // Insert new skill ratings
    const ratingsToInsert = Array.from(formData.skill_ratings.entries()).map(
      ([skill_id, rating]) => ({
        task_id: taskId,
        skill_id,
        rating,
      })
    )

    const { error: ratingsError } = await supabase
      .from('skill_ratings')
      .insert(ratingsToInsert)

    if (ratingsError) {
      console.error('Error updating skill ratings:', ratingsError)
      return { error: 'Failed to update skill ratings' }
    }

    revalidatePath('/tasks')
    revalidatePath('/performance')

    return { success: true }
  } catch (error) {
    console.error('Error in updateTask:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function deleteTask(taskId: string) {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    // Verify ownership
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return { error: 'Task not found' }
    }

    if (existingTask.user_id !== user.id) {
      return { error: 'Not authorized to delete this task' }
    }

    // Delete task (cascades to skill_ratings)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      return { error: 'Failed to delete task' }
    }

    revalidatePath('/tasks')
    revalidatePath('/performance')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteTask:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function getUserTasks(
  userId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<TaskWithDetails[]> {
  try {
    const user = await getCurrentUser()
    const targetUserId = userId || user.id

    // Only allow users to fetch their own tasks
    if (targetUserId !== user.id) {
      throw new Error('Not authorized to view these tasks')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        skill_ratings (
          *,
          skill:skills (*)
        )
      `)
      .eq('user_id', targetUserId)
      .order('task_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching user tasks:', error)
      throw new Error('Failed to fetch tasks')
    }

    // Calculate average rating for each task
    const tasksWithAverages = (data || []).map((task) => {
      const ratings = task.skill_ratings || []
      const average_rating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0

      return {
        ...task,
        average_rating,
      }
    })

    return tasksWithAverages
  } catch (error) {
    console.error('Error in getUserTasks:', error)
    return []
  }
}

export async function getTaskById(taskId: string): Promise<TaskWithDetails | null> {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        skill_ratings (
          *,
          skill:skills (*)
        )
      `)
      .eq('id', taskId)
      .single()

    if (error || !data) {
      console.error('Error fetching task:', error)
      return null
    }

    // Verify ownership
    if (data.user_id !== user.id) {
      throw new Error('Not authorized to view this task')
    }

    // Calculate average rating
    const ratings = data.skill_ratings || []
    const average_rating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

    return {
      ...data,
      average_rating,
    }
  } catch (error) {
    console.error('Error in getTaskById:', error)
    return null
  }
}
