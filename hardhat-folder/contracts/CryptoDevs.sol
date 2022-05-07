// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// tihs is gonna help us create the contract for the non-fungible token
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// this is gonna help us in the ownership of the contract
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {

    // _baseTokenURI for computing {tokenURI}. If set, the resulting URI for each
    // * token will be THE concatenation of the `baseURI` and the `tokenId`.
    string _baseTokenURI;

    // Whitelist contract instance
    IWhitelist whitelist;

    // boolean to keep track of whether presale started or not
    bool public presaleStarted;

    // timestamp for when presale would end
    uint256 public presaleEnded;

    // max number of tokens(CryptoDevs)
    uint256 public maxTokenIds = 20;

    // total number of tokenIds minted
    uint256 public tokenIds;

    //  _price is the price of one Crypto Dev NFT
    uint256 public _price = 0.01 ether; 

    // _paused is used to pause the contract in case of an emergency
    bool public _paused;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }



    // ERC721 constructor takes in a `name` and a `symbol` to the token collection.
    // * name in this case is `Crypto Devs` and symbol is `CD`.
    // * Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
    // * It also initializes an instance of whitelist interface.
    constructor(string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        // interface created and linked with the address of my whitelist contract so that the Iwhitelist conracts knows the address its getting data from
        whitelist = IWhitelist(whitelistContract);
    }

    // startPresale starts a presale for the whitelisted addresses
    // N/B: onlyOwner is gotten from ownable contract from openzeplin
    // * and it makes sure that only the owner can call this function
    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    // presaleMint allows a user to mint one NFT per transaction during the presale.
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale ended");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not in the whitelist");
        require(tokenIds < maxTokenIds, "Exceeded the limit");
        require(msg.value >= _price, "Ether sent is not correct");

        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    // mint allows a user to mint 1 NFT per transaction after the presale has ended.
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended");
        require(tokenIds < maxTokenIds, "Exceeded the limit");
        require(msg.value >= _price, "Ether sent is not correct");

        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }


    //  _baseURI overides the Openzeppelin's ERC721 implementation which by default
    //   * returned an empty string for the baseURI
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }



    // setPaused makes the contract paused or unpaused
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }




    // withdraw sends all the ether in the contract
    //   * to the owner of the contract
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{ value: amount }("");
        require(sent, "Failed to send ether");
    }



    // since we have payable functions, we have to these functions 
    // * to be able to recieve ether if not we'll get an error from the compiler
    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

}


