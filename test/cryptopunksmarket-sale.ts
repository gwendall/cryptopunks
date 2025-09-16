import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoPunksMarket - sales", () => {
  async function deployAndAssignTo(accIndex: number, punkIndex: number) {
    const signers = await ethers.getSigners();
    const [owner] = signers;
    const seller = signers[accIndex];
    const F = await ethers.getContractFactory("CryptoPunksMarket");
    const c = await F.deploy({ value: 0 });
    await c.setInitialOwner(seller.address, punkIndex);
    await c.allInitialOwnersAssigned();
    return { c, owner, seller, signers };
  }

  it("offer and buy with correct payment; pending withdrawals and ownership update", async () => {
    const { c, seller, signers } = await deployAndAssignTo(1, 1);
    const buyer = signers[2];

    const price = 10000n;
    await c.connect(seller).offerPunkForSale(1, price);

    await expect(c.connect(buyer).buyPunk(1, { value: price - 1n })).to.be.reverted; // too little

    await c.connect(buyer).buyPunk(1, { value: price });
    expect(await c.punkIndexToAddress(1)).to.equal(buyer.address);

    const offer = await c.punksOfferedForSale(1);
    expect(offer.isForSale).to.equal(false);

    // Seller can withdraw the payment
    expect(await c.pendingWithdrawals(seller.address)).to.equal(price);
    await c.connect(seller).withdraw();
    expect(await c.pendingWithdrawals(seller.address)).to.equal(0n);
  });

  it("offer to address only; wrong buyer reverts, correct buyer succeeds", async () => {
    const { c, seller, signers } = await deployAndAssignTo(1, 2);
    const allowedBuyer = signers[3];
    const wrongBuyer = signers[4];
    const price = 5000n;

    await c.connect(seller).offerPunkForSaleToAddress(2, price, allowedBuyer.address);

    await expect(c.connect(wrongBuyer).buyPunk(2, { value: price })).to.be.reverted;

    await c.connect(allowedBuyer).buyPunk(2, { value: price });
    expect(await c.punkIndexToAddress(2)).to.equal(allowedBuyer.address);
  });
});
