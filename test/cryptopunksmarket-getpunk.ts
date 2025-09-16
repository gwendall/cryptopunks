import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoPunksMarket - getPunk flow", () => {
  async function deploy() {
    const [owner, user] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CryptoPunksMarket");
    const c = await F.deploy({ value: 0 });
    return { c, owner, user };
  }

  it("cannot getPunk before finalization; can getPunk after finalization for unassigned index", async () => {
    const { c, user } = await deploy();

    // Contract requires allInitialOwnersAssigned before getPunk
    await expect(c.connect(user).getPunk(0)).to.be.reverted;

    await c.allInitialOwnersAssigned();

    await c.connect(user).getPunk(0);
    expect(await c.punkIndexToAddress(0)).to.equal(user.address);
    expect(await c.balanceOf(user.address)).to.equal(1n);
    expect(await c.punksRemainingToAssign()).to.equal(9999n);

    await expect(c.connect(user).getPunk(0)).to.be.reverted; // already assigned
    await expect(c.connect(user).getPunk(10000)).to.be.reverted; // out of range
  });
});

