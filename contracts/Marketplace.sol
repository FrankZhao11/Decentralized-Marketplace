// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    struct Item {
        uint256 id;
        address payable seller;
        address payable buyer;
        uint256 price;
        bool sold;
        bool delivered;
        bool disputed;
    }

    uint256 public itemCount;
    mapping(uint256 => Item) public items;

    event ItemListed(
        uint256 indexed id,
        address indexed seller,
        uint256 price
    );
    event ItemPurchased(
        uint256 indexed id,
        address indexed buyer,
        uint256 price
    );
    event DeliveryConfirmed(uint256 indexed id, address indexed buyer);
    event DisputeRaised(uint256 indexed id, address indexed buyer);
    event DisputeResolved(uint256 indexed id, bool refundIssued);

    /// @notice Seller lists an item with a given price (in wei)
    function listItem(uint256 _price) external {
        require(_price > 0, "Price must be above zero");

        itemCount++;
        items[itemCount] = Item({
            id: itemCount,
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            price: _price,
            sold: false,
            delivered: false,
            disputed: false
        });

        emit ItemListed(itemCount, msg.sender, _price);
    }

    /// @notice Buyer purchases an item by sending exact `price` in wei
    function purchaseItem(uint256 _id) external payable nonReentrant {
        Item storage item = items[_id];
        require(item.id != 0, "Item does not exist");
        require(!item.sold, "Item already sold");
        require(msg.value == item.price, "Incorrect ETH amount");

        item.sold = true;
        item.buyer = payable(msg.sender);

        emit ItemPurchased(_id, msg.sender, msg.value);
    }

    /// @notice Buyer confirms delivery; funds are released to seller
    function confirmDelivery(uint256 _id) external nonReentrant {
        Item storage item = items[_id];
        require(item.sold, "Item not sold");
        require(msg.sender == item.buyer, "Only buyer can confirm");
        require(!item.delivered, "Already confirmed");

        item.delivered = true;
        item.seller.transfer(item.price);

        emit DeliveryConfirmed(_id, msg.sender);
    }

    /// @notice Buyer raises a dispute if something goes wrong
    function raiseDispute(uint256 _id) external {
        Item storage item = items[_id];
        require(item.sold, "Item not sold");
        require(msg.sender == item.buyer, "Only buyer can dispute");
        require(!item.disputed, "Dispute already raised");
        require(!item.delivered, "Cannot dispute after confirmation");

        item.disputed = true;
        emit DisputeRaised(_id, msg.sender);
    }

    /// @notice Owner (deployer) resolves disputes, choosing to refund (true) or release to seller (false)
    function resolveDispute(uint256 _id, bool _refund) external onlyOwner nonReentrant {
        Item storage item = items[_id];
        require(item.disputed, "No dispute to resolve");
        require(item.sold && !item.delivered, "Item already settled");

        item.disputed = false;
        item.delivered = true; // prevent further actions

        if (_refund) {
            // refund buyer
            item.buyer.transfer(item.price);
        } else {
            // release to seller
            item.seller.transfer(item.price);
        }

        emit DisputeResolved(_id, _refund);
    }
}
