<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast'
import { useUser } from '@/composables/use-user'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '../ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from '../ui/input'

const { toast } = useToast()
const user = useUser()

const formSchema = toTypedSchema(z.object({
  username: z.string().min(1, 'Логин должна содержать минимум 1 символ'),
  password: z.string().min(1, 'Пароль должен содержать минимум 1 символ'),
}))

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await user.userLogin(values)
    toast({
      title: 'Successful login',
    })
  } catch {
    toast({
      title: `Invalid login data`,
    })
  }
})

async function logout() {
  try {
    await user.userLogout()
    toast({
      title: 'Successful logout',
    })
  } catch {
    toast({
      title: `Logout error`,
    })
  }
}
</script>

<template>
  <Button v-if="user.isLoggedIn" variant="destructive" @click="logout">
    Выйти
  </Button>
  <Dialog v-else>
    <DialogTrigger as-child>
      <Button>
        Войти
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <form @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="username">
          <FormItem>
            <FormLabel>Логин</FormLabel>
            <FormControl>
              <Input type="text" placeholder="Логин" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Пароль</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Пароль" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <DialogFooter>
          <Button type="submit">
            Login
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
