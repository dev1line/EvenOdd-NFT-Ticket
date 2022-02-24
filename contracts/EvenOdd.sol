// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMasterCash {
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
    function getDueDate(uint tokenId) external view returns (uint256);
    function balanceOf(address owner) external view returns (uint);
}

contract EvenOdd is Ownable, ReentrancyGuard {
    address private _CASH;
    address private _ticket;//address(0x5f`3527B3d4B0eF893cB8423417392ee2Cab6998C)

    struct PlayerMetadata {
        uint256 betAmount;
        address player;
        bool isEven;
    }

    address[] public playersArray;
    mapping(address => PlayerMetadata) public players;

    uint256 public totalBetAmount;
    uint256 public totalBetAmountPerRoll;
    uint256 public rollId = 1;

    event Withdraw(uint256 indexed amount);
    event Bet(uint256 rollId, address player, uint256 amount, bool isEven);
    event DiceRolled(uint256 rollId, uint8 diceNumber_1, uint8 diceNumber_2, bool isEven);

    constructor(address _dealer, address _ticketAddress, address _tokenCASH) {
        transferOwnership(_dealer);
        _ticket = _ticketAddress;
        _CASH = _tokenCASH;
    }

    function transfer() external payable onlyOwner {}

    function withdraw(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be not zero");
        require(_amount <= getDealerBalance(), "Amount exceeds balance");
        transferMoney(_msgSender(), _amount);

        emit Withdraw(_amount);
    }

    function bet(bool _isEven) external payable nonReentrant {
        require(IMasterCash(_ticket).balanceOf(msg.sender) > 0, "You need to buy a ticket to play this game");
        uint tokenId = IMasterCash(_ticket).tokenOfOwnerByIndex(msg.sender, 0);
        require(block.timestamp < IMasterCash(_ticket).getDueDate(tokenId), "Your ticket is expired");
        require(!isAlreadyBet(_msgSender()), "Already bet");
        require(
            msg.value > 0,
            "minimum amount needed to play the game"
        );
        require(
            (totalBetAmountPerRoll + msg.value) * 2 <= getDealerBalance(),
            "total bet amount exceeds dealer balance"
        );

        players[_msgSender()] = PlayerMetadata(
            msg.value,
            _msgSender(),
            _isEven
        );
        require(IERC20(_CASH).transferFrom(msg.sender, address(this), msg.value), "transferFrom failed !");
        playersArray.push(_msgSender());
        totalBetAmount += msg.value;
        totalBetAmountPerRoll += msg.value;

        emit Bet(rollId, _msgSender(), msg.value, _isEven);
    }

    function rollDice() external onlyOwner {
        require(totalBetAmountPerRoll > 0, "No one place bet");

        uint8 diceNumber_1 = generateRandomNumber(1);
        uint8 diceNumber_2 = generateRandomNumber(2);

        bool isEven = (diceNumber_1 + diceNumber_2) % 2 == 0;
        emit DiceRolled(rollId, diceNumber_1, diceNumber_2, isEven);

        for (uint256 i = 0; i < playersArray.length; i++) {
            if (players[playersArray[i]].isEven == isEven) {
                transferMoney(playersArray[i], players[playersArray[i]].betAmount * 2);
            }
        }
        resetBoard();
        rollId++;
    }

    function isAlreadyBet(address _account) public view returns (bool) {
        return players[_account].betAmount > 0;
    }

    function getDealerBalance() public view returns (uint256) {
        return IERC20(_CASH).balanceOf(address(this));
    }

    function getBetAmountOf(address _account) public view returns (uint256) {
        return players[_account].betAmount;
    }

    function getPlayerInfo(address _account) external view
        returns (
            uint256 betAmount,
            bool isEven
        )
    {
        betAmount = players[_account].betAmount;
        isEven = players[_account].isEven;

        return (betAmount, isEven);
    }

    function transferMoney(address _account, uint256 _betAmount) private {
        // payable(players[_account].player).transfer(_betAmount);
        IERC20(_CASH).transfer(players[_account].player, _betAmount);
    }

    function resetBoard() private {
        for (uint256 i = 0; i < playersArray.length; i++) {
            delete (players[playersArray[i]]);
        }
        delete playersArray;
        totalBetAmountPerRoll = 0;
    }

    function generateRandomNumber(uint256 seed) private view returns (uint8) {
        uint8 result = uint8(
            (uint256(
                keccak256(
                    abi.encodePacked(
                        tx.origin,
                        blockhash(block.number - 1),
                        block.timestamp,
                        seed
                    )
                )
            ) % 6) + 1
        );
        return result;
    }
}
