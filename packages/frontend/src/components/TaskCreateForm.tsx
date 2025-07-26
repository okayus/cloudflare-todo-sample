/**
 * タスク作成フォームコンポーネント
 *
 * 新しいタスクを作成するためのフォーム。
 * React Hook Form + Zod バリデーションを使用。
 * API連携とエラーハンドリングを含む。
 */
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Todo } from '@cloudflare-todo-sample/shared'
import { createTodo } from '../utils/todoApi'

/**
 * フォーム入力データのスキーマ
 *
 * shared packageのCreateTodoSchemaと同様だが、
 * フロントエンド特有の要件（日付入力形式等）に対応。
 */
const TaskCreateFormSchema = z.object({
  /** タスクタイトル */
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  
  /** タスク説明（任意） */
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  
  /** 期限日（YYYY-MM-DD形式） */
  dueDate: z
    .string()
    .min(1, '期限日は必須です')
    .refine(date => {
      return !isNaN(Date.parse(date))
    }, '有効な日付形式で入力してください'),
})

/**
 * フォーム入力データの型
 */
type TaskCreateFormData = z.infer<typeof TaskCreateFormSchema>

/**
 * TaskCreateForm コンポーネントのProps
 */
interface TaskCreateFormProps {
  /** タスク作成成功時のコールバック */
  onSuccess: (todo: Todo) => void
  
  /** エラー発生時のコールバック（任意） */
  onError?: (error: Error) => void
  
  /** フォームの無効化フラグ（任意） */
  disabled?: boolean
}

/**
 * 日付文字列をISO形式に変換
 *
 * YYYY-MM-DD形式の日付文字列を、
 * その日の23:59:59のISO形式に変換する。
 *
 * @param dateString - YYYY-MM-DD形式の日付文字列
 * @returns ISO形式の日時文字列
 */
function formatDateToISO(dateString: string): string {
  const date = new Date(dateString)
  // その日の23:59:59に設定
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

/**
 * エラーメッセージを抽出
 *
 * APIエラーから表示用のメッセージを抽出する。
 *
 * @param error - エラーオブジェクト
 * @returns 表示用エラーメッセージ
 */
function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'error' in error) {
    return (error as { error: string }).error
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'タスクの作成に失敗しました'
}

/**
 * タスク作成フォームコンポーネント
 *
 * @param props - コンポーネントのProps
 * @returns JSX.Element
 */
export const TaskCreateForm: React.FC<TaskCreateFormProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  /** フォームの送信中フラグ */
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  /** APIエラーメッセージ */
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /** React Hook Form の設定 */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskCreateFormData>({
    resolver: zodResolver(TaskCreateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
    },
  })

  /**
   * フォーム送信処理
   *
   * バリデーション通過後にAPI呼び出しを実行し、
   * 成功時はコールバック実行とフォームリセット、
   * 失敗時はエラー表示を行う。
   */
  const onSubmit = async (data: TaskCreateFormData) => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      // API用のデータ形式に変換
      const todoData = {
        title: data.title,
        description: data.description || '', // 空文字の場合は空文字を送信
        dueDate: formatDateToISO(data.dueDate),
      }

      // API呼び出し
      const response = await createTodo(todoData)

      if (response.success && response.data) {
        // 成功時の処理
        onSuccess(response.data)
        reset() // フォームをリセット
      } else {
        throw new Error(response.error || 'タスクの作成に失敗しました')
      }
    } catch (error) {
      // エラー時の処理
      const message = extractErrorMessage(error)
      setErrorMessage(message)
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(message))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      data-testid="task-create-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* タイトル入力 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          タイトル *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          disabled={disabled || isSubmitting}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.title
              ? 'border-red-300 text-red-900 placeholder-red-300'
              : 'border-gray-300'
          }`}
          placeholder="タスクのタイトルを入力してください"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* 説明入力 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          説明
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          disabled={disabled || isSubmitting}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.description
              ? 'border-red-300 text-red-900 placeholder-red-300'
              : 'border-gray-300'
          }`}
          placeholder="タスクの詳細説明（任意）"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* 期限日入力 */}
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
          期限日 *
        </label>
        <input
          id="dueDate"
          type="date"
          {...register('dueDate')}
          disabled={disabled || isSubmitting}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.dueDate
              ? 'border-red-300 text-red-900'
              : 'border-gray-300'
          }`}
        />
        {errors.dueDate && (
          <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
        )}
      </div>

      {/* API エラーメッセージ */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* 送信ボタン */}
      <div>
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            disabled || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? '作成中...' : 'タスクを作成'}
        </button>
      </div>
    </form>
  )
}