//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Campaign {
  address payable public owner;
  string public title;
  uint public balance = 0;
  uint public createdAt;
  uint public endDate;
  uint public fundingGoal;
  uint private counter;
  bool private active = true;

  struct Contribution {
    uint value;
    uint date;
    string tier;
  }

  // track the NFT id and the address that made the
  // contribution:
  mapping(uint => address) private awardOwners;
  mapping(address => Contribution[]) private contributions;

  event ContributionReceived(address indexed contributor, uint contributionAmount, string contributionTier);
  event FundingComplete(string title, uint totalContributed);
  event CampaignCancelled(string title, address indexed owner, string message);

  modifier onlyOwner() {
      require(owner == msg.sender, "Ownable: caller is not the owner");
      _;
  }

  constructor(string memory _title, uint _fundingGoal) {
    owner = payable(msg.sender);
    title = _title;
    createdAt = block.timestamp;
    endDate = createdAt + 30 days;
    fundingGoal = _fundingGoal;
  }

  function totalContributions () public view returns(uint contributionTotal) {
    Contribution[] memory senderContributions = contributions[msg.sender];
    uint numberOfContributions = senderContributions.length;

    for (uint i = 0; i < numberOfContributions; i++) {
      contributionTotal += senderContributions[i].value;
    }

    return contributionTotal;
  }
  

  function getStatus () public view returns(bool campaignStatus) {
    return active;
  }
  
  function cancel (string memory _cancellationMessage) public onlyOwner {
    active = false;
    emit CampaignCancelled(title, msg.sender, _cancellationMessage);
  }
  
  function contribute() public payable {
    require(active, "Campaign closed, no more contributions accepted.");
    require(msg.value > 0.01 ether, "The minimum contribution is 0.01 ether");
    string memory contributionType;

    balance += msg.value;

    if (msg.value >= 1 ether) {
      contributionType = "Gold";
    } else if (msg.value >= 0.25 ether) {
      contributionType = "Silver";
    } else {
      contributionType = "Bronze";
    }

    _mint(contributionType, msg.sender);

    emit ContributionReceived(msg.sender, msg.value, contributionType);

    if(balance >= fundingGoal) {
      active = false;
      emit FundingComplete(title, balance);
    }
  }

  function withdraw () public onlyOwner {
    owner.transfer(balance);    
  }

  function withdraw (uint amount) public onlyOwner {
    owner.transfer(amount);    
  }

  function _mint (string memory _type, address _receiver) internal {
    Contribution memory contribution = Contribution({
      value: msg.value,
      date: block.timestamp,
      tier: _type
    });
    awardOwners[counter] = _receiver;
    contributions[_receiver].push(contribution);
    counter++;
  }

  function ownerOf (uint tokenId) public view returns(address) {
    return awardOwners[tokenId];
  }

  function balanceOf () public view returns(uint numberOfContributions) {
    return contributions[msg.sender].length;
  }
  
}


