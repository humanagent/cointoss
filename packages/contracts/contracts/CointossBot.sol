// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SimpleCointossBot {
    enum BetStatus {
        CREATED,
        PAID,
        PAUSED,
        RESOLVED
    }

    struct Bet {
        address admin;
        string condition;
        uint256 outcomeIndex;
        uint256 totalBettingAmount;
        //uint256 startTime;
        //uint256 endTime;
        BetStatus status;
    }

    //║══════════════════════════════════════════╗
    //║              Events                      ║
    //║══════════════════════════════════════════╝
    event BetCreated(
        address admin,
        uint256 indexed betId,
        string condition,
        string[] outcomes,
        uint256[] bettingAmounts,
        uint256 startTime /*, uint256 endTime*/
    );
    event BetPlaced(
        uint256 indexed betId,
        address indexed bettor,
        uint256 outcomeIndex,
        uint256 bettingAmount
    );
    event BetWithdrawn(uint256 indexed betId, address indexed bettor);
    event BetPaused(uint256 indexed betId);
    event BetPaid(uint256 indexed betId);

    //║══════════════════════════════════════════╗
    //║             Storage                      ║
    //║══════════════════════════════════════════╝
    // Mapping of betId to Bet. betId is incremented for each new bet
    mapping(uint256 => Bet) public bets;
    // Mapping of bettor to betId to outcomeIndex
    mapping(address => mapping(uint256 => uint256)) public playersBet;
    // Mapping of betId to outcomeIndex to players
    mapping(uint256 => mapping(uint256 => address[])) public outcomeForPlayers;
    // track if player has already placed a bet
    mapping(address => mapping(uint256 => bool)) public playerHasBet;

    mapping(uint256 => string[]) public outcomesBet;
    mapping(uint256 => uint256[]) public bettingAmountsBet;

    // default betting token address
    address public bettingTokenAddress;
    // betId
    uint256 public betId;
    // max number of users placing a bet on the same outcome index
    uint256 MAX_PLAYERS_FOR_OUTCOME_LENGTH = 10;
    // OZ SafeERC20
    using SafeERC20 for IERC20;

    // Constructor
    constructor(address _bettingTokenAddress) {
        betId = 0;
        bettingTokenAddress = _bettingTokenAddress;
    }

    //║══════════════════════════════════════════╗
    //║    Users Functions                       ║
    //║══════════════════════════════════════════╝
    // Create a new bet
    function createBet(
        address admin,
        string memory condition,
        string[] memory outcomes,
        uint256[] memory bettingAmounts,
        //uint256 endTime,
        uint256 adminOutcome // admin can bet on an outcome
    ) public returns (uint256) {
        // validate parameters
        require(admin != address(0), "Invalid admin address");
        require(
            outcomes.length == bettingAmounts.length,
            "Outcomes and betting amounts length mismatch"
        );
        require(outcomes.length > 1, "At least 2 outcomes required");
        //require(endTime > block.timestamp, "End time must be in the future");
        require(adminOutcome < outcomes.length, "Invalid admin outcome");
        // calculate startTime
        //uint256 start = block.timestamp;
        // bet Id is current id + 1
        betId++;
        // create a new bet
        bets[betId] = Bet({
            admin: admin,
            condition: condition,
            outcomeIndex: 0,
            totalBettingAmount: 0,
            //startTime: block.timestamp,
            //endTime: endTime,
            status: BetStatus.CREATED
        });
        // store outcomes and betting amounts
        outcomesBet[betId] = outcomes;
        bettingAmountsBet[betId] = bettingAmounts;
        // check if the admin wants to bet on an outcome
        if (adminOutcome != 0) {
            placeBet(betId, (adminOutcome - 1));
        }
        emit BetCreated(
            admin,
            betId,
            condition,
            outcomes,
            bettingAmounts,
            block.timestamp /*, endTime*/
        );
        return betId;
    }

    // Place a bet
    function placeBet(uint256 id, uint256 outcomeIndex) public {
        Bet storage bet = bets[id];
        require(bet.status == BetStatus.CREATED, "Bet is already resolved");
        //require(bet.endTime > block.timestamp, "Bet has ended");
        require(outcomeIndex < outcomesBet[id].length, "Invalid outcomeIndex");
        require(
            playerHasBet[msg.sender][id] == false,
            "Player has already placed a bet"
        );
        require(
            outcomeForPlayers[id][outcomeIndex].length <
                MAX_PLAYERS_FOR_OUTCOME_LENGTH,
            "Max players reached"
        );
        // if betting token is ERC20, check for token transfer
        IERC20 token = IERC20(bettingTokenAddress);
        token.safeTransferFrom(
            msg.sender,
            address(this),
            bettingAmountsBet[id][outcomeIndex]
        );
        bet.totalBettingAmount += bettingAmountsBet[id][outcomeIndex];
        // update player bet
        playersBet[msg.sender][id] = outcomeIndex;
        outcomeForPlayers[id][outcomeIndex].push(msg.sender);
        playerHasBet[msg.sender][id] = true;
        emit BetPlaced(
            id,
            msg.sender,
            outcomeIndex,
            bettingAmountsBet[id][outcomeIndex]
        );
    }

    // Admin withdraw a paused bet
    function adminWithdrawPausedBet(uint256 id) public {
        Bet storage bet = bets[id];
        require(bet.status == BetStatus.CREATED, "Bet is already resolved");
        require(
            msg.sender == bet.admin,
            "Only admin can distribute paused bet"
        );
        uint256 outcomesLength = outcomesBet[id].length;
        IERC20 token = IERC20(bettingTokenAddress);
        // distribute the amounts to players
        for (uint256 i = 0; i < outcomesLength; i++) {
            address[] memory players = outcomeForPlayers[id][i];
            for (uint256 j = 0; j < players.length; j++) {
                token.safeTransfer(players[j], bettingAmountsBet[id][i]);
            }
        }
        bet.status = BetStatus.PAUSED;
        emit BetPaused(id);
    }

    // Resolve a bet
    function resolveBet(
        uint256 id,
        uint256 outcomeIndex,
        bool distribute
    ) public {
        Bet storage bet = bets[id];
        require(bet.status == BetStatus.CREATED, "Bet is already resolved");
        require(msg.sender == bet.admin, "Only admin can resolve the bet");
        require(outcomeIndex < outcomesBet[id].length, "Invalid outcomeIndex");
        //require(bet.endTime < block.timestamp, "Bet has not ended");
        bet.outcomeIndex = outcomeIndex;
        bet.status = BetStatus.RESOLVED;
        if (distribute) {
            _distributeWinnings(bet, id);
            bet.status = BetStatus.PAID;
        }
    }

    function distributeWinnings(uint256 id) public {
        Bet storage bet = bets[id];
        require(bet.status == BetStatus.RESOLVED, "Bet is not resolved");
        _distributeWinnings(bet, id);
        bet.status = BetStatus.PAID;
    }

    //║══════════════════════════════════════════╗
    //║    View Functions                        ║
    //║══════════════════════════════════════════╝
    function outcomeForPlayer(
        uint256 id,
        uint256 outcomeIndex
    ) public view returns (address[] memory) {
        return outcomeForPlayers[id][outcomeIndex];
    }

    function playerBet(
        address bettor,
        uint256 id
    ) public view returns (uint256) {
        return playersBet[bettor][id];
    }

    function betInfo(
        uint256 id
    ) public view returns (Bet memory, string[] memory, uint256[] memory) {
        string[] memory outcomes = outcomesBet[id];
        uint256[] memory bettingAmounts = bettingAmountsBet[id];
        return (bets[id], outcomes, bettingAmounts);
    }

    //║══════════════════════════════════════════╗
    //║    Internal Functions                    ║
    //║══════════════════════════════════════════╝
    function _distributeWinnings(Bet memory bet, uint256 id) internal {
        // distribute the winnings to winners
        address[] memory winners = outcomeForPlayers[id][bet.outcomeIndex];
        IERC20 token = IERC20(bettingTokenAddress);
        // if no winners, return
        if (winners.length == 0) {
            uint256 outcomesLength = outcomesBet[id].length;
            for (uint256 i = 0; i < outcomesLength; i++) {
                address[] memory players = outcomeForPlayers[id][i];
                for (uint256 j = 0; j < players.length; j++) {
                    token.safeTransfer(players[j], bettingAmountsBet[id][i]);
                }
            }
            return;
        }
        if (winners.length == 1) {
            token.safeTransfer(winners[0], bet.totalBettingAmount);
        } else {
            uint256 winAmount = bet.totalBettingAmount / winners.length;
            for (uint256 i = 0; i <= winners.length - 2; i++) {
                token.safeTransfer(winners[i], winAmount);
            }
            uint256 remainingAmount = bet.totalBettingAmount -
                (winAmount * (winners.length - 1));
            token.safeTransfer(winners[winners.length - 1], remainingAmount);
        }

        emit BetPaid(id);
    }
}
