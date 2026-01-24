import React from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getTaskById } from '@/app/actions/tasks'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import ComponentCard from '@/components/common/ComponentCard'
import Badge from '@/components/ui/badge/Badge'
import Button from '@/components/ui/button/Button'

export const metadata: Metadata = {
  title: 'Task Details | Employee Performance',
  description: 'View detailed information about a submitted task',
}

interface TaskViewPageProps {
  params: {
    id: string
  }
}

export default async function TaskViewPage({ params }: TaskViewPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const { id } = await params
  const task = await getTaskById(id)

  if (!task) {
    notFound()
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'light'
    }
  }

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4.5) return 'success'
    if (rating >= 3.5) return 'primary'
    if (rating >= 2.5) return 'warning'
    return 'error'
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageBreadcrumb pageTitle="Task Details" />
        <Link href="/tasks">
          <Button variant="outline" size="md">
            Back to Tasks
          </Button>
        </Link>
      </div>

      {/* Task Overview Card */}
      <ComponentCard title="Task Overview" desc="View task details and performance ratings">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Title
              </label>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {task.title}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Date
              </label>
              <p className="text-base text-gray-900 dark:text-white">
                {format(new Date(task.task_date), 'MMMM dd, yyyy')}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <Badge size="md" color={getPriorityBadgeColor(task.priority) as any}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Average Rating
              </label>
              <Badge size="md" color={getRatingBadgeColor(task.average_rating || 0) as any}>
                {(task.average_rating || 0).toFixed(2)} / 5.00
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <p className="text-base text-gray-900 dark:text-white/90 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          {/* External Link */}
          {task.external_link && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                External Link
              </label>
              <a
                href={task.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 hover:underline dark:text-brand-400"
              >
                {task.external_link}
              </a>
            </div>
          )}

          {/* Delivery and Manager Feedback */}
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Delivery & Manager Feedback
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Delivered On Time
                </label>
                <Badge size="md" color={task.delivered_on_time ? 'success' : 'error'}>
                  {task.delivered_on_time ? 'Yes' : 'No'}
                </Badge>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Manager Found Issues
                </label>
                <Badge size="md" color={task.manager_found_issues ? 'error' : 'success'}>
                  {task.manager_found_issues ? 'Yes' : 'No'}
                </Badge>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Manager Helped Analysis
                </label>
                <Badge size="md" color={task.manager_helped_analysis ? 'success' : 'light'}>
                  {task.manager_helped_analysis ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {task.manager_found_issues && task.manager_notes && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Manager Notes
                </label>
                <p className="rounded-lg bg-gray-50 p-4 text-base text-gray-900 dark:bg-gray-800 dark:text-white/90 whitespace-pre-wrap">
                  {task.manager_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </ComponentCard>

      {/* Skill Ratings Card */}
      <div className="mt-6">
        <ComponentCard
          title="Skill Ratings"
          desc={`Performance ratings for ${task.skill_ratings?.length || 0} skills`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {task.skill_ratings && task.skill_ratings.length > 0 ? (
              task.skill_ratings.map((rating: any) => (
                <div
                  key={rating.skill_id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {rating.skill?.name || 'Unknown Skill'}
                    </h4>
                    <Badge size="sm" color={getRatingBadgeColor(rating.rating) as any}>
                      {rating.rating}/5
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= rating.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                No skill ratings available
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </div>
  )
}
