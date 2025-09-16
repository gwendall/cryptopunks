import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoPunksMarket - transferPunk effects", () => {
  async function setup() {
    const [owner, a1, a2] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CryptoPunksMarket");
    const c = await F.deploy({ value: 0 });
    await c.setInitialOwner(a1.address, 10);
    await c.allInitialOwnersAssigned();
    return { c, owner, a1, a2 };
  }

  it("transfer clears sale and refunds bid from new owner", async () => {
    const { c, a1, a2 } = await setup();

    // Put up for sale
    await c.connect(a1).offerPunkForSale(10, 123n);

    // New owner places a bid (should be allowed since not owner yet)
    const bidValue = 10000n;
    await c.connect(a2).enterBidForPunk(10, { value: bidValue });
    const existing = await c.punkBids(10);
    expect(existing.hasBid).to.equal(true);
    expect(existing.bidder).to.equal(a2.address);
    expect(existing.value).to.equal(bidValue);

    // Direct transfer from a1 to a2
    await c.connect(a1).transferPunk(a2.address, 10);
    expect(await c.punkIndexToAddress(10)).to.equal(a2.address);

    // Sale should be cleared
    const offer = await c.punksOfferedForSale(10);
    expect(offer.isForSale).to.equal(false);

    // Bid from new owner should be refunded to pending withdrawals
    expect(await c.pendingWithdrawals(a2.address)).to.equal(bidValue);
  });
});

