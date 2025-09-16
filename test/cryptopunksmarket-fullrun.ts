import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoPunksMarket - full run scenario", () => {
  async function setup() {
    const signers = await ethers.getSigners();
    const [owner, a1, a2, a3] = signers;
    const F = await ethers.getContractFactory("CryptoPunksMarket");
    const c = await F.deploy({ value: 0 });

    // Assign 3 punks to three accounts, then finalize
    await c.setInitialOwners([a1.address, a2.address, a3.address], [1000, 1001, 1002]);
    await c.allInitialOwnersAssigned();
    return { c, owner, a1, a2, a3 };
  }

  it("runs through sale, targeted sale, bids, and accept bid", async () => {
    const { c, a1, a2, a3 } = await setup();

    // a2 offers 1001 for sale
    const price = 10000n;
    await c.connect(a2).offerPunkForSale(1001, price);

    // a3 tries too little
    await expect(c.connect(a3).buyPunk(1001, { value: price - 1n })).to.be.reverted;

    // a1 buys correctly
    await c.connect(a1).buyPunk(1001, { value: price });
    expect(await c.punkIndexToAddress(1001)).to.equal(a1.address);

    // a1 offers 1001 only to a3 and a3 buys
    await c.connect(a1).offerPunkForSaleToAddress(1001, price, a3.address);
    await expect(c.connect(a2).buyPunk(1001, { value: price })).to.be.reverted;
    await c.connect(a3).buyPunk(1001, { value: price });
    expect(await c.punkIndexToAddress(1001)).to.equal(a3.address);

    // a2 places a bid on 1002 and withdraws it
    await c.connect(a2).enterBidForPunk(1002, { value: 30000n });
    expect((await c.punkBids(1002)).hasBid).to.equal(true);
    await c.connect(a2).withdrawBidForPunk(1002);
    expect((await c.punkBids(1002)).hasBid).to.equal(false);
  });
});
