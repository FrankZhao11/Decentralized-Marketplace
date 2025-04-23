// test/Marketplace.test.js
const Marketplace = artifacts.require("Marketplace");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');

contract("Marketplace", accounts => {
  let marketplace;
  const seller = accounts[0];
  const buyer  = accounts[1];
  const other  = accounts[2];
  const price  = web3.utils.toWei('1', 'ether');
  const wrong  = web3.utils.toWei('0.5', 'ether');

  beforeEach(async () => {
    marketplace = await Marketplace.new({ from: seller });
  });

  it("starts with zero items", async () => {
    const cnt = await marketplace.itemCount();
    assert.equal(cnt.toNumber(), 0);
  });

  it("lets a seller list an item", async () => {
    await marketplace.listItem(price, { from: seller });
    const cnt = await marketplace.itemCount();
    assert.equal(cnt.toNumber(), 1);

    const item = await marketplace.items(1);
    assert.equal(item.seller, seller);
    assert.equal(item.price.toString(), price);
    assert.equal(item.sold, false);
  });

  it("reverts when listing with zero price", async () => {
    await expectRevert(
      marketplace.listItem(0, { from: seller }),
      "Price must be above zero"
    );
  });

  it("lets a buyer purchase an item", async () => {
    await marketplace.listItem(price, { from: seller });
    await marketplace.purchaseItem(1, { from: buyer, value: price });

    const item = await marketplace.items(1);
    assert.equal(item.sold, true);
    assert.equal(item.buyer, buyer);
  });

  it("reverts purchase with incorrect value", async () => {
    await marketplace.listItem(price, { from: seller });
    await expectRevert(
      marketplace.purchaseItem(1, { from: buyer, value: wrong }),
      "Incorrect ETH amount"
    );
  });

  it("lets buyer confirm delivery and pays seller", async () => {
    await marketplace.listItem(price, { from: seller });
    await marketplace.purchaseItem(1, { from: buyer, value: price });

    const balBefore = web3.utils.toBN(await web3.eth.getBalance(seller));
    await marketplace.confirmDelivery(1, { from: buyer, gasPrice: 0 });
    const balAfter  = web3.utils.toBN(await web3.eth.getBalance(seller));

    assert(balAfter.sub(balBefore).eq(web3.utils.toBN(price)));
    const item = await marketplace.items(1);
    assert(item.delivered);
  });

  it("lets buyer raise a dispute", async () => {
    await marketplace.listItem(price, { from: seller });
    await marketplace.purchaseItem(1, { from: buyer, value: price });
    await marketplace.raiseDispute(1, { from: buyer });

    const item = await marketplace.items(1);
    assert(item.disputed);
  });

  it("only owner can resolve disputes", async () => {
    await marketplace.listItem(price, { from: seller });
    await marketplace.purchaseItem(1, { from: buyer, value: price });
    await marketplace.raiseDispute(1, { from: buyer });

    await expectRevert(
      marketplace.resolveDispute(1, true, { from: other }),
      "Ownable: caller is not the owner"
    );
  });

  it("owner can refund buyer in dispute", async () => {
    await marketplace.listItem(price, { from: seller });
    await marketplace.purchaseItem(1, { from: buyer, value: price });
    await marketplace.raiseDispute(1, { from: buyer });

    const balBefore = web3.utils.toBN(await web3.eth.getBalance(buyer));
    await marketplace.resolveDispute(1, true, { from: seller, gasPrice: 0 });
    const balAfter  = web3.utils.toBN(await web3.eth.getBalance(buyer));

    assert(balAfter.sub(balBefore).eq(web3.utils.toBN(price)));
    const item = await marketplace.items(1);
    assert.equal(item.disputed, false);
  });

  it("owner can pay seller in dispute", async () => {
    await marketplace.listItem(price, { from: seller });
    await marketplace.purchaseItem(1, { from: buyer, value: price });
    await marketplace.raiseDispute(1, { from: buyer });

    const balBefore = web3.utils.toBN(await web3.eth.getBalance(seller));
    await marketplace.resolveDispute(1, false, { from: seller, gasPrice: 0 });
    const balAfter  = web3.utils.toBN(await web3.eth.getBalance(seller));

    assert(balAfter.sub(balBefore).eq(web3.utils.toBN(price)));
    const item = await marketplace.items(1);
    assert.equal(item.disputed, false);
  });
});
