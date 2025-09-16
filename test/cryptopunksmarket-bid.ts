import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoPunksMarket - bids and accept", () => {
  async function setup() {
    const signers = await ethers.getSigners();
    const [owner] = signers;
    const seller = signers[1];
    const bidder1 = signers[2];
    const bidder2 = signers[3];
    const F = await ethers.getContractFactory("CryptoPunksMarket");
    const c = await F.deploy({ value: 0 });
    await c.setInitialOwner(seller.address, 20);
    await c.allInitialOwnersAssigned();
    return { c, owner, seller, bidder1, bidder2 };
  }

  it("higher bid replaces lower; previous refunded; owner accepts bid", async () => {
    const { c, seller, bidder1, bidder2 } = await setup();

    const v1 = 1_000_000n;
    const v2 = 2_000_000n;

    await c.connect(bidder1).enterBidForPunk(20, { value: v1 });
    expect((await c.punkBids(20)).value).to.equal(v1);

    await c.connect(bidder2).enterBidForPunk(20, { value: v2 });
    expect((await c.punkBids(20)).value).to.equal(v2);

    // bidder1 refunded to pending withdrawals
    expect(await c.pendingWithdrawals(bidder1.address)).to.equal(v1);
    await c.connect(bidder1).withdraw();
    expect(await c.pendingWithdrawals(bidder1.address)).to.equal(0n);

    // Seller accepts highest bid
    await c.connect(seller).acceptBidForPunk(20, v2);
    expect(await c.punkIndexToAddress(20)).to.equal(bidder2.address);
    expect(await c.pendingWithdrawals(seller.address)).to.equal(v2);
  });
});

