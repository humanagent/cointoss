// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract CoinToss {

    enum TossStatus {
        CREATED,
        PAID,
        PAUSED,
        RESOLVED
    }

    struct Toss {
        address admin;
        string condition;
        uint256 outcomeIndex;
        uint256 totalTossingAmount;
        TossStatus status;
    }

    //║══════════════════════════════════════════╗
    //║              Events                      ║
    //║══════════════════════════════════════════╝
    event TossCreated(address admin, uint256 indexed tossId, string condition, string[] outcomes, uint256[] tossingAmounts, uint256 startTime/*, uint256 endTime*/);
    event TossPlaced(uint256 indexed tossId, address indexed player, uint256 outcomeIndex, uint256 tossingAmount);
    event TossWithdrawn(uint256 indexed tossId, address indexed player);
    event TossPaused(uint256 indexed tossId);
    event TossPaid(uint256 indexed tossId);

    //║══════════════════════════════════════════╗
    //║             Storage                      ║
    //║══════════════════════════════════════════╝
    mapping(uint256 => Toss) public tosses;
    mapping(address => mapping(uint256 => uint256)) public playersToss;
    mapping(uint256 => mapping(uint256 => address[])) public outcomeForPlayers;
    mapping(address => mapping(uint256 => bool)) public playerHasTossed;
    
    mapping(uint256 => string[]) public outcomesToss;
    mapping(uint256 => uint256[]) public tossingAmountsToss;

    address public tossingTokenAddress;
    uint256 public tossId;
    uint256 MAX_PLAYERS_FOR_OUTCOME_LENGTH = 10;

    using SafeERC20 for IERC20;

    // Constructor
    /**
     * @dev Initializes the contract with the default tossing token address.
     * @param _tossingTokenAddress The address of the ERC20 token to be used for tossing.
     */
    constructor(address _tossingTokenAddress) {
        tossId = 0;
        tossingTokenAddress = _tossingTokenAddress;
    }

    //║══════════════════════════════════════════╗
    //║    View Functions                        ║
    //║══════════════════════════════════════════╝

    /**
     * @dev Returns the list of players who have tossed on a specific outcome for a given toss ID.
     * @param id The ID of the toss.
     * @param outcomeIndex The index of the outcome.
     * @return An array of player addresses who tossed on the given outcome.
     */
    function outcomeForPlayer(
        uint256 id,
        uint256 outcomeIndex
    ) public view returns (address[] memory) {
        return outcomeForPlayers[id][outcomeIndex];
    }

    /**
     * @dev Returns the outcome index a player has tossed on for a specific toss ID.
     * @param player The address of the player.
     * @param id The ID of the toss.
     * @return The outcome index the player has tossed on.
     */
    function playerToss(
        address player,
        uint256 id
    ) public view returns (uint256) {
        return playersToss[player][id];
    }

    /**
     * @dev Retrieves the information about a specific toss.
     * @param id The ID of the toss.
     * @return Toss structure, outcomes, and tossing amounts.
     */
    function tossInfo(
        uint256 id
    ) public view returns (Toss memory, string[] memory, uint256[] memory) {
        string[] memory outcomes = outcomesToss[id];
        uint256[] memory tossingAmounts = tossingAmountsToss[id];
        return (tosses[id], outcomes, tossingAmounts);
    }

    //║══════════════════════════════════════════╗
    //║    Users Functions                       ║
    //║══════════════════════════════════════════╝

    /**
     * @dev Creates a new toss with the specified parameters.
     * @param admin The address of the toss admin.
     * @param condition The condition or description of the toss.
     * @param outcomes The possible outcomes of the toss.
     * @param tossingAmounts The amounts required to toss on each outcome.
     * @param adminOutcome The index of the outcome the admin wants to toss on (optional).
     * @return The ID of the created toss.
     */
    function createToss(
        address admin,
        string memory condition,
        string[] memory outcomes,
        uint256[] memory tossingAmounts,
        uint256 adminOutcome
    ) public returns (uint256) {
        // validate parameters
        require(admin != address(0), "Invalid admin address");
        require(outcomes.length == tossingAmounts.length, "Outcomes and tossing amounts length mismatch");
        require(outcomes.length > 1, "At least 2 outcomes required");
        require(adminOutcome < outcomes.length, "Invalid admin outcome");
        
        tossId++; // increment toss ID

        tosses[tossId] = Toss({
            admin: admin,
            condition: condition,
            outcomeIndex: 0,
            totalTossingAmount: 0,
            status: TossStatus.CREATED
        });

        outcomesToss[tossId] = outcomes;
        tossingAmountsToss[tossId] = tossingAmounts;

        if (adminOutcome != 0) {
            placeToss(tossId, (adminOutcome - 1));
        }

        emit TossCreated(admin, tossId, condition, outcomes, tossingAmounts, block.timestamp);
        return tossId;
    }

    /**
     * @dev Allows the admin to change the toss metadata.
     * @param id The ID of the toss.
     * @param condition The updated condition or description of the toss.
     * @param outcomes The updated possible outcomes of the toss.
     */
    function changeTossMetadata(
        uint256 id,
        string memory condition,
        string[] memory outcomes
    ) public {
        Toss storage toss = tosses[id];
        require(msg.sender == toss.admin, "Only admin can change toss metadata");
        toss.condition = condition;
        outcomesToss[id] = outcomes;
    }

    /**
     * @dev Allows a player to place a toss on a specific outcome.
     * @param id The ID of the toss.
     * @param outcomeIndex The index of the outcome the player wants to toss on.
     */
    function placeToss(
        uint256 id, 
        uint256 outcomeIndex
    ) public {
        Toss storage toss = tosses[id];
        require(toss.status == TossStatus.CREATED, "Toss is already resolved");
        require(outcomeIndex < outcomesToss[id].length, "Invalid outcomeIndex");
        require(playerHasTossed[msg.sender][id] == false, "Player has already placed a toss"); 
        require(outcomeForPlayers[id][outcomeIndex].length < MAX_PLAYERS_FOR_OUTCOME_LENGTH, "Max players reached");
        
        IERC20 token = IERC20(tossingTokenAddress);
        token.safeTransferFrom(msg.sender, address(this), tossingAmountsToss[id][outcomeIndex]); 
        toss.totalTossingAmount += tossingAmountsToss[id][outcomeIndex];

        playersToss[msg.sender][id] = outcomeIndex;
        outcomeForPlayers[id][outcomeIndex].push(msg.sender);
        playerHasTossed[msg.sender][id] = true;
        
        emit TossPlaced(id, msg.sender, outcomeIndex, tossingAmountsToss[id][outcomeIndex]);
    }

    /**
     * @dev Allows the admin to withdraw from a paused toss and return the tossing amounts to players.
     * @param id The ID of the toss to withdraw.
     */
    function adminWithdrawPausedToss(
        uint256 id
    ) public {
        Toss storage toss = tosses[id];
        require(toss.status == TossStatus.CREATED, "Toss is already resolved"); 
        require(msg.sender == toss.admin, "Only admin can distribute paused toss");

        uint256 outcomesLength = outcomesToss[id].length;
        IERC20 token = IERC20(tossingTokenAddress);
        
        for (uint256 i = 0; i < outcomesLength; i++) {
            address[] memory players = outcomeForPlayers[id][i];
            for (uint256 j = 0; j < players.length; j++) {
                token.safeTransfer(players[j], tossingAmountsToss[id][i]);
            }
        }

        toss.status = TossStatus.PAUSED;
        emit TossPaused(id);
    }

    /**
     * @dev Resolves a toss by selecting the winning outcome and optionally distributing winnings.
     * @param id The ID of the toss.
     * @param outcomeIndex The index of the winning outcome.
     * @param distribute If true, the winnings are immediately distributed.
     */
    function resolveToss(
        uint256 id,
        uint256 outcomeIndex,
        bool distribute
    ) public {
        Toss storage toss = tosses[id];
        require(toss.status == TossStatus.CREATED, "Toss is already resolved");
        require(msg.sender == toss.admin, "Only admin can resolve the toss");
        require(outcomeIndex < outcomesToss[id].length, "Invalid outcomeIndex");
        
        uint256 tossingAmount = tossingAmountsToss[id][outcomeIndex];
        toss.outcomeIndex = outcomeIndex;
        toss.status = TossStatus.RESOLVED;

        if (distribute && tossingAmount > 0) {
            _distributeWinnings(toss, id);
            toss.status = TossStatus.PAID;
        }

        if (tossingAmount == 0) {
            toss.status = TossStatus.PAID;
        }
    }

    /**
     * @dev Allows manual distribution of winnings after the toss has been resolved.
     * @param id The ID of the toss.
     */
    function distributeWinnings(
        uint256 id
    ) public {
        Toss storage toss = tosses[id];
        require(toss.status == TossStatus.RESOLVED, "Toss is not resolved"); 
        _distributeWinnings(toss, id);
        toss.status = TossStatus.PAID;
    }

    //║══════════════════════════════════════════╗
    //║    Internal Functions                    ║
    //║══════════════════════════════════════════╝

    /**
     * @dev Distributes winnings to the players who chose the correct outcome.
     * If there are no winners, all players are refunded.
     * @param toss The toss data structure.
     * @param id The ID of the toss.
     */
    function _distributeWinnings(
        Toss memory toss, uint256 id
    ) internal {
        address[] memory winners = outcomeForPlayers[id][toss.outcomeIndex];
        IERC20 token = IERC20(tossingTokenAddress);
        
        if (winners.length == 0) {
            uint256 outcomesLength = outcomesToss[id].length;
            for (uint256 i = 0; i < outcomesLength; i++) {
                address[] memory players = outcomeForPlayers[id][i];
                for (uint256 j = 0; j < players.length; j++) {
                    token.safeTransfer(players[j], tossingAmountsToss[id][i]);
                }
            }
            return;
        }

        if (winners.length == 1) {
            token.safeTransfer(winners[0], toss.totalTossingAmount);
        } else {
            uint256 winAmount = toss.totalTossingAmount / winners.length;
            for (uint256 i = 0; i <= winners.length-2; i++) {
                token.safeTransfer(winners[i], winAmount);
            }
            uint256 remainingAmount = toss.totalTossingAmount - (winAmount * (winners.length - 1));            
            token.safeTransfer(winners[winners.length - 1], remainingAmount);
        }

        emit TossPaid(id);
    }
}
