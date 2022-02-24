// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MasterCard is ERC721Enumerable, Ownable {
    struct ExpiredDay {
        uint256 initialDate;
        uint256 dueDate;
    }
    string public _baseUri;
    uint256 public _duration = 30 days;
    mapping(uint256 => ExpiredDay) public expiredTime;
    constructor (string memory name, string memory symbol) ERC721(name, symbol) {
        // solhint-disable-previous-line no-empty-blocks 
    }
    function _baseURI() internal view override returns (string memory) {
        return _baseUri;
    }
    function setBaseURI(string memory uri) external onlyOwner {
       _baseUri = uri;
    }
    function extend(address owner) public {
        require(balanceOf(owner) > 0, "You not have a ticket !");
        uint256 tokenId = tokenOfOwnerByIndex(owner, 0);
        require(expiredTime[tokenId].dueDate < block.timestamp, "This ticket is not expired !");
        expiredTime[tokenId].initialDate = block.timestamp;
        expiredTime[tokenId].dueDate = expiredTime[tokenId].initialDate + _duration;
    }
    function mint(address _to, uint256 _tokenId) public {
        require(balanceOf(_to) == 0, "You not have a ticket !");
        _mint(_to, _tokenId);
        expiredTime[_tokenId].initialDate = block.timestamp;
        expiredTime[_tokenId].dueDate = expiredTime[_tokenId].initialDate + _duration;
    }

    function getDueDate(uint256 tokenId) external view returns (uint256) {
        return expiredTime[tokenId].dueDate;
    }
}