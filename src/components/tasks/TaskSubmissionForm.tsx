'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllSkills, submitTask } from '@/app/actions/tasks'
import type { Skill, TaskSubmissionFormData, PRIORITY_OPTIONS } from '@/types/skills'
import RatingInput from '@/components/form/RatingInput'
import InputField from '@/components/form/input/InputField'
import TextArea from '@/components/form/input/TextArea'
import Radio from '@/components/form/input/Radio'
import Select from '@/components/form/Select'
import Button from '@/components/ui/button/Button'
import Label from '@/components/form/Label'
import DatePicker from '@/components/form/date-picker'

const PRIORITY_OPTIONS_DATA = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function TaskSubmissionForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0])
  const [externalLink, setExternalLink] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [deliveredOnTime, setDeliveredOnTime] = useState<boolean>(true)
  const [managerFoundIssues, setManagerFoundIssues] = useState<boolean>(false)
  const [managerNotes, setManagerNotes] = useState('')
  const [managerHelpedAnalysis, setManagerHelpedAnalysis] = useState<boolean>(false)
  const [skillRatings, setSkillRatings] = useState<Map<string, number>>(new Map())

  // Load skills on mount
  useEffect(() => {
    async function loadSkills() {
      try {
        const fetchedSkills = await getAllSkills()
        setSkills(fetchedSkills)
      } catch (err) {
        setError('Failed to load skills')
        console.error(err)
      }
    }
    loadSkills()
  }, [])

  const handleRatingChange = (skillId: string, rating: number) => {
    setSkillRatings((prev) => {
      const updated = new Map(prev)
      updated.set(skillId, rating)
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate at least one skill is rated
    if (skillRatings.size === 0) {
      setError('Please rate at least one skill before submitting')
      return
    }

    // Validate required fields
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required')
      return
    }

    setLoading(true)

    try {
      const formData: TaskSubmissionFormData = {
        title,
        description,
        task_date: taskDate,
        external_link: externalLink || undefined,
        priority,
        delivered_on_time: deliveredOnTime,
        manager_found_issues: managerFoundIssues,
        manager_notes: managerFoundIssues && managerNotes ? managerNotes : undefined,
        manager_helped_analysis: managerHelpedAnalysis,
        skill_ratings: skillRatings,
      }

      const result = await submitTask(formData)

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/tasks')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-300 bg-error-50 p-4 text-sm text-error-800 dark:border-error-500/50 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Task Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Task Information
        </h3>

        <div>
          <Label htmlFor="title">
            Task Title <span className="text-error-500">*</span>
          </Label>
          <InputField
            id="title"
            type="text"
            placeholder="Enter task title"
            defaultValue={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="description">
            Description <span className="text-error-500">*</span>
          </Label>
          <TextArea
            placeholder="Describe the task in detail"
            rows={4}
            value={description}
            onChange={setDescription}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <DatePicker
              id="task-date"
              label="Task Date"
              defaultDate={taskDate}
              onChange={(selectedDates) => {
                if (selectedDates.length > 0) {
                  setTaskDate(selectedDates[0].toISOString().split('T')[0])
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              options={PRIORITY_OPTIONS_DATA}
              defaultValue={priority}
              onChange={(value) => setPriority(value as 'high' | 'medium' | 'low')}
              placeholder="Select priority"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="external-link">External Link (Optional)</Label>
          <InputField
            id="external-link"
            type="url"
            placeholder="e.g., GitHub PR link, ticket URL"
            defaultValue={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Delivery and Manager Feedback */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Delivery & Manager Feedback
          </h4>

          <div>
            <Label>
              Was the task delivered on time? <span className="text-error-500">*</span>
            </Label>
            <div className="mt-2 flex gap-4">
              <Radio
                id="on-time-yes"
                name="delivered_on_time"
                value="yes"
                checked={deliveredOnTime === true}
                label="Yes"
                onChange={() => setDeliveredOnTime(true)}
                disabled={loading}
              />
              <Radio
                id="on-time-no"
                name="delivered_on_time"
                value="no"
                checked={deliveredOnTime === false}
                label="No"
                onChange={() => setDeliveredOnTime(false)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label>
              Did the manager find issues? <span className="text-error-500">*</span>
            </Label>
            <div className="mt-2 flex gap-4">
              <Radio
                id="manager-issues-yes"
                name="manager_found_issues"
                value="yes"
                checked={managerFoundIssues === true}
                label="Yes"
                onChange={() => setManagerFoundIssues(true)}
                disabled={loading}
              />
              <Radio
                id="manager-issues-no"
                name="manager_found_issues"
                value="no"
                checked={managerFoundIssues === false}
                label="No"
                onChange={() => setManagerFoundIssues(false)}
                disabled={loading}
              />
            </div>
          </div>

          {managerFoundIssues && (
            <div>
              <Label htmlFor="manager-notes">Manager Notes</Label>
              <TextArea
                placeholder="Describe what issues were found"
                rows={3}
                value={managerNotes}
                onChange={setManagerNotes}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <Label>
              Did the manager help with task analysis?{' '}
              <span className="text-error-500">*</span>
            </Label>
            <div className="mt-2 flex gap-4">
              <Radio
                id="manager-helped-yes"
                name="manager_helped_analysis"
                value="yes"
                checked={managerHelpedAnalysis === true}
                label="Yes"
                onChange={() => setManagerHelpedAnalysis(true)}
                disabled={loading}
              />
              <Radio
                id="manager-helped-no"
                name="manager_helped_analysis"
                value="no"
                checked={managerHelpedAnalysis === false}
                label="No"
                onChange={() => setManagerHelpedAnalysis(false)}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills Rating Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Skills Self-Rating
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {skillRatings.size} / {skills.length} rated
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Rate your performance on each skill (1 = Poor, 5 = Excellent)
        </p>

        <div className="space-y-3">
          {skills.map((skill) => (
            <RatingInput
              key={skill.id}
              skillId={skill.id}
              skillName={skill.name}
              value={skillRatings.get(skill.id) || null}
              onChange={handleRatingChange}
              required
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/tasks')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Task'}
        </Button>
      </div>
    </form>
  )
}
