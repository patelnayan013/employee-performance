import React from 'react'
import { Metadata } from 'next'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import ComponentCard from '@/components/common/ComponentCard'
import TaskSubmissionForm from '@/components/tasks/TaskSubmissionForm'

export const metadata: Metadata = {
  title: 'Submit New Task | Employee Performance',
  description: 'Submit a new task with skill self-ratings',
}

export default function NewTaskPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Submit New Task" />

      <ComponentCard
        title="Task Submission"
        desc="Submit your completed task and rate your performance on each skill"
      >
        <TaskSubmissionForm />
      </ComponentCard>
    </div>
  )
}
