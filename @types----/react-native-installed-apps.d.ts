declare module 'react-native-installed-apps' {
    export function getAllApps(): Promise<{ appName: string; packageName: string }[]>;
}
