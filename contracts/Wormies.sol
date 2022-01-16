// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Wormies is ERC20 {
    constructor() ERC20("Wormies", "WRM") {
        _mint(address(this), 1000000000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
