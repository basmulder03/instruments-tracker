export const settingNames = [
    'user:signInTries',
    'user:passwordHistory',
    'system:seedingComplete'
] as const;

export type SettingName = typeof settingNames[number];

export const settings: SettingName[] = [...settingNames];

export const defaultSettings: {settingName: SettingName, value: string}[] = [
    {settingName: 'system:seedingComplete', value: 'false'},
    {settingName: 'user:signInTries', value: '5'},
    {settingName: 'user:passwordHistory', value: '5'}
]
