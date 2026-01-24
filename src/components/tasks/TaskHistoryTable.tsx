'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { deleteTask } from '@/app/actions/tasks'
import type { TaskWithDetails } from '@/types/skills'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Badge from '@/components/ui/badge/Badge'
import { EyeIcon, TrashBinIcon } from '@/icons'

interface TaskHistoryTableProps {
  tasks: TaskWithDetails[]
  onTaskDeleted?: () => void
}

export default function TaskHistoryTable({
  tasks,
  onTaskDeleted,
}: TaskHistoryTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    setDeleting(taskId)
    try {
      const result = await deleteTask(taskId)
      if (result.error) {
        alert(`Error: ${result.error}`)
      } else {
        if (onTaskDeleted) {
          onTaskDeleted()
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('An error occurred while deleting the task')
    } finally {
      setDeleting(null)
    }
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

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
        <p className="text-gray-500 dark:text-gray-400">
          No tasks submitted yet. Start by submitting your first task!
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Task Title
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Priority
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Avg Rating
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  On Time?
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Manager Issues?
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                    {format(new Date(task.task_date), 'MMM dd, yyyy')}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-start">
                    <div>
                      <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {task.title}
                      </p>
                      {task.external_link && (
                        <a
                          href={task.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-theme-xs text-brand-500 hover:underline dark:text-brand-400"
                        >
                          View Link
                        </a>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-start">
                    <Badge
                      size="sm"
                      color={getPriorityBadgeColor(task.priority) as any}
                    >
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-start">
                    <Badge
                      size="sm"
                      color={getRatingBadgeColor(task.average_rating || 0) as any}
                    >
                      {(task.average_rating || 0).toFixed(1)}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-start">
                    <Badge
                      size="sm"
                      color={task.delivered_on_time ? 'success' : 'error'}
                    >
                      {task.delivered_on_time ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-start">
                    <Badge
                      size="sm"
                      color={task.manager_found_issues ? 'error' : 'success'}
                    >
                      {task.manager_found_issues ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-end">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10"
                        title="View task details"
                      >
                        <EyeIcon className="fill-brand-500 dark:fill-brand-400" />
                      </Link>
                      <button
                        onClick={() => handleDelete(task.id)}
                        disabled={deleting === task.id}
                        className="inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-error-500/10"
                        title={deleting === task.id ? 'Deleting...' : 'Delete task'}
                      >
                        <TrashBinIcon className="fill-error-500 dark:fill-error-400" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
