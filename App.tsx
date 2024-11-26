import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, View, BackHandler} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WebView, WebViewMessageEvent, WebView as WebViewType} from 'react-native-webview';
import {NetworkInfo} from 'react-native-network-info';
import DeviceInfo from 'react-native-device-info';
import Spinner from 'react-native-loading-spinner-overlay';
// import { IntentLauncherAndroid } from 'react-native-intent-launcher';

function App(): React.JSX.Element {
    const webViewRef = useRef<WebViewType | null>(null);
    const [wifiMacAddress, setWifiMacAddress] = useState<string>('');
    const [lanMacAddress, setLanMacAddress] = useState<string>('');
    const [packageName, setPackageName] = useState<string>('');
    const [buildNumber, setBuildNumber] = useState<string>('');
    const [androidId, setAndroidId] = useState<string>('');
    const [androidVersion, setAndroidVersion] = useState<string>('');
    const [spinner, setSpinner] = useState(true);
    // const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        const fetchMacAddresses = async () => {
            setPackageName(DeviceInfo.getBundleId());
            setBuildNumber(DeviceInfo.getBuildNumber());
            setAndroidVersion(DeviceInfo.getSystemVersion());
            setAndroidId(await DeviceInfo.getUniqueId());
            const bssid = await NetworkInfo.getBSSID();
            setWifiMacAddress(bssid || '');
            const mac = await DeviceInfo.getMacAddress();
            setLanMacAddress(mac || '');
        };

        fetchMacAddresses();
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
        };
    }, []);

    const getData = async () => {
        try {
            const value = await AsyncStorage.getItem('hamsamTk');

            if (value !== null) {
                sendMessageToWebView('userData', value);
            } else {
                sendMessageToWebView('userData', null);
            }
        } catch (e) {
            sendMessageToWebView('userData', null);
        }
    };
    const removeData = async () => {
        try {
            await AsyncStorage.removeItem('hamsamTk');
            sendMessageToWebView('removedData', true);
        } catch (e) {
            sendMessageToWebView('removedData', true);
        }
    };
    const setData = async (data: any) => {
        try {
            await AsyncStorage.setItem('hamsamTk', data);
            sendMessageToWebView('setData', true);
        } catch (e) {
            sendMessageToWebView('setData', true);
        }
    };
    const handleBackPress = () => {
        if (webViewRef.current) {
            sendMessageToWebView('returnPage', '');
            return true;
        }
        return false;
    };
    

    const checkAppInstallation = async () => {
        // const appPackageName = 'com.sambazar';
        // const appInstalled = await IntentLauncherAndroid.getAppIntent(appPackageName);
        // console.log('appInstalled' , appInstalled);
    };
    const handleOnMessage = (event: WebViewMessageEvent) => {
        const {type, data} = JSON.parse(event.nativeEvent.data);
        switch (type) {
            case 'getData':
                getData();
                break;
            case 'removeData':
                removeData();
                break;
            case 'setData':
                setData(data);
                break;
            case "exit":
                BackHandler.exitApp();
                break;
            case "openApp":
                checkAppInstallation();
                break;

        }
    };

    const sendMessageToWebView = (type: string, data: any) => {
        const params = {type, data};
        const param = JSON.stringify(params);
        if (webViewRef.current) {
            try {
                webViewRef.current.injectJavaScript('window.app1.$emit("PostMessages", ' + param + ')');
            } catch (error) {
                console.error('Error injecting JavaScript:', error);
            }
        } else {
            console.error('webViewRef is not set');
        }
    };

    const renderWebview = () => {
        if (lanMacAddress === '') {
            return <></>;
        }
        return (
            <View style={styles.container}>
                <WebView
                    source={{
                        uri: 'file:///android_asset/webview/index.html?wifiMacAddress='
                            + wifiMacAddress + '&lanMacAddress='
                            + lanMacAddress + '&packageName='
                            + packageName + '&model='
                            + buildNumber + '&androidId='
                            + androidId + '&androidVersion='
                            + androidVersion,
                    }}
                    ref={webViewRef}
                    onMessage={handleOnMessage}
                    onLoadEnd={() => {
                        setSpinner(false);
                    }}
                    originWhitelist={['*']}
                    allowFileAccess={true}
                    allowUniversalAccessFromFileURLs={true}
                    mediaPlaybackRequiresUserAction={false}
                    keyboardDisplayRequiresUserAction={false}
                    domStorageEnabled={true}
                    javaScriptEnabled={true}
                    sharedCookiesEnabled={true}
                />
            </View>
        );
    };

    return (
        <View style={{flex: 1}}>
            <Spinner
                visible={spinner}
                animation={'fade'}
                size={'large'}
            />
            {renderWebview()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
});

export default App;
