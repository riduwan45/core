import { expect } from "chai";
import { ethers } from "hardhat";
import { afterEach } from "mocha";

import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { WithdrawalQueueERC721 } from "typechain-types";

import { deployWithdrawalQueue, MAX_UINT256, ONE_ETHER, PAUSE_ROLE, RESUME_ROLE, Snapshot } from "lib";

const getBlockTimestamp = async (provider: HardhatEthersProvider) => {
  const block = await provider.getBlock("latest");
  return block!.timestamp;
};

describe("WithdrawalQueueERC721:Pausable", () => {
  let owner: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;
  let daoAgent: HardhatEthersSigner;

  let queue: WithdrawalQueueERC721;

  let originalState: string;
  let provider: typeof ethers.provider;

  before(async () => {
    ({ provider } = ethers);
    [owner, stranger, daoAgent] = await ethers.getSigners();

    const deployed = await deployWithdrawalQueue({
      stEthSettings: { initialStEth: ONE_ETHER, owner },
      queueAdmin: daoAgent,
      queuePauser: daoAgent,
      queueResumer: daoAgent,
      queueFinalizer: daoAgent,
    });

    ({ queue } = deployed);

    originalState = await Snapshot.take();
  });

  context("pauseFor", () => {
    beforeEach(async () => {
      originalState = await Snapshot.take();
    });

    afterEach(async () => {
      await Snapshot.restore(originalState);
    });

    it("Reverts if contract is paused", async () => {
      await queue.connect(daoAgent).pauseFor(1000n);
      await expect(queue.connect(daoAgent).pauseFor(1n)).to.be.revertedWithCustomError(queue, "ResumedExpected");
    });

    it("Reverts if the caller is unauthorised", async () => {
      await expect(queue.connect(stranger).pauseFor(1n)).to.be.revertedWithOZAccessControlError(
        stranger.address,
        PAUSE_ROLE,
      );
    });

    it("Reverts if zero pause duration", async () => {
      await expect(queue.connect(daoAgent).pauseFor(0)).to.be.revertedWithCustomError(queue, "ZeroPauseDuration");
    });

    it("Pause and emits `Paused` event", async () => {
      await expect(await queue.connect(daoAgent).pauseFor(404n))
        .to.emit(queue, "Paused")
        .withArgs(404n);
    });

    it("Pause to infinity and emits `Paused` event", async () => {
      await expect(await queue.connect(daoAgent).pauseFor(MAX_UINT256))
        .to.emit(queue, "Paused")
        .withArgs(MAX_UINT256);
    });
  });

  context("pauseUntil", () => {
    beforeEach(async () => {
      originalState = await Snapshot.take();
    });

    afterEach(async () => {
      await Snapshot.restore(originalState);
    });

    it("Reverts if contract is paused", async () => {
      await queue.connect(daoAgent).pauseFor(1000n);

      const blockTimestamp = await getBlockTimestamp(provider);

      await expect(queue.connect(daoAgent).pauseUntil(blockTimestamp + 1)).to.be.revertedWithCustomError(
        queue,
        "ResumedExpected",
      );
    });

    it("Reverts if the caller is unauthorised", async () => {
      const blockTimestamp = await getBlockTimestamp(provider);

      await expect(queue.connect(stranger).pauseUntil(blockTimestamp + 1)).to.be.revertedWithOZAccessControlError(
        stranger.address,
        PAUSE_ROLE,
      );
    });

    it("Reverts if timestamp is in the past", async () => {
      await expect(queue.connect(daoAgent).pauseUntil(0)).to.be.revertedWithCustomError(
        queue,
        "PauseUntilMustBeInFuture",
      );
    });

    it("Pause and emits `Paused` event", async () => {
      const blockTimestamp = await getBlockTimestamp(provider);

      await expect(await queue.connect(daoAgent).pauseUntil(blockTimestamp + 1000))
        .to.emit(queue, "Paused")
        .withArgs(1000n);
    });

    it("Pause to infinity and emits `Paused` event", async () => {
      await expect(await queue.connect(daoAgent).pauseUntil(MAX_UINT256))
        .to.emit(queue, "Paused")
        .withArgs(MAX_UINT256);
    });
  });

  context("isPaused", () => {
    beforeEach(async () => {
      originalState = await Snapshot.take();
    });

    afterEach(async () => {
      await Snapshot.restore(originalState);
    });

    it("Returns false if contract is not paused", async () => {
      expect(await queue.isPaused()).to.be.false;
    });

    it("Returns true if contract is paused", async () => {
      await queue.connect(daoAgent).pauseFor(1000n);

      expect(await queue.isPaused()).to.be.true;
    });
  });

  context("getResumeSinceTimestamp", () => {
    beforeEach(async () => {
      originalState = await Snapshot.take();
    });

    afterEach(async () => {
      await Snapshot.restore(originalState);
    });

    it("Returns 0 if contract is not paused", async () => {
      const blockTimestamp = await getBlockTimestamp(provider);
      expect(await queue.getResumeSinceTimestamp()).to.equal(blockTimestamp);
    });

    it("Returns the duration since the contract was paused", async () => {
      await queue.connect(daoAgent).pauseFor(1000n);

      const blockTimestamp = await getBlockTimestamp(provider);
      expect(await queue.getResumeSinceTimestamp()).to.equal(blockTimestamp + 1000);
    });
  });

  context("resume", () => {
    beforeEach(async () => {
      originalState = await Snapshot.take();
    });

    afterEach(async () => {
      await Snapshot.restore(originalState);
    });

    it("Reverts if contract is not paused", async () => {
      await expect(queue.connect(daoAgent).resume()).to.be.revertedWithCustomError(queue, "PausedExpected");
    });

    it("Reverts if the caller is unauthorised", async () => {
      await queue.connect(daoAgent).pauseFor(1000n);

      await expect(queue.connect(stranger).resume()).to.be.revertedWithOZAccessControlError(
        stranger.address,
        RESUME_ROLE,
      );
    });

    it("Resumes and emits `Resumed` event", async () => {
      await queue.connect(daoAgent).pauseFor(1000n);

      await expect(await queue.connect(daoAgent).resume()).to.emit(queue, "Resumed");
    });
  });
});
