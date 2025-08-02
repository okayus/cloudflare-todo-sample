/**
 * タスク作成フォームコンポーネント
 *
 * モダンデザインのタスク作成フォーム。
 * React Hook Form + Zod + Tailwind CSS。
 * アニメーション、アイコン、アクセシビリティ対応。
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
        description: data.description || null, // 空文字の場合はnullを送信
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
      className="space-y-6"
    >
      {/* API エラーメッセージ */}
      {errorMessage && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg animate-slide-down flex items-start">
          <svg className="w-4 h-4 mr-3 mt-0.5 text-error-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {errorMessage}
        </div>
      )}
      
      {/* タイトル入力 */}
      <div>
        <label htmlFor="title" className="form-label">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            タイトル <span className="text-error-500 ml-1">*</span>
          </span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          disabled={disabled || isSubmitting}
          className={errors.title ? 'form-input-error' : 'form-input'}
          placeholder="タスクのタイトルを入力してください"
        />
        {errors.title && (
          <p className="form-error animate-slide-down">{errors.title.message}</p>
        )}
      </div>

      {/* 説明入力 */}
      <div>
        <label htmlFor="description" className="form-label">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            説明 <span className="text-secondary-400 text-xs ml-1">(任意)</span>
          </span>
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          disabled={disabled || isSubmitting}
          className={errors.description ? 'form-input-error resize-none' : 'form-input resize-none'}
          placeholder="タスクの詳細説明を入力してください（任意）"
        />
        {errors.description && (
          <p className="form-error animate-slide-down">{errors.description.message}</p>
        )}
      </div>

      {/* 期限日入力 */}
      <div>
        <label htmlFor="dueDate" className="form-label">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            期限日 <span className="text-error-500 ml-1">*</span>
          </span>
        </label>
        <input
          id="dueDate"
          type="date"
          {...register('dueDate')}
          disabled={disabled || isSubmitting}
          className={errors.dueDate ? 'form-input-error' : 'form-input'}
          min={new Date().toISOString().split('T')[0]} // 今日以降のみ選択可能
        />
        {errors.dueDate && (
          <p className="form-error animate-slide-down">{errors.dueDate.message}</p>
        )}
      </div>

      {/* 送信ボタン */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="btn-primary w-full py-3 text-base relative overflow-hidden group transform hover:scale-[1.02] transition-all duration-200 shadow-colored hover:shadow-lg"
        >
          <span className="relative z-10 flex items-center justify-center">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                作成中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                タスクを作成
              </>
            )}
          </span>
          {!isSubmitting && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          )}
        </button>
      </div>
    </form>
  )
}