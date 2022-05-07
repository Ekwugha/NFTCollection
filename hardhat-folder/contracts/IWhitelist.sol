// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IWhitelist {
    // this function here gets the whitelisted address from the whitelist contract
    // that was deployed earlier on another website. It takes in an address and returns a boolean
    function whitelistedAddresses(address) external view returns (bool);
}