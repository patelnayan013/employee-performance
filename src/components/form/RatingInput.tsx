'use client'

import React from 'react'
import { RATING_LABELS } from '@/types/skills'

interface RatingInputProps {
  skillName: string
  skillId: string
  value: number | null
  onChange: (skillId: string, rating: number) => void
  required?: boolean
}

const RatingInput: React.FC<RatingInputProps> = ({
  skillName,
  skillId,
  value,
  onChange,
  required = true,
}) => {
  const ratings = [1, 2, 3, 4, 5]

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {skillName}
          {required && <span className="ml-1 text-error-500">*</span>}
        </label>
        {value && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {RATING_LABELS[value as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(skillId, rating)}
            className={`
              flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] text-sm font-semibold transition-all
              ${
                value === rating
                  ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-400 dark:hover:bg-brand-500/10'
              }
            `}
          >
            {rating}
          </button>
        ))}
      </div>

      {value && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {value === 1 && 'Significant improvement needed'}
          {value === 2 && 'Below expectations'}
          {value === 3 && 'Meets expectations'}
          {value === 4 && 'Exceeds expectations'}
          {value === 5 && 'Outstanding performance'}
        </p>
      )}
    </div>
  )
}

export default RatingInput
