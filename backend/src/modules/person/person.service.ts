import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { PatchPersonDTO } from './person.dto'
import { PersonEntity } from './person.entity'

@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  async createPerson(name: string, color?: string): Promise<PersonEntity> {
    const existingPerson = await this.findPersonByName(name)
    if (existingPerson) {
      return
    }
    return this.prisma.person.create({
      data: { name, color },
    })
  }

  async deletePersonById(id: number): Promise<void> {
    const person = await this.findPersonById(id)
    if (!person) {
      return
    }
    await this.prisma.person.delete({ where: { id } })
  }

  async deletePersonByName(name: string): Promise<void> {
    const person = await this.findPersonByName(name)
    if (!person) {
      return
    }
    await this.prisma.person.delete({ where: { name } })
  }

  findPersonById(id: number): Promise<PersonEntity> {
    return this.prisma.person.findUnique({ where: { id } })
  }

  findPersonByName(name: string): Promise<PersonEntity> {
    return this.prisma.person.findUnique({ where: { name } })
  }

  patchPerson(id: number, body: PatchPersonDTO): Promise<PersonEntity> {
    return this.prisma.person.update({
      where: { id },
      data: body,
    })
  }

  getAllPersons(): Promise<PersonEntity[]> {
    return this.prisma.person.findMany({
      orderBy: { name: 'desc' },
    })
  }
}
