import { ethers, network } from "hardhat";

import {
  EIP712StETH__factory,
  ERC1271Wallet__factory,
  StethPermitMockWithEip712Initialization__factory,
} from "typechain-types";

import { ether } from "lib/units";

import { testERC2612Compliance } from "../common/erc2612.test";

testERC2612Compliance.only({
  tokenName: "stETH",
  deploy: async () => {
    const [deployer, owner] = await ethers.getSigners();

    const value = ether("1.0");
    const steth = await new StethPermitMockWithEip712Initialization__factory(deployer).deploy(owner, { value });

    const eip712helper = await new EIP712StETH__factory(deployer).deploy(steth);
    await steth.initializeEIP712StETH(eip712helper);

    return {
      token: steth,
      domain: {
        name: "Liquid staked Ether 2.0",
        version: "2",
        chainId: network.config.chainId!,
        verifyingContract: await steth.getAddress(),
      },
      owner: owner.address,
      signer: owner,
    };
  },
});

testERC2612Compliance.only({
  tokenName: "stETH (for ERC-1271 wallets)",
  deploy: async () => {
    const [deployer, owner] = await ethers.getSigners();

    const value = ether("1.0");
    const steth = await new StethPermitMockWithEip712Initialization__factory(deployer).deploy(owner, { value });

    const eip712helper = await new EIP712StETH__factory(deployer).deploy(steth);
    await steth.initializeEIP712StETH(eip712helper);

    const walletFactory = new ERC1271Wallet__factory(deployer);
    const wallet = await walletFactory.deploy(owner.address);
    await steth.connect(owner).transfer(await wallet.getAddress(), await steth.balanceOf(owner));

    return {
      token: steth,
      domain: {
        name: "Liquid staked Ether 2.0",
        version: "2",
        chainId: network.config.chainId!,
        verifyingContract: await steth.getAddress(),
      },
      owner: await wallet.getAddress(),
      signer: owner,
    };
  },
});
