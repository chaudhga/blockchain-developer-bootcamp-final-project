# Security Measures

## Unprotected Ether Withdrawal - (SWC-105)
* ```Early Birds Contract``` is protected by the ```Ownable``` access control library using the ```onlyOwner``` modifier, which helps to protect against any unauthorized access to execute critical functionality of ```airdrop```. Also, functionality to ```close``` campaign is protected with the ```onlyHost``` modifier.

--- 

## Outdated Compiler Version - (SWC-102)
* The ```Eearly Birds and Wormies Contracts``` are using recent stable compiler version ```0.8.9```.

---

## Floating Pragma - (SWC-103)
* A specific compiler version ```0.8.9``` is used to avoid any bugs introduced in any other old/new compiler version.

---

## Checking Conditions using Require(SWC-110)
* Always using the ```require()``` function when applicable to make sure certain conditions are met before calling continuing the function call.