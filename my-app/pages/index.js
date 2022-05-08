import { useEffect, useRef, useState } from 'react';
import Web3Modal from "web3modal";
import { providers } from 'ethers';
import Head from "next/head";
import styles from "../styles/Home.module.css";


export default function Home() {

  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  const connectWallet = async() => {
    await getProviderOrSigner();
    setWalletConnected(true);

  }



  // A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
  // A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
  // * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
  // * request signatures from the user using Signer functions.
  const getProviderOrSigner = async (needSigner = false) => {
    //  we need to gain access to the provider/signer from metamask
    // N/B: This particular line pops up metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // if the user is not connected to rinkeby, tell them to connect to rinkeby
    const { chainId } = await web3Provider.getNetwork();
    if ( chainId !== 4 ) {
      window.alert("Please switch to the Rinkeby network");
      throw new Error("Incorrect network");
    }

    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if(!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
    }
  }, [])

  return (
    <div>
      <Head>
        <title>Crypto devs NFT</title>
      </Head>

      <div className={styles.main}>
        {walletConnected ? null : (
          <button onClick={connectWallet} className={styles.button}> 
          Connect Wallet
         </button>
        )}
      </div>
    </div>
  )
}
