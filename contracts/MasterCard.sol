// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./IMasterCard.sol";
contract MasterCard is ERC721Enumerable {
    struct ExpiredDay {
        uint256 initialDate;
        uint256 dueDate;
        uint256 tokenId;
    }
    string private _baseUri;
    uint256 public _duration = 30 days;
    mapping(uint256 => ExpiredDay) public expiredTime;
    constructor (string memory name, string memory symbol) ERC721(name, symbol) {
        // solhint-disable-previous-line no-empty-blocks 
    }
    function _baseURI() internal view override returns (string memory) {
        return _baseUri;
    }
    function setBaseURI(string memory uri) internal {

       _baseUri = uri;
    }
    function mintNFT(address _to, uint256 _tokenId, string memory _uri) public {
        setBaseURI(_uri);
        super.tokenURI(_tokenId);
        super._mint(_to, _tokenId);
        expiredTime[_tokenId].initialDate = block.timestamp;
        expiredTime[_tokenId].dueDate = expiredTime[_tokenId].initialDate + _duration;
    }

    function getDueDate(uint256 tokenId) external view returns (uint256) {
        return expiredTime[tokenId].dueDate;
    }
}