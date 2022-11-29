// NftUploader.jsx
import { ethers } from "ethers";
import { Button } from "@mui/material";
import React from "react";
import { useEffect, useState } from 'react'
import ImageLogo from "./image.svg";
import "./NftUploader.css";
import Web3Mint from "../../utils/Web3Mint.json";
//import { Web3Storage } from 'web3.storage';
import { NFTStorage} from "nft.storage";
import ReactLoading from 'react-loading';//Mint Status Loading

const NftUploader = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [max,setMax] = useState(0);
  const [number,setNumber]=useState(0);
  const [mintStatus,setMintStatus] =useState(false);
  const CONTRACT_ADDRESS ="0x1fC58C41d1aED15F5ca892adb5Fc4EE3B44B55aa";

  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object:", ethereum);
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      //チェーンIDのチェック
      console.log("Check the ChainID")
      let chainId = await ethereum.request({method:"eth_chainId"});
      console.log("Connected to chain :" + chainId);
      const goerliChainId = "0x5";
      if(chainId != goerliChainId){
        alert("You are not connected to the Goerli Testnet");
      }else{
        // Mint最大数/現在のMint数を表示
        renderNFTCount();
      }
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () =>{
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async (ipfs) => {    
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.mintIpfsNFT("sample",ipfs);
        console.log("Mining...please wait.");
        //Mint中のステータスを表示
        setMintStatus(true);
        console.log("true");
        await nftTxn.wait();
        //Mint後にステータスを変更
        setMintStatus(false);
        console.log("false");
        console.log(
          `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

// NftUploader.jsx
const imageToNFT = async (e) => {
  
  const images = e.target.files;
  for(const image of images) {
    const cid = await storeNFT(image);
    console.log(cid);
    askContractToMintNft(cid);
  }

  //Web3.strageだとエラーとなるためntf.storageで代用
  // https://discord.com/channels/936573458748432405/991217219071655986/1040638428401913868
  /*
  const API_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweENhNDczNDU2YjYxN2EwNjdFYzE5QkQ4Mzc3OEY1MkI0Y2Q0MTcxNEMiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjkxNzk1MTMwNzYsIm5hbWUiOiJFVEgtTkZULU1ha2VyIn0.WqBHw8bH3Y1C52N0Vwu16EWDBnHPAauYhL45igFEsQw"
  const client = new Web3Storage({ token: API_KEY })
  const image = e.target
  console.log(image)

  const rootCid = await client.put(image.files, {
      name: 'experiment',
      maxRetries: 3
  })

  const res = await client.get(rootCid) // Web3Response  
  const files = await res.files() // Web3File[]
  for (const file of files) {
    console.log("file.cid:",file.cid)
    askContractToMintNft(file.cid)
  }
  */
};

  //別途sotreNFTを定義
  //https://nftstorage.github.io/nft.storage/client/modules/lib.html
  const storeNFT = async(image) => {
    const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDliQTczYjdENTRDM2QyMEZCRWVGNzI1NURmNjc4OEY0M2Y4MUVGMDAiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY2OTE4OTI0MzMxNywibmFtZSI6IkVUSC1ORlQtTWFrZXIifQ.2uZlRZa6ToggqjRutbkE6BaIAaIKp8qC7A7Q0TEHu0I";
    const client = new NFTStorage({ token: API_TOKEN });
    const cid = await client.storeBlob(image);
    return cid;
  };


  const renderNotConnectedContainer = () => (
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        Connect to Wallet
      </button>
    );
  
  //Mint上限、現在のMint数の表示
  const renderNFTCount = async() => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer //読み取りのみ
        );
        console.log("count number of NFT");
        const nft_temp = await connectedContract.viewOfMinted();
        setMax(nft_temp.mint_max.toNumber());
        setNumber(nft_temp.count.toNumber());
        console.log("max : ",max);
        console.log("minted count :",number);
      } else {
        console.log("error!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const redirectToOpenSea = async() => {
      window.open('https://testnets.opensea.io/collection/nft-jfpgpuonqx', '_blank');
    };

  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);



  return (
    <div className="outerBox">
      {currentAccount === "" ? (
        renderNotConnectedContainer()
      ) : (
        <p>If you choose image, you can mint your NFT</p>
      )}
      <div className="title">
        <h2>NFTアップローダー</h2>
      </div>
      
       {/*Mint Status Loading*/}     
      {mintStatus ? (
      <div> 
      <p className="sub-text">Mint処理中です。。。。</p>
          <ReactLoading type="bubble" />
      </div>
       ) : (<p></p>)
       }
      {/*Mintカウンタ*/}      
      <div>
      これまでにMintされた数：{number}/{max} 　
      <Button variant="contained" onClick={renderNFTCount} className="cta-button connect-wallet-button">
      更新
      </Button>
      </div>      

     <br></br>
      
      <div className="nftUplodeBox">
        <div className="imageLogoAndText">
          <img src={ImageLogo} alt="imagelogo" />
          <p>ここにドラッグ＆ドロップしてね</p>
        </div>
        <input className="nftUploadInput" multiple name="imageURL" type="file" accept=".jpg , .jpeg , .png"  onChange={imageToNFT}/>
      </div>
      <p>または</p>
      <Button variant="contained">
        ファイルを選択
        <input className="nftUploadInput" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT}/>
      </Button>

    <div>
      <Button onClick={redirectToOpenSea}>
        OpenSeaでコレクションを表示
      </Button>
    </div>

    </div>
  
  );
};

export default NftUploader;
