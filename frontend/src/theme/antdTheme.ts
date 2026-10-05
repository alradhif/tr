import type { ThemeConfig } from 'antd'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#17b26a',
    colorSuccess: '#17b26a',
    colorText: '#18181b',
    colorTextSecondary: '#8e8f97',
    colorBorder: '#e7e8eb',
    colorBgLayout: '#f5f5f6',
    borderRadius: 8,
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
    controlHeight: 44,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 44,
      primaryShadow: 'none',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 44,
    },
    Layout: {
      siderBg: '#f5f5f6',
      bodyBg: 'transparent',
      headerBg: 'transparent',
    },
    Menu: {
      itemBorderRadius: 10,
      itemHeight: 46,
      itemSelectedBg: 'transparent',
      itemSelectedColor: '#ffffff',
    },
    Table: {
      headerBg: 'transparent',
      headerColor: '#8e8f97',
      rowHoverBg: '#fafafa',
    },
    Card: {
      borderRadiusLG: 16,
    },
  },
}
