import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserTasks } from '@/app/actions/tasks'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import Button from '@/components/ui/button/Button'
import TaskHistoryTable from '@/components/tasks/TaskHistoryTable'

export const metadata: Metadata = {
  title: 'My Tasks | Employee Performance',
  description: 'View your task submission history',
}

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const tasks = await getUserTasks()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageBreadcrumb pageTitle="My Tasks" />
        <Link href="/tasks/new">
          <Button variant="primary" size="md">
            Submit New Task
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Task History
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View all your submitted tasks and performance ratings
          </p>
        </div>

        <TaskHistoryTable tasks={tasks} />
      </div>
    </div>
  )
}
