//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Campaign {
  string public title;
  address public owner;
  uint public balance = 0;
  uint public createdAt;
  uint public endDate;
  uint public fundingGoal;
  uint private counter;

  // track the NFT id and the address that made the
  // contribution:
  mapping(uint => address) contributions;

  constructor(string memory _title, uint _fundingGoal) {
    // NOTE: How to make sure the date is in the future? Greater than now()
    owner = msg.sender;
    title = _title;
    createdAt = block.timestamp;
    endDate = createdAt + 30 days;
    fundingGoal = _fundingGoal;
  }

  function ownerOf (uint tokenId) public view returns(address) {
    return contributions[tokenId];
  }

  // function _mint (string memory _type, address _receiver) internal {
  //   contributions[counter] = _receiver;
  //   counter++;
  // }

  function contribute() public payable {
    require(msg.value > 0.01 ether, "The minimum contribution is 0.01 ether");
    balance += msg.value;
  }
}

    // string type;

    // if (msg.value > 1 ether) {
    //   type = "Gold";
    // } else if (msg.value > 0.25 ether) {
    //   type = "Silver";
    // } else {
    //   type = "Bronze";
    // }

    // _mint(type, msg.sender);