import React from 'react';

export default function ItemCard({ item, marketplace, account, refreshItems }) {
  const { id, seller, buyer, price, sold, delivered, disputed } = item;

  const buy = async () => {
    try {
      await marketplace.methods
        .purchaseItem(id)
        .send({ from: account, value: price });
      refreshItems();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelivery = async () => {
    try {
      await marketplace.methods
        .confirmDelivery(id)
        .send({ from: account });
      refreshItems();
    } catch (err) {
      console.error(err);
    }
  };

  const dispute = async () => {
    try {
      await marketplace.methods
        .raiseDispute(id)
        .send({ from: account });
      refreshItems();
    } catch (err) {
      console.error(err);
    }
  };

  const status = !sold
    ? 'Available'
    : delivered
      ? 'Completed'
      : disputed
        ? 'In Dispute'
        : 'Sold';

  return (
    <div className="item-card">
      <h3>Item #{id}</h3>
      <p>Seller: {seller}</p>
      <p>Price: {price} Wei</p>
      <p>Status: {status}</p>

      {!sold && account !== seller && (
        <button onClick={buy}>Buy</button>
      )}

      {sold && account === buyer && !delivered && !disputed && (
        <div>
          <button onClick={confirmDelivery}>Confirm Delivery</button>
          <button onClick={dispute}>Raise Dispute</button>
        </div>
      )}
    </div>
  );
}
