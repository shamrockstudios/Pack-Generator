import React, { useState } from "react";
import { Button, Input, Tooltip } from "antd";
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useWeb3ExecuteFunction } from "react-moralis";
import { getEllipsisTxt } from "helpers/formatters";
import { openNotification } from "../Notification";
import styles from "./styles";
import { FileSearchOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { getExplorer } from "helpers/networks";
import ModalL3PBOnly from "./ModalL3PBOnly";
import { useAssemblyEvent } from "hooks/useAssemblyEvent";
import { useContractAddress } from "hooks/useContractAddress";

const BundleClaim = () => {
  const { walletAddress, chainId, assemblyABI } = useMoralisDapp();
  const { retrieveAssemblyEvent } = useAssemblyEvent();
  const { getAssemblyAddress } = useContractAddress();
  const [isModalNFTVisible, setIsModalNFTVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const contractProcessor = useWeb3ExecuteFunction();
  const contractABIJson = JSON.parse(assemblyABI);
  const [selectedBundle, setSelectedBundle] = useState({});
  const [bundleId, setBundleId] = useState();

  const showModalNFT = () => {
    setIsModalNFTVisible(true);
  };
  const handleNFTCancel = () => {
    setIsModalNFTVisible(false);
  };
  const handleNFTOk = (bundle) => {
    setSelectedBundle(bundle);

    if (bundle && bundle.length > 0) {
      setBundleId(bundle[0].token_id);
    } else {
      setBundleId("");
    }
    setIsModalNFTVisible(false);
    setConfirmLoading(false);
  };

  const handleClaim = () => {
    claimBundle();
  };

  const resetOnClaim = () => {
    setBundleId();
  };

  const getContractAddress = () => {
    const defaultFactoryAddress = getAssemblyAddress();
    if (selectedBundle && selectedBundle[0].token_address !== defaultFactoryAddress) {
      return selectedBundle[0].token_address;
    } else {
      return defaultFactoryAddress;
    }
  };

  const claimBundle = async () => {
    const contractAddress = getContractAddress();

    const data = await retrieveAssemblyEvent(selectedBundle, contractAddress);
    console.log(data);
    try {
      const ops = {
        contractAddress: contractAddress,
        functionName: "burn",
        abi: contractABIJson,
        params: {
          _to: walletAddress,
          _tokenId: selectedBundle[0].token_id,
          _salt: data[2],
          _addresses: data[0],
          _numbers: data[1]
        }
      };

      await contractProcessor.fetch({
        params: ops,
        onSuccess: (response) => {
          let asset = response.events.Transfer.returnValues;
          let link = `${getExplorer(chainId)}tx/${response.transactionHash}`;
          let title = "Bundle claimed!";
          let msg = (
            <div>
              Your bundle id: "{getEllipsisTxt(asset.tokenId, 6)}" has been succesfully unpacked!
              <br></br>
              <a href={link} target='_blank' rel='noreferrer noopener'>
                View in explorer: &nbsp;
                <FileSearchOutlined style={{ transform: "scale(1.3)", color: "purple" }} />
              </a>
            </div>
          );
          openNotification("success", title, msg);
          console.log("bundle claimed");
          resetOnClaim();
        },
        onError: (error) => {
          let title = "Unexpected error";
          let msg = "Oops, something went wrong while unpacking your bundle!";
          openNotification("error", title, msg);
          console.log(error);
        }
      });
    } catch (error) {
      let title = "Bundle non-claimable";
      let msg = "Oops, you can't claim this bundle at this time. It is either unconfirmed yet, or already claimed.";
      openNotification("error", title, msg);
    }
  };

  return (
    <div style={{ height: "auto" }}>
      <div style={styles.transparentContainer}>
        <label style={{ letterSpacing: "1px" }}>Unpack your Bundle</label>
        <div style={{ display: "grid", margin: "auto", width: "70%" }}>
          <div style={{ width: "70%", margin: "auto", position: "relative" }}>
            <Button type='primary' shape='round' style={styles.selectButton} onClick={showModalNFT}>
              PICK AN NFT
            </Button>

            <Tooltip
              title="Pick the L3P bundle that you'd like to unpack."
              style={{ position: "absolute", top: "35px", right: "80px" }}
            >
              <QuestionCircleOutlined
                style={{ color: "white", paddingLeft: "15px", paddingBottom: "40px", transform: "scale(0.8)" }}
              />
            </Tooltip>
          </div>
          <ModalL3PBOnly
            handleNFTCancel={handleNFTCancel}
            isModalNFTVisible={isModalNFTVisible}
            handleNFTOk={handleNFTOk}
            isMultiple={false}
            confirmLoading={confirmLoading}
          />
          <p style={{ margin: "auto", marginBottom: "25px", fontSize: "16px" }}>or</p>
          <label style={styles.label}>ENTER BUNDLE ID</label>
          <Input
            style={styles.transparentInput}
            type='number'
            min='0'
            value={bundleId}
            onChange={(e) => setBundleId(e.target.value)}
          />

          {selectedBundle && selectedBundle.length > 0 && (
            <div style={styles.displaySelected}>{`Bundles Id: ${getEllipsisTxt(bundleId, 5)}`}</div>
          )}
        </div>
      </div>
      <Button shape='round' style={styles.runFunctionButton} onClick={handleClaim}>
        CLAIM YOUR BUNDLE
      </Button>
    </div>
  );
};

export default BundleClaim;
