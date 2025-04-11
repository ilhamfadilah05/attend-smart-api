import { DataAccessCategory, DefaultAccess } from './interface';

export const PATH = {
  CAMPAIGN: 'campaigns',
  USER: 'users',
  ROLE: 'roles',
  CATEGORY: 'categories',
  CAMPAIGN_GROUP: 'campaign-groups',
  CONFIG: 'configs',
  USER_ACTIVITY: 'user-activities',
  CITY: 'cities',
  PROVINCE: 'provinces',
  TRANSACTION: 'transactions',
  BANNER: 'banners',
  ZAKAT: 'zakats',
  CAMPAIGN_NEWS: 'campaign-news',
  BRANCH: 'branches',
  DEPARTMENT: 'departments',
  PAYSLIP: 'payslips',
  DASHBOARD: 'dashboard',
  BROADCAST_SEND: 'broadcast-sends',
  BROADCAST: 'broadcasts',
  EMPLOYEE: 'employees',
  HISTORY: 'histories',
  SALARY: 'salaries',
  SUBMISSION: 'submissions',
  MENU: 'menus',
  SEDEKAH: 'sedekah',
  SANDRA: 'sandra',
  DONOR: 'donors',
};

export enum FUND_TYPE {
  KEMANUSIAAN = 'kemanusiaan',
  WAKAF = 'wakaf',
  ZAKAT = 'zakat',
  SEDEKAH = 'sedekah',
  KURBAN = 'kurban',
  ZAKAT_PENGHASILAN = 'zakat_penghasilan',
  ZAKAT_MAAL = 'zakat_maal',
  ZAKAT_FITRAH = 'zakat_fitrah',
  ZAKAT_EMAS = 'zakat_emas',
  ZAKAT_FIDYAH = 'zakat_fidyah',
}

export enum CATEGORY_TYPE {
  CAMPAIGN = 'campaign',
  KURBAN = 'kurban',
}

export enum BANNER_TYPE {
  CAMPAIGN = 'campaign',
  WEB = 'web',
}

export enum MENU_TYPE {
  WEBVIEW = 'webview',
  CAMPAIGN_GROUP = 'campaign_group',
  CAMPAIGN = 'campaign',
}

export enum TRANSACTION_TYPE {
  SUCCESS = 'success',
  PENDING = 'pending',
  FAIL = 'failed',
}

export enum HISTORY_TYPE {
  ATTEND_IN = 'MASUK',
  ATTEND_OUT = 'KELUAR',
  OVERTIME = 'LEMBUR',
  WFH = 'WFH',
  PERMISSION = 'IZIN',
  SICK = 'SAKIT',
}

export const REDIS_TTL = {
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000,
  TEN_MINUTES: 600000,
  THIRTY_MINUTES: 1800000,
  FOURTY_FIVE_MINUTES: 2700000,
  ONE_HOUR: 3600000,
  TWO_HOURS: 7200000,
  FOUR_HOURS: 14400000,
  ONE_DAY: 86400000,
  ONE_WEEK: 604800000,
  ONE_MONTH: 2592000000,
};

// dmp mean dana mini program
export const CACHE_PREFIX = 'dmp';

export const DEFAULT_CONFIG = {
  EXPIRED_TOKEN: 5,
  EXPIRED_OTP: 5,
  LENGTH_OTP: 6,
  LOGIN_ATTEMPT: 3,
};

export enum ActionEnum {
  read = 'read',
  create = 'create',
  update = 'update',
  delete = 'delete',
  block = 'block',
  change_period = 'change_period',
}

export enum CategoryEnum {
  CAMPAIGN = 'CAMPAIGN',
}

export const ACCESS_ACTION = {
  read: 'Melihat',
  create: 'Membuat',
  update: 'Mengubah',
  delete: 'Menghapus',
  export: 'Mengekspor',
  manage: 'Mengelola',
  block: 'Memblokir',
  change_period: 'Mengubah Periode',
};

export const STATUS_ACCESS_CATEGORY = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

export interface AccessGrouped {
  category: string;
  access_category?: DataAccessCategory;
  access: DefaultAccess[];
}

export const ACCESS_CATEGORY: Record<string, DataAccessCategory> = {
  users: {
    name: 'Pengguna',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
    access: [
      // * Ini di pake untuk akses menu di front end
      {
        subject: 'users',
        action: 'block',
        name: 'Blokir',
        desc: 'Untuk Memblokir Pengguna',
      },
      {
        subject: 'users',
        action: 'change_period',
        name: 'Ubah Periode Aktif',
        desc: 'Untuk Mengubah Periode Aktif Pengguna',
      },
    ],
    access_hide: [
      {
        subject: 'user',
        action: 'read',
      },
      {
        subject: 'user/one',
        action: 'read',
      },
    ],
  },
  roles: {
    name: 'Role Akses',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  employees: {
    name: 'Karyawan Akses',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  salaries: {
    name: 'Penggajian Akses',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  submissions: {
    name: 'Perizinan Akses',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  branches: {
    name: 'Cabang Akses',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  departments: {
    name: 'Jabatan Akses',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  broadcasts: {
    name: 'Broadcast Akses',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  campaigns: {
    name: 'Campaign',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  zakats: {
    name: 'Zakat',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  'campaing-news': {
    name: 'Campaign News',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  menus: {
    name: 'Menu',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  configs: {
    name: 'Konfigurasi',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  donors: {
    name: 'Donor',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  sandra: {
    name: 'Sandra',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  sedekah: {
    name: 'Sedekah',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  banners: {
    name: 'Banner',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  provinces: {
    name: 'Provinsi',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  cities: {
    name: 'Kota',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  'user-activities': {
    name: 'Kota',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  'campaign-groups': {
    name: 'Kota',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
  categories: {
    name: 'Kota',
    status: STATUS_ACCESS_CATEGORY.ACTIVE,
  },
};
