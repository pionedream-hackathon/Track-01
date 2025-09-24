import '@walletconnect/react-native-compat';

import React, {useEffect} from 'react';
import {Linking, SafeAreaView, StyleSheet} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import {
  createAppKit,
  defaultConfig,
  AppKitButton,
  AppKit,
} from '@reown/appkit-ethers-react-native';
import {FlexView, Text} from '@reown/appkit-ui-react-native';
import {handleResponse} from '@coinbase/wallet-mobile-sdk';
import {CoinbaseProvider} from '@reown/appkit-coinbase-ethers-react-native';
import {AuthProvider} from '@reown/appkit-auth-ethers-react-native';
import {ENV_PROJECT_ID} from '@env';
import {MMKV} from 'react-native-mmkv';

import {SignMessage} from './views/SignMessage';
import {SendTransaction} from './views/SendTransaction';
import {ReadContract} from './views/ReadContract';
import {WriteContract} from './views/WriteContract';
import {SignTypedDataV4} from './views/SignTypedDataV4';
import {pionechain, zerochain} from './utils/ChainUtils';
import {siweConfig} from './utils/SiweUtils';

// 1. Get projectId at https://cloud.reown.com
const projectId = ENV_PROJECT_ID;
// 2. Define your chains - Sử dụng Zero Chain
const chains = [zerochain, pionechain];

// 3. Create config - Cấu hình cho PioneFarm DApp
const metadata = {
  name: 'PioneFarm DApp',
  description: 'Ứng dụng truy xuất nguồn gốc nông sản',
  url: 'https://pionefarm.com',
  icons: ['https://pionefarm.com/logo.png'],
  redirect: {
    native: 'pionefarm://',
  },
};

const config = defaultConfig({
  metadata,
});

const clipboardClient = {
  setString: async (value: string) => {
    Clipboard.setString(value);
  },
};

const customWallets = [
  {
    id: 'com.companyname.swaptobe',
    name: 'PioneWallet',
    homepage: 'com.companyname.swaptobe',
    image_url:
      'https://raw.githubusercontent.com/kietpio/assets/refs/heads/main/ecosystem/wallet.png',
    mobile_link: 'tobewallet://',
  },
];

// 3. Create modal
createAppKit({
  projectId,
  metadata,
  chains,
  defaultChain: zerochain,
  config,
  customWallets,
  clipboardClient,
  features: {
    swaps: false, // Tắt swap nếu không cần
    onramp: false, // Tắt onramp nếu không cần
    email: false,
    socials: false,
  },
});

function App(): React.JSX.Element {
  // Coinbase sdk setup
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({url}) => {
      const handledBySdk = handleResponse(new URL(url));
      if (!handledBySdk) {
        // Handle other deeplinks
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title} variant="large-600">
        AppKit + ethers
      </Text>
      <FlexView style={styles.buttonContainer}>
        <AppKitButton balance="show" />
        <SignMessage />
        <SendTransaction />
        <SignTypedDataV4 />
        <ReadContract />
        <WriteContract />
      </FlexView>
      <AppKit />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 16,
  },
  buttonContainer: {
    gap: 8,
  },
  title: {
    marginBottom: 40,
    fontSize: 30,
  },
});

export default App;
