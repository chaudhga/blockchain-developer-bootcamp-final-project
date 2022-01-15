// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";


contract Wormies is ERC20 {
    constructor() ERC20("Wormies", "WRM") {
        _mint(address(this), 1000000000 * 10 ** 18);
    }

    /// TODO: Figure out a way to resolve ownable related issues and 
    ///       add encorporate better security functionalities from OpenZeppelin
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
  }
