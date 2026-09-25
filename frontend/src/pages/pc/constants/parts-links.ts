import {
  BatteryCharging,
  Cpu,
  Fan,
  Gamepad2,
  Gpu,
  HardDrive,
  Headphones,
  Keyboard,
  MemoryStick,
  Mic,
  Microchip,
  Monitor,
  MonitorUp,
  Mouse,
  PcCase,
  Smartphone,
  SquareAsterisk,
  Workflow,
  Webcam,
} from '@lucide/vue'
import Arch from '@/pages/pc/assets/archlinux.svg?component'

interface PartLink {
  name: string
  icon: any
}

const OS: PartLink[] = [
  {
    name: 'Arch Linux LTS',
    icon: Arch,
  },
]

const SYSTEM_PARTS: PartLink[] = [
  {
    name: 'MSI B450-A PRO MAX',
    icon: Microchip,
  },
  {
    name: 'Ryzen 5 5600x',
    icon: Cpu,
  },
  {
    name: 'Radeon RX 7700 XT GAMING OC 12G',
    icon: Gpu,
  },
  {
    name: 'Crucial Ballistix 32GB 3600MHz DDR4',
    icon: MemoryStick,
  },
  {
    name: 'MONTECH GAMMA II 650',
    icon: BatteryCharging,
  },
  {
    name: 'SE-224-XT',
    icon: Fan,
  },
  {
    name: 'Samsung PM9A1 1Tb',
    icon: HardDrive,
  },
  {
    name: 'Samsung 870 EVO 250Gb',
    icon: HardDrive,
  },
  {
    name: 'WDC WD10EZEX-60M2NA0',
    icon: HardDrive,
  },
  {
    name: 'XPG DEFENDER Black',
    icon: PcCase,
  },
]

const MONITORS: PartLink[] = [
  {
    name: 'P27QDA-RGP: 27" QHD 180Hz',
    icon: Monitor,
  },
  {
    name: 'AQ27H1: 27" QHD 165Hz',
    icon: Monitor,
  },
  {
    name: 'VA2246-LED: 22" FHD 60Hz',
    icon: Monitor,
  },
  {
    name: 'ONKRON G280',
    icon: MonitorUp,
  },
]

const DEVICES: PartLink[] = [
  {
    name: 'AKKO 5087S',
    icon: Keyboard,
  },
  {
    name: 'Akko V3 Penguin Tactile Silent',
    icon: SquareAsterisk,
  },
  {
    name: 'VXE DragonFly R1 PRO',
    icon: Mouse,
  },
  {
    name: 'ATH-M20XBT',
    icon: Headphones,
  },
  {
    name: 'Maono AU-A04',
    icon: Mic,
  },
  {
    name: 'Fifine BM88',
    icon: Workflow,
  },
  {
    name: 'Logitech HD Pro C920',
    icon: Webcam,
  },
  {
    name: 'Thundeal TD92 Pro',
    icon: Monitor,
  },
  {
    name: 'Google Pixel 10a',
    icon: Smartphone,
  },
  {
    name: 'Google Pixel Buds 2a',
    icon: Headphones,
  },
  {
    name: 'Nintendo Switch 2',
    icon: Gamepad2,
  },
  {
    name: '8BitDo Ultimate 2.4G white',
    icon: Gamepad2,
  },
]

export const hardware: Record<string, PartLink[]> = {
  'Операционные системы': OS,
  Железки: SYSTEM_PARTS,
  Мониторы: MONITORS,
  Девайсы: DEVICES,
}
