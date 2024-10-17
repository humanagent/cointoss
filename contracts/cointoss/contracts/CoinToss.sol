// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract CoinToss {

    //║══════════════════════════════════════════╗
    //║              Errors                      ║
    //║══════════════════════════════════════════╝
    error InvalidAdminAddress();
    error InvalidCondition();
    error OutcomesAndAmountsMismatch();
    error AtLeastTwoOutcomesRequired();
    error InvalidAdminOutcome();
    error EndTimeInPast();
    error TossingAmountExceedsMax();
    error TossAlreadyResolved();
    error TossAlreadyEnded();
    error InvalidOutcomeIndex();
    error PlayerAlreadyTossed();
    error MaxPlayersReached();
    error OnlyAdmin();
    error TossNotResolved();
    error TossNotEnded();
    
    //║══════════════════════════════════════════╗
    //║              Events                      ║
    //║══════════════════════════════════════════╝
    event TossCreated(
        address admin,
        uint256 indexed tossId,
        string condition,
        string[] outcomes,
        uint256[] tossingAmounts,
        uint256 startTime
    );
    
    event TossPlaced(
        uint256 indexed tossId,
        address indexed player,
        uint256 outcomeIndex,
        uint256 tossingAmount
    );
    
    event TossWithdrawn(uint256 indexed tossId, address indexed player);
    event TossPaused(uint256 indexed tossId);
    event TossPaid(uint256 indexed tossId);

    // Enumeration to represent the status of a coin toss
    enum TossStatus {
        CREATED,   // Toss has been created but is ongoing
        PAID,      // Winnings have been paid out
        PAUSED,    // Toss has been paused
        RESOLVED   // Toss has been resolved, but winnings not yet paid
    }

    // Structure to represent a toss
    struct Toss {
        address admin;                 // Address of the toss creator/admin
        string condition;              // Description or condition of the toss
        uint256 outcomeIndex;          // Index of the winning outcome
        uint256 totalTossingAmount;    // Total amount bet on this toss
        uint256 endTime;               // End time for the toss
        TossStatus status;             // Current status of the toss
    }

    //║══════════════════════════════════════════╗
    //║             Storage                      ║
    //║══════════════════════════════════════════╝
    mapping(uint256 => Toss) public tosses;  // Mapping of toss ID to Toss struct
    mapping(address => mapping(uint256 => uint256)) public playersToss;  // Mapping of player address to their toss bet
    mapping(uint256 => mapping(uint256 => address[])) public outcomeForPlayers;  // Players associated with each outcome
    mapping(address => mapping(uint256 => bool)) public playerHasTossed;  // Tracks if a player has already bet on a toss

    mapping(uint256 => string[]) public outcomesToss;  // Available outcomes for each toss
    mapping(uint256 => uint256[]) public tossingAmountsToss;  // Corresponding betting amounts for each outcome

    // Address of the ERC20 token used for betting
    address public tossingTokenAddress;
    
    // Counter for the number of tosses created
    uint256 public tossId;

    // Maximum amount that can be bet per outcome
    uint256 maxTossingAmountPerOutcome;
    
    // Maximum number of players allowed per outcome
    uint256 MAX_PLAYERS_FOR_OUTCOME_LENGTH = 10;

    // Using SafeERC20 to handle ERC20 token transfers safely
    using SafeERC20 for IERC20;

    // Constructor
    /**
     * @dev Initializes the contract with the default tossing token address.
     * @param _tossingTokenAddress The address of the ERC20 token to be used for tossing.
     */
    constructor(address _tossingTokenAddress, uint256 _maxTossingAmountPerOutcome) {
        tossId = 0;  // Initialize tossId to 0
        tossingTokenAddress = _tossingTokenAddress;  // Store the address of the ERC20 token used for betting
        maxTossingAmountPerOutcome = _maxTossingAmountPerOutcome;  // Set max betting amount per outcome
    }

    //║══════════════════════════════════════════╗
    //║            View Functions                ║
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
    //║            Users Functions               ║
    //║══════════════════════════════════════════╝

    /**
     * @notice Creates a new toss with the specified parameters
     * @param admin Address of the toss creator
     * @param condition Description of the toss condition
     * @param outcomes Array of possible outcomes
     * @param tossingAmounts Array of corresponding betting amounts for each outcome
     * @param endTime Timestamp when the toss ends
     * @param adminOutcome Index of the outcome the admin bets on, if any (1-indexed)
     * @return The ID of the newly created toss
     */
    function createToss(
        address admin,
        string memory condition,
        string[] memory outcomes,
        uint256[] memory tossingAmounts,
        uint256 endTime,
        uint256 adminOutcome
    ) public returns (uint256) {
        // Validate toss parameters before creating
        _validateTossParameters(admin, condition, outcomes, tossingAmounts, endTime, adminOutcome);
        
        tossId++;  // Increment the toss ID counter
        
        // Store the new toss information in the contract's state
        tosses[tossId] = Toss({
            admin: admin,
            condition: condition,
            outcomeIndex: 0,
            totalTossingAmount: 0,
            endTime: endTime,
            status: TossStatus.CREATED
        });
        
        // Store the outcomes and amounts for this toss
        outcomesToss[tossId] = outcomes;
        tossingAmountsToss[tossId] = tossingAmounts;

        // If the admin has placed a bet, record it
        if (adminOutcome != 0) {
            placeToss(tossId, (adminOutcome - 1));
        }

        // Emit event for toss creation
        emit TossCreated(admin, tossId, condition, outcomes, tossingAmounts, block.timestamp);
        return tossId;
    }

        /**
     * @notice Creates a new toss with the specified parameters using Permit approval. It only works with tokens supporting Permit approval (eg. USDC)
     * @param admin Address of the toss creator
     * @param condition Description of the toss condition
     * @param outcomes Array of possible outcomes
     * @param tossingAmounts Array of corresponding betting amounts for each outcome
     * @param endTime Timestamp when the toss ends
     * @param adminOutcome Index of the outcome the admin bets on, if any (1-indexed)
     * @return The ID of the newly created toss
     * @param v of the signature
     * @param r of the signature
     * @param s of the signature
     * @param permitDeadline - deadline of the signature
     */
    function createTossWithPermit(
        address admin,
        string memory condition,
        string[] memory outcomes,
        uint256[] memory tossingAmounts,
        uint256 endTime,
        uint256 adminOutcome,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 permitDeadline
    ) public returns (uint256) {
        // Validate toss parameters before creating
        _validateTossParameters(admin, condition, outcomes, tossingAmounts, endTime, adminOutcome);
        
        tossId++;  // Increment the toss ID counter
        
        // Store the new toss information in the contract's state
        tosses[tossId] = Toss({
            admin: admin,
            condition: condition,
            outcomeIndex: 0,
            totalTossingAmount: 0,
            endTime: endTime,
            status: TossStatus.CREATED
        });
        
        // Store the outcomes and amounts for this toss
        outcomesToss[tossId] = outcomes;
        tossingAmountsToss[tossId] = tossingAmounts;

        // If the admin has placed a bet, record it
        if (adminOutcome != 0) {
            placeTossWithPermit(tossId, (adminOutcome - 1), v, r, s, permitDeadline);
        }

        // Emit event for toss creation
        emit TossCreated(admin, tossId, condition, outcomes, tossingAmounts, block.timestamp);
        return tossId;
    }

    /**
     * @notice Updates the metadata (condition and outcomes) for a toss
     * @param id The ID of the toss to update
     * @param condition The new condition of the toss
     * @param outcomes The new list of outcomes
     */
    function changeTossMetadata(
        uint256 id,
        string memory condition,
        string[] memory outcomes
    ) public {
        Toss storage toss = tosses[id];
        if (msg.sender != toss.admin) revert OnlyAdmin();  // Only admin can update toss metadata
        toss.condition = condition;  // Update condition
        outcomesToss[id] = outcomes;  // Update outcomes
    }

    /**
     * @notice Place a bet on a specific outcome for a toss
     * @param id The ID of the toss
     * @param outcomeIndex The index of the outcome to bet on
     */
    function placeToss(
        uint256 id, 
        uint256 outcomeIndex
    ) public {
        Toss storage toss = tosses[id];

        // Various validation checks before placing the bet
        if (toss.status != TossStatus.CREATED) revert TossAlreadyResolved();
        if (outcomeIndex >= outcomesToss[id].length) revert InvalidOutcomeIndex();
        if (playerHasTossed[msg.sender][id]) revert PlayerAlreadyTossed();
        if (outcomeForPlayers[id][outcomeIndex].length >= MAX_PLAYERS_FOR_OUTCOME_LENGTH) revert MaxPlayersReached();
        // Adjusted logic to check endTime only if it's set
        if (toss.endTime != 0) {
            if (toss.endTime < block.timestamp) revert TossAlreadyEnded();
        }
        // Get amount from the toss
        uint256 amount = tossingAmountsToss[id][outcomeIndex]; 
        // Transfer the betting amount from the player to the contract
        IERC20 token = IERC20(tossingTokenAddress);
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update toss state with the player's bet
        toss.totalTossingAmount += amount;
        playersToss[msg.sender][id] = outcomeIndex;
        outcomeForPlayers[id][outcomeIndex].push(msg.sender);
        playerHasTossed[msg.sender][id] = true;
        
        emit TossPlaced(id, msg.sender, outcomeIndex, amount);
    }

    /**
     * @notice Place a bet on a specific outcome for a toss. It only works with tokens supporting Permit approval (eg. USDC)
     * @param id The ID of the toss
     * @param outcomeIndex The index of the outcome to bet on
     * @param v of the signature
     * @param r of the signature
     * @param s of the signature
     * @param permitDeadline - deadline of the signature
     */
    function placeTossWithPermit(
        uint256 id, 
        uint256 outcomeIndex,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 permitDeadline
    ) public {
        Toss storage toss = tosses[id];

        // Various validation checks before placing the bet
        if (toss.status != TossStatus.CREATED) revert TossAlreadyResolved();
        if (outcomeIndex >= outcomesToss[id].length) revert InvalidOutcomeIndex();
        if (playerHasTossed[msg.sender][id]) revert PlayerAlreadyTossed();
        if (outcomeForPlayers[id][outcomeIndex].length >= MAX_PLAYERS_FOR_OUTCOME_LENGTH) revert MaxPlayersReached();
        // Adjusted logic to check endTime only if it's set
        if (toss.endTime != 0) {
            if (toss.endTime < block.timestamp) revert TossAlreadyEnded(); 
        }
        // Get amount from the toss
        uint256 amount = tossingAmountsToss[id][outcomeIndex]; 

        // Permit approval
        IERC20Permit(tossingTokenAddress).permit(msg.sender, address(this), amount, permitDeadline, v, r, s);

        // Transfer the betting amount from the player to the contract
        IERC20 token = IERC20(tossingTokenAddress);
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update toss state with the player's bet
        toss.totalTossingAmount += amount;
        playersToss[msg.sender][id] = outcomeIndex;
        outcomeForPlayers[id][outcomeIndex].push(msg.sender);
        playerHasTossed[msg.sender][id] = true;
        
        emit TossPlaced(id, msg.sender, outcomeIndex, amount);
    }

   /**
     * @dev Allows the admin to withdraw from a toss being paused and return the tossing amounts to players.
     * @param id The ID of the toss to withdraw.
     */
    function adminWithdrawPausedToss(
        uint256 id
    ) public {
        Toss storage toss = tosses[id];
        if(toss.status != TossStatus.CREATED) revert TossAlreadyResolved();
        if(msg.sender != toss.admin) revert InvalidAdminAddress();

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
        if(toss.status != TossStatus.CREATED) revert TossAlreadyResolved();
        if(msg.sender != toss.admin) revert InvalidAdminAddress();
        if(outcomeIndex >= outcomesToss[id].length) revert InvalidOutcomeIndex(); 
        // Adjusted logic to check endTime only if it's set
        if (toss.endTime != 0) {
            if (toss.endTime > block.timestamp) revert TossNotEnded(); 
        }
        
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
        if(toss.status != TossStatus.RESOLVED) revert TossNotResolved(); 
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

    /**
     * @notice Validate toss parameters to ensure valid input values before creation
     * @param admin The address of the toss creator
     * @param condition The condition of the toss
     * @param outcomes The list of outcomes
     * @param tossingAmounts The corresponding betting amounts for each outcome
     * @param endTime The end time of the toss
     * @param adminOutcome The index of the outcome the admin bets on, if any (1-indexed)
     */
    function _validateTossParameters(
        address admin,
        string memory condition,
        string[] memory outcomes,
        uint256[] memory tossingAmounts,
        uint256 endTime,
        uint256 adminOutcome
    ) internal view {
        if (admin == address(0)) revert InvalidAdminAddress();
        if (bytes(condition).length == 0) revert InvalidCondition();
        if (outcomes.length != tossingAmounts.length) revert OutcomesAndAmountsMismatch();
        if (outcomes.length < 2) revert AtLeastTwoOutcomesRequired();
        if (adminOutcome > outcomes.length) revert InvalidAdminOutcome();
        if (endTime <= block.timestamp && endTime != 0) revert EndTimeInPast(); //o zero o valido 
        
        // Ensure each betting amount is within the allowed limit
        for (uint256 i = 0; i < tossingAmounts.length; i++) {
            if (tossingAmounts[i] > maxTossingAmountPerOutcome) revert TossingAmountExceedsMax();
        }
    }
}
