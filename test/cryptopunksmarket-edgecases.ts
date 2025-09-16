import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoPunksMarket - edge cases", () => {
  async function base() {
    const [owner, a1, a2] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CryptoPunksMarket");
    const c = await F.deploy({ value: 0 });
    return { c, owner, a1, a2 };
  }

  it("reverts on invalid index and unauthorized actions", async () => {
    const { c, a1, a2 } = await base();
    await c.setInitialOwner(a1.address, 0);

    // Unauthorized setInitialOwner
    await expect(c.connect(a1).setInitialOwner(a2.address, 1)).to.be.reverted;

    // Finalize then do actions
    await c.allInitialOwnersAssigned();

    // Offer by non-owner
    await expect(c.connect(a2).offerPunkForSale(0, 1n)).to.be.reverted;

    // Buy when not for sale
    await expect(c.connect(a2).buyPunk(0, { value: 1n })).to.be.reverted;

    // Invalid index
    await expect(c.connect(a2).buyPunk(10000, { value: 1n })).to.be.reverted;

    // Bid by owner disallowed
    await expect(c.connect(a1).enterBidForPunk(0, { value: 1n })).to.be.reverted;

    // Zero-value bid disallowed
    await expect(c.connect(a2).enterBidForPunk(0, { value: 0n })).to.be.reverted;
  });

  it("withdrawBid only by bidder; acceptBid only by owner; minPrice enforced", async () => {
    const { c, a1, a2 } = await base();
    await c.setInitialOwner(a1.address, 5);
    await c.allInitialOwnersAssigned();

    // Place a bid
    await c.connect(a2).enterBidForPunk(5, { value: 1000n });

    // Another account cannot withdraw someone else's bid
    await expect(c.withdrawBidForPunk(5)).to.be.reverted; // owner cannot withdraw bidder's bid

    // Owner cannot accept with higher minPrice than bid
    await expect(c.connect(a1).acceptBidForPunk(5, 1001n)).to.be.reverted;

    // Accept with valid minPrice
    await c.connect(a1).acceptBidForPunk(5, 1n);
    expect(await c.punkIndexToAddress(5)).to.equal(a2.address);
  });
});

