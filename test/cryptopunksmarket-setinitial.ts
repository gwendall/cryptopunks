import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoPunksMarket - set initial owners", () => {
  async function deploy() {
    const [owner, a1, a2, a3] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CryptoPunksMarket");
    const c = await F.deploy({ value: 0 });
    return { c, owner, a1, a2, a3 };
  }

  it("owner can set initial owners in single and batch; updates balances and remaining", async () => {
    const { c, owner, a1, a2 } = await deploy();

    expect(await c.punksRemainingToAssign()).to.equal(10000n);

    // Single set
    await c.setInitialOwner(a1.address, 5);
    expect(await c.punkIndexToAddress(5)).to.equal(a1.address);
    expect(await c.balanceOf(a1.address)).to.equal(1n);
    expect(await c.punksRemainingToAssign()).to.equal(9999n);

    // Batch set
    await c.setInitialOwners([a1.address, a2.address], [6, 7]);
    expect(await c.punkIndexToAddress(6)).to.equal(a1.address);
    expect(await c.punkIndexToAddress(7)).to.equal(a2.address);
    expect(await c.balanceOf(a1.address)).to.equal(2n);
    expect(await c.balanceOf(a2.address)).to.equal(1n);
    expect(await c.punksRemainingToAssign()).to.equal(9997n);
  });

  it("non-owner cannot set initial owners; cannot set after finalized", async () => {
    const { c, a1, a2 } = await deploy();

    await expect(c.connect(a1).setInitialOwner(a1.address, 1)).to.be.reverted;

    await c.setInitialOwner(a1.address, 1);
    await c.allInitialOwnersAssigned();

    await expect(c.setInitialOwner(a2.address, 2)).to.be.reverted;
    await expect(c.setInitialOwners([a2.address], [3])).to.be.reverted;
  });
});

