# Design Patterns

## Inheritance and Interfaces
* ```Early Birds Contract``` is inheriting the ownership and access control permissions from the OpenZepplin ```Ownable``` contract.
* ```Wormies Contract``` is inheriting from ERC20 from the OpenZepplin ```ERC20``` token contract.

---
## Access Control Design Patterns
* ```airdrop()``` is protected using the ```onlyOwner``` modifier inherited from OpenZepplin.
* ```close()``` is protected using the ```onlyHost``` modifier.
