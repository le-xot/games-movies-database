import { ref } from 'vue'
import { toast } from 'vue-sonner'

export interface ErrorHandlerOptions {
  onError?: (error: Error) => void
  showToast?: boolean
  toastTitle?: string
  toastDescription?: string
}

/**
 * Create an error handler for async operations
 * @param options Configuration for error handling
 * @returns Object with error state and handler function
 */
export function createErrorHandler(options: ErrorHandlerOptions = {}) {
  const error = ref<string | null>(null)

  async function handleAsync<T>(
    operation: () => Promise<T>,
    successMessage?: { title: string, description: string },
    errorMessage?: { title: string, description: string }
  ): Promise<T | undefined> {
    try {
      error.value = null
      const result = await operation()
      
      if (successMessage && options.showToast !== false) {
        toast(successMessage.title, { description: successMessage.description })
      }
      
      return result
    } catch (err: any) {
      error.value = err.message || 'Неизвестная ошибка'
      
      if (options.onError) {
        options.onError(err)
      }
      
      if (options.showToast !== false) {
        const title = errorMessage?.title || options.toastTitle || 'Ошибка'
        const description = errorMessage?.description || error.value || 'Неизвестная ошибка'
        toast.error(title, { description })
      }
      
      throw err
    }
  }

  return {
    error,
    handleAsync,
  }
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Неизвестная ошибка'
}
