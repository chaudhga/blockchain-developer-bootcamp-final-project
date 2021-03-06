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

  uint8   private constant DECIMALS = 18;
  uint256 private constant DECIMALFACTOR = 10 ** uint256(DECIMALS);
  uint256 private TOKENS_PER_REGISTRANT = 100 * uint256(DECIMALFACTOR);
  uint256 private AIRDROP_SUPPLY = 10000000 * uint256(DECIMALFACTOR);
  uint256 private TOTAL_SUPPLY = 1000000000000 * uint256(DECIMALFACTOR);  

  // Reset DEMO to false when moving to production (and specify admin address explicitely through setAdmin)
  // DEMO=true: Makes latest campaign host admin 
  bool private DEMO = true;

  Wormies public wormies;

  mapping (uint => Campaign) public campaigns;
  mapping (bytes4 => uint) public campaignCodes;
  mapping (uint => address[]) private registrants;
  enum State{Open, Full, Closed, Airdropped}

  address private _admin;

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
  event LogRegistration(address _address, string title, uint campaignID, uint totalRegistered, uint maxCapacity);

  constructor(address _token) {
    campaignCount = 0;
    wormies = Wormies(_token);
  }

/**
/// @notice creates a new campaign; generates campaign id to be shared for registrations
///         assigns creator as the host which allows them to controol states
/// @dev to fetch details of the campaign created call getCampaignDetails
/// TODO: Ability to handle miltiple concurrent campaign creations
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

    if(DEMO){
      // Make current campaign creator admin to be able to carry out airdrops
      _admin = msg.sender;
    }

    emit LogCampaignOpened(_title, campaignCount, _code);
    return (true, campaignCount);
  }

/** 
/// @notice registration function (requires campaign code provided by host), only allows single registration
/// @dev updates the state to full for last registrant, should call resetRegistrations() first to allow re-registrations 
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
      emit LogRegistration(msg.sender, campaigns[_id].title, _id, registrants[_id].length, campaigns[_id].capacity);
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
/// @notice Allocate tokens to registrants 
/// @dev only hosts can call this
 */
  function airdrop(uint _id) public 
    validID(_id)
    onlyAdmin
    isClosedOrFull(_id)
    hasRegistrants(_id)
    returns(bool){
    uint totalRegistrants = registrants[_id].length;
    campaigns[_id].state = State.Airdropped;
    require(wormies.balanceOf(address(this))>=TOKENS_PER_REGISTRANT);
    for(uint i=0; i<totalRegistrants; i++){
        address registrant = registrants[_id][i];
        wormies.transfer(registrant, TOKENS_PER_REGISTRANT);
      }
      return(true);
    }
  // currently only allows airdrop for latest campaign
  function airdropLatestCampaign() public
  returns(bool){
    return(airdrop(getCampaignID()));
  }

  /**
  /// Generates Unique Hash using keccak256 to be used as code to be shared using title & capacity
   */
  function hash (
        string memory _text,
        uint _num,
        address _addr
    ) internal view returns (bytes4) {
        return bytes4(keccak256(abi.encodePacked(_text, _num, _addr, block.timestamp)));
    }


  /**
  /// Set Functions to configure Airdrop related parameters by Owner/Admin
   */
  function setDemo(bool _isDemo) public onlyOwner{
    DEMO = _isDemo;
  }

  function setAdmin(address _adminAddr) public onlyOwner{
    // TODO: Functionality to add new addresses as admin to perform airdrops etc.
    _admin = _adminAddr;
  }

  function setTokensPerRegistrant(uint _tprAmount) public onlyAdmin{
    TOKENS_PER_REGISTRANT = _tprAmount;
  }

  function setAirdropSupply(uint _airdropSupply) public onlyAdmin{
    AIRDROP_SUPPLY = _airdropSupply;
  }

  function setTotalSupply(uint _totalSupply) public onlyAdmin{
    TOTAL_SUPPLY = _totalSupply;
  }

  function resetRegistrations() public onlyAdmin{ 
    // TODO: Clear status of registrants, 
    //       allow re-regestrations for previously registered
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

  function checkAndMarkFull(uint _id) internal validID(_id){
    if(registrants[_id].length == campaigns[_id].capacity){
        campaigns[_id].state = State.Full;
    }
    emit LogCampaignFull(campaigns[_id].title, _id);
  }

  /**
  /// Modifiers 
   */
  modifier onlyHost(uint _campaignID){
    require(msg.sender == campaigns[_campaignID].host, "Only campaign host can perform this action.");
    _;
  }

  modifier onlyAdmin(){
    require(msg.sender == _admin || msg.sender == this.owner());
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