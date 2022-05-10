import { useEffect, useRef, useState } from 'react';
import Web3Modal from "web3modal";
import { providers, Contract, utils } from 'ethers';
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants';


export default function Home() {

  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);

  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);

  // presaleStarted keeps track of whether the presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(false);

  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);

  // keeps track of the number of tokenIds that have been minted
  const [numTokensMinted, setNumTokensMinted] = useState("")

  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();


  const getNumMintedTokens = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setNumTokensMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };


  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

    // Create a new instance of the Contract with a Signer, which allows
    // update methods
    const nftContract = new Contract( NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer );
    // call the presaleMint from the contract, only whitelisted addresses would be able to mint
    const txn = await nftContract.presaleMint({
      // value signifies the cost of one crypto dev which is "0.01" eth.
      // We are parsing `0.01` string to ether using the utils library from ethers.js
      value: utils.parseEther("0.01"),
    });
    // setLoading(true);
    // wait for the transaction to get mined
    await txn.wait();
    // setLoading(false);
    window.alert("You successfully minted a Crypto Dev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  // similar to presale mint
  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await  getProviderOrSigner(true);

    // Create a new instance of the Contract with a Signer, which allows
    // update methods
    const nftContract = new Contract( NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer );
    // call the presaleMint from the contract, only whitelisted addresses would be able to mint
    const txn = await nftContract.mint({
      // value signifies the cost of one crypto dev which is "0.01" eth.
      // We are parsing `0.01` string to ether using the utils library from ethers.js
      value: utils.parseEther("0.01"),
    });
    setLoading(true);
    // wait for the transaction to get mined
    await txn.wait();
    window.alert("You successfully minted a Crypto Dev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }
  
  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      

      const nftContract = new Contract( NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer );   

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }

    } catch (error) {
      console.error(error);
    }
  }
  

  const startPresale = async () => {
    setLoading(true);
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);

      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract( NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer );

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }


  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();

      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract. Get instance of the contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      // call the presaleStarted from the contract
      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      // This will return a big number because presaleEnded is uint256
      // This will also return a timestamp in seconds
      const presaleEndTime = await nftContract.presaleEnded();
      // Date.now()/1000 returns the current time in seconds
      const currentTimeInSeconds = Date.now() / 1000;
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds));
      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
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

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    // Track in real time the number of monted NFT's
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5 * 1000)

    // Track in real time the status of presale(starting, ending)
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000)
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

      onPageLoad();
      
    }
  }, [])


  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}> 
          Connect Wallet
        </button>
      )
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      )
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasn't started yet. Come back later!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a
            Crypto Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint} >
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, its time for public minting
    if (presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has ended!!! You can mint a CryptoDev in public mint, if any still remains. 
          </div>
          <button className={styles.button} onClick={publicMint}>
            Public Mint 🚀
          </button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numTokensMinted}/20 have been minted
          </div>
          {renderBody()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Elo
      </footer>
    </div>
  )
}
