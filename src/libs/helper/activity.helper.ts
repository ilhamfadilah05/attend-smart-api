export const ActivityHelper = {
  getActivity: (action: string, table: string) => ({
    action: ActivityHelper.getAction(action),
    subject: ActivityHelper.getSubject(table),
  }),

  getAction: (action: string) => {
    switch (action) {
      case 'POST':
        return 'Membuat';
      case 'PATCH':
        return 'Mengubah';
      case 'DELETE':
        return 'Menghapus';
      default:
        return action;
    }
  },

  getSubject: (subject: string) => {
    switch (subject) {
      case 'change-password':
        return 'Password Akun Pengguna';
      case 'users':
        return 'Pengguna';
      case 'roles':
        return 'Hak Akses Pengguna';
      case 'campaign_groups':
        return 'Group campaign';
      case 'campaigns':
        return 'Campaign';
      case 'configs':
        return 'Konfigurasi';
      case 'menus':
        return 'Menu';
      case 'zakats':
        return 'Zakat';
      case 'banners':
        return 'Banner';
      case 'transactions':
        return 'Transaksi';
      default:
        return subject;
    }
  },
};
