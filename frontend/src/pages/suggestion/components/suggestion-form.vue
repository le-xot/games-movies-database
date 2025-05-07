<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AlertCircle } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { onMounted, ref, watch } from 'vue'
import { useSuggestion } from '../composables/use-suggestion'

const dialog = useDialog()
const suggestion = useSuggestion()
const isSubmitting = ref(false)
const errorMessage = ref('')

interface FormValues {
  link: string
}

const form = useForm<FormValues>({
  initialValues: {
    link: '',
  },
})

onMounted(() => {
  resetFormData()
})

function resetFormData() {
  form.resetForm()
  errorMessage.value = ''
}

watch(() => dialog.isOpen, (isOpen) => {
  if (!isOpen) {
    setTimeout(resetFormData, 300)
  }
})

function handleCancel() {
  resetFormData()
  dialog.closeDialog()
}

async function submitSuggestion(values: any) {
  if (!values.link) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await suggestion.submitSuggestion(values.link)
    form.resetForm()
    dialog.closeDialog()
  } catch (err: any) {
    let message = 'Ошибка при отправке совета'

    try {
      if (err instanceof Response || (err && typeof err.json === 'function')) {
        const errorData = await err.clone().json()
        message = errorData.message || message
      } else if (err.error && err.error.message) {
        message = err.error.message
      } else if (err.message) {
        message = err.message
      }
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError)
    }
    errorMessage.value = message || suggestion.error || 'Ошибка при отправке совета'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Form @submit="submitSuggestion">
    <div class="space-y-4">
      <FormField v-slot="{ componentField }" name="link">
        <FormItem>
          <FormLabel>Ссылка</FormLabel>
          <Input
            v-bind="componentField"
            placeholder="https://www.kinopoisk.ru/film/258687"
          />
          <FormMessage />
        </FormItem>
      </FormField>

      <div v-if="errorMessage" class="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-md">
        <AlertCircle class="h-4 w-4" />
        <span>{{ errorMessage }}</span>
      </div>

      <div class="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          @click="handleCancel"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Отправка...' : 'Отправить' }}
        </Button>
      </div>
    </div>
  </Form>
</template>
