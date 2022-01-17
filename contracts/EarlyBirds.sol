// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import './Wormies.sol';

/**
/// @title A contract to run early bird promotions for first N registrants
/// @author chaudhga
/// @custom:experimental This is an experimental contract.
 */
contract EarlyBirds is Ownable{
  uint public campaignCount;

  uint8   public constant DECIMALS = 18;
  uint256 public constant DECIMALFACTOR = 10 ** uint256(DECIMALS);
  uint256 constant TOKENS_PER_REGISTRANT = 100 * uint256(DECIMALFACTOR);
  uint256 public AIRDROP_SUPPLY = 10000000 * uint256(DECIMALFACTOR);
  uint256 public TOTAL_SUPPLY = 1000000000000 * uint256(DECIMALFACTOR);  
  Wormies public wormies;

  mapping (uint => Campaign) public campaigns;
  mapping (bytes4 => uint) public campaignCodes;
  mapping (uint => address[]) private registrants;
  enum State{Open, Full, Closed, Airdropped}

  mapping (address => bool) public registrantStatus;

  struct Campaign{
    string title; 
    bytes4 code; 
    uint id; 
    State state; 
    uint capacity; 
    address host;
  }

  event LogCampaignOpened(string title, uint id, bytes4 campaignCode);
  event LogCampaignClosed(string title, uint id);
  event LogCampaignFull(string title, uint id);
  event LogRegistration(address _address, uint campaignID);

  constructor(address _token) {
    campaignCount = 0;
    wormies = Wormies(_token);
  }


/**
/// @notice creates a new campaign; generates campaign id to be shared for registrations
///         assigns creator as the host which allows them to controol states
/// @dev to fetch details of the campaign created call getCampaignDetails
 */
  function addCampaign(string memory _title, uint _capacity) public returns(bool, uint){
    bytes4 _code = hash(_title, _capacity, msg.sender);
    campaignCount += 1;
    campaigns[campaignCount] = Campaign({
      title: _title,
      code: _code,
      id: campaignCount,
      state: State.Open,
      capacity: _capacity,
      host: msg.sender
    });
    campaignCodes[_code] = campaignCount;
    emit LogCampaignOpened(_title, campaignCount, _code);
    return (true, campaignCount);
  }

/** 
/// @notice registration function (requires campaign code provided by host), only allows single registration
/// @dev updates the state to full for last registrant
 */
  function register(bytes4 _code) public 
    validCode(_code)
    notAlreadyRegistered()
    hasCapacity(codeToID(_code))
    isOpen(codeToID(_code))
    returns(bool){
      uint _id = codeToID(_code);
      uint _capacity = campaigns[_id].capacity;
      if(registrants[_id].length < _capacity){
              registrants[_id].push(msg.sender);
      }
      checkAndMarkFull(_id);
      registrantStatus[msg.sender]=true;
      emit LogRegistration(msg.sender, _id);
      return true;
    }
/** 
/// @notice Only host can close the campaign. Campaign can be closed at any stage, full or not.
/// @dev before executing airdrop campaign registration must be closed
 */
  function close(uint _id) public 
    validID(_id)
    onlyHost(_id)
    isNotClosed(_id)
    returns(bool){
      campaigns[_id].state = State.Closed;
      emit LogCampaignClosed(campaigns[_id].title, _id);
      return(true);
    }
  function closeByCode(bytes4 _code) public 
  onlyHost(campaignCodes[_code])
  returns(bool){
    return(close(campaignCodes[_code]));
  }
  function closeLatestCampaign() public 
  onlyHost(getCampaignID())
  returns(bool){
    return(close(getCampaignID()));
  }
/** 
/// @notice Allocate tokens to registrants and burn any remaining tokens
/// @dev onlyOwner can call this
 */
  function airdrop(uint _id) public 
    validID(_id)
    onlyOwner
    isClosedOrFull(_id)
    hasRegistrants(_id)
    returns(bool){
      uint totalRegistrants = registrants[_id].length;
 
      for(uint i=0; i<totalRegistrants; i++){
        address registrant = registrants[_id][i];
        // wormies.transferFrom(msg.sender, registrant, TOKENS_PER_REGISTRANT);
        wormies.mint(registrant, TOKENS_PER_REGISTRANT);
      }
      campaigns[_id].state = State.Airdropped;
      return(true);
    }
  function airdropLatestCampaign() public
  returns(bool){
    return(airdrop(getCampaignID()));
  }

  /** 
  ///  Utility Functions
   */

  function getCampaignID() public view validID(campaignCount) returns(uint){
    return campaignCount;
  }
  function codeToID(bytes4 _code) public view validCode(_code) returns(uint){
    return(campaignCodes[_code]);
  }

  // Retrieves campaign details using id
  function getCampaignDetails(uint _id) public view
    validID(_id)
    returns(string memory, bytes4 , State , uint , address , uint ){
      Campaign memory campaign = campaigns[_id];
      uint registrationCount = registrants[_id].length;
      return(campaign.title, campaign.code, campaign.state, campaign.capacity, campaign.host, registrationCount);
    }
  
  function getLastCampaignDetails() public view
    validID(getCampaignID())
    returns(string memory, bytes4 , State , uint , address , uint ){
      return(getCampaignDetails(getCampaignID()));
    }
  
  // Retrieves campaign details using code
  function getCampaignDetailsByCode(bytes4 _code) public view
    returns(string memory, bytes4 , State , uint , address , uint ){
      return(getCampaignDetails(codeToID(_code)));
    }
  
  // Allows host to reteive last code generated
  function getCompaignCodeById(uint _id) public view 
  validID(_id)
  onlyHost(_id) 
  returns(bytes4 _code){
    Campaign memory _campaign = campaigns[_id];
    return(_campaign.code);
  }

  function getCompaignStateById(uint _id) public view 
  validID(_id)
  returns(State){
    Campaign memory _campaign = campaigns[_id];
    return(_campaign.state);
  }

  function getRemainingCapacityById(uint _id) public view 
  validID(_id)
  returns(uint){
    Campaign memory _campaign = campaigns[_id];
    uint currRegistrantCount = registrants[_id].length;
    return(_campaign.capacity - currRegistrantCount);
  }

  function getRegistrantCount(uint _id) public view
  validID(_id)
  returns(uint){
    return(registrants[_id].length);
  }

  function getCapacityById(uint _id) public view 
  validID(_id)
  returns(uint){
    Campaign memory _campaign = campaigns[_id];
    return(_campaign.capacity);
  }

  function checkAndMarkFull(uint _id) internal validID(_id){
    if(registrants[_id].length == campaigns[_id].capacity){
        campaigns[_id].state = State.Full;
    }
    emit LogCampaignFull(campaigns[_id].title, _id);
  }

  /**
  /// Generates Unique Hash using keccak256 to be used as code to be shared using title & capacity
   */
  function hash (
        string memory _text,
        uint _num,
        address _addr
    ) internal pure returns (bytes4) {
        return bytes4(keccak256(abi.encodePacked(_text, _num, _addr)));
    }

  /**
  /// Modifiers 
   */
  modifier onlyHost(uint _campaignID){
    require(msg.sender == campaigns[_campaignID].host, "Only campaign host can perform this action.");
    _;
  }
  modifier notAlreadyRegistered(){
    require(!registrantStatus[msg.sender], "You have already registered to a campaign.");
    _;
  }
  modifier isOpen(uint _campaignID){
    Campaign memory campaign = campaigns[_campaignID];
    bytes memory emptyTitleTest = bytes(campaign.title);
    require(emptyTitleTest.length != 0 && campaign.state == State.Open, "Campagin is not open");
    _;
  }
  modifier isNotClosed(uint _campaignID){
    require(campaigns[_campaignID].state != State.Closed, "Campaign already closed.");
    _;
  }
  modifier isClosedOrFull(uint _campaignID){
    State campaignState = campaigns[_campaignID].state;
    require(campaignState == State.Closed || campaignState == State.Full, "Campaign should be already closed or full.");
    _;
  }
  modifier hasCapacity(uint _campaignID){
    require(campaigns[_campaignID].state != State.Full && 
            registrants[_campaignID].length < campaigns[_campaignID].capacity, "Max capacity reached");
    _;
  }
  modifier validCode(bytes4 _code){
    require(campaignCodes[_code] > 0, "code is invalid.");
    _;
  }
  modifier validID(uint _id){
    require(_id <= campaignCount && _id > 0, "Invalid campaign id");
    _;
  }
  modifier hasRegistrants(uint _id){
    require(registrants[_id].length > 0);
    _;
  }
}