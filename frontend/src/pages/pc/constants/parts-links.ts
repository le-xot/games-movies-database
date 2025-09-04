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
  Mouse,
  PcCase,
  Webcam,
} from 'lucide-vue-next'

import Arch from '../components/archlinux.svg'
import Atlas from '../components/atlasos.svg'

interface PartLink {
  name: string
  icon: any
  url: string
}

const OS: PartLink[] = [
  {
    name: 'Arch Linux LTS',
    icon: Arch,
    url: 'https://archlinux.org/download/',
  },
  {
    name: 'AtlasOS',
    icon: Atlas,
    url: 'https://atlasos.net/',
  },
]

const SYSTEM_PARTS: PartLink[] = [
  {
    name: 'MSI B450-A PRO MAX',
    icon: Microchip,
    url: 'https://www.msi.com/Motherboard/B450-A-PRO-MAX/Specification',
  },
  {
    name: 'Ryzen 5 5600x',
    icon: Cpu,
    url: 'https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-5-5600x.html',
  },
  {
    name: 'Radeon RX 7700 XT GAMING OC 12G',
    icon: Gpu,
    url: 'https://www.gigabyte.com/us/Graphics-Card/GV-R77XTGAMING-OC-12GD#kf',
  },
  {
    name: 'Crucial Ballistix 32GB 3600MHz DDR4',
    icon: MemoryStick,
    url: 'https://www.crucial.com/memory/ddr4/CT8G4DFRA32A',
  },
  {
    name: 'MONTECH GAMMA II 650',
    icon: BatteryCharging,
    url: 'https://www.montechpc.com/en/products_detail.php?nid=46&s_ok2',
  },
  {
    name: 'SE-224-XT',
    icon: Fan,
    url: 'https://www.idcooling.com/product/detail?id=187&name=SE-224-XT%20Basic',
  },
  {
    name: 'Samsung PM9A1 1Tb',
    icon: HardDrive,
    url: 'https://semiconductor.samsung.com/ssd/pc-ssd/pm9a1/',
  },
  {
    name: 'Samsung 870 EVO 250Gb',
    icon: HardDrive,
    url: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/870evo/',
  },
  {
    name: 'WDC WD10EZEX-60M2NA0',
    icon: HardDrive,
    url: 'https://www.westerndigital.com/products/internal-drives/wd-blue-desktop-sata-hdd?sku=WD10EZEX',
  },
  {
    name: 'XPG DEFENDER Black',
    icon: PcCase,
    url: 'https://www.xpg.com/us/xpg/840',
  },
]

const MONITORS: PartLink[] = [
  {
    name: 'AQ27H1: 27" QHD 165Hz',
    icon: Monitor,
    url: 'https://ardor-gaming.com/product/29398811/27-pro-monitor-ardor-gaming-infinity-pro-aq27h1/',
  },
  {
    name: 'S24E500C: 23" FHD 60Hz',
    icon: Monitor,
    url: 'https://www.samsung.com/ru/support/model/LS24E500CS/CI/',
  },
  {
    name: 'VA2246-LED: 22" FHD 60Hz',
    icon: Monitor,
    url: 'https://www.viewsonic.com/eu/products/sheet/VA2246-LED',
  },
]

const DEVICES: PartLink[] = [
  {
    name: 'Maono AU-A04',
    icon: Mic,
    url: 'https://www.maono.com/products/usb-microphone-kit-maono-au-a04?srsltid=AfmBOoqb4Mn_kFeH-rJ2l0D-nCFC4dAlo_VbD-MMGlZk9Sfn8_dtdwTk',
  },
  {
    name: 'ATH-M20XBT',
    icon: Headphones,
    url: 'https://www.audio-technica.com/en-eu/ath-m20xbt',
  },
  {
    name: 'Logitech HD Pro C920',
    icon: Webcam,
    url: 'https://www.logitech.com/en-eu/shop/p/c920-pro-hd-webcam.960-001055?srsltid=AfmBOop4R7_bqc-NzX0g9ELrl-pBx2NC_i3ac8JXoBDx_vDEF5zivr7P',
  },
  {
    name: '8BitDo Ultimate 2.4G white',
    icon: Gamepad2,
    url: 'https://www.8bitdo.com/ultimate-2.4g-wireless-controller/',
  },
  {
    name: 'AKKO 5087S',
    icon: Keyboard,
    url: 'https://en.akkogear.com/product/black-gold-5087s-via-mechanical-keyboard/',
  },
  {
    name: 'VXE DragonFly R1 PRO',
    icon: Mouse,
    url: 'https://www.atk.store/products/vxe-dragonfly-r1-series-wireless-mouse?srsltid=AfmBOorRZkuQASlQ1p0HyaZ5ZUMbc7EXXAjDdObek9YtTCqIDnLM3Wuy',
  },
]

export const hardware: Record<string, PartLink[]> = {
  'Операционные системы': OS,
  'Железки': SYSTEM_PARTS,
  'Мониторы': MONITORS,
  'Девайсы': DEVICES,
}
