import React, { useState } from 'react';

export default function ListItemForm({ marketplace, account, refreshItems }) {
  const [price, setPrice] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await marketplace.methods
        .listItem(price)
        .send({ from: account });
      setPrice('');
      refreshItems();
    } catch (err) {
      console.error(err);
      alert('Listing failed: ' + err.message);
    }
  };

  return (
    <form onSubmit={submit}>
      <h2>List a New Item</h2>
      <input
        type="number"
        placeholder="Price in Wei"
        value={price}
        onChange={e => setPrice(e.target.value)}
        required
      />
      <button type="submit">List Item</button>
    </form>
  );
}
