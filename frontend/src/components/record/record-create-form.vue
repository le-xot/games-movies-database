<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-vue-next"
import { useForm } from "vee-validate"
import { ref } from "vue"
import { z } from "zod"

const props = defineProps<{
  onSubmit: (link: string) => Promise<any>
  onCancel: () => void
  title: string
  placeholder?: string
}>()

const errorMessage = ref("")
const isSubmitting = ref(false)

const formSchema = z.object({
  link: z.url("Введите корректную ссылку"),
})

interface FormValues {
  link: string
}

const form = useForm<FormValues>({
  validationSchema: formSchema,
  initialValues: {
    link: "",
  },
})

async function submitRecordCreate(values: any) {
  isSubmitting.value = true
  errorMessage.value = ""

  try {
    await props.onSubmit(values.link)
    form.resetForm()
    props.onCancel()
  } catch (error: any) {
    errorMessage.value = error.message || "Произошла ошибка при создании записи"
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  form.resetForm()
  props.onCancel()
}
</script>

<template>
  <Form :validation-schema="formSchema" @submit="submitRecordCreate">
    <div class="space-y-4">
      <FormField v-slot="{ componentField }" name="link">
        <FormItem>
          <FormLabel>Ссылка</FormLabel>
          <Input
            v-bind="componentField"
            :placeholder="placeholder || 'https://example.com/'"
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
          {{ isSubmitting ? 'Создание...' : title }}
        </Button>
      </div>
    </div>
  </Form>
</template>
