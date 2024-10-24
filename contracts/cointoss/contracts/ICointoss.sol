// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ICointoss {

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
    error PlayerDidNotToss();
    error MaxPlayersReached();
    error OnlyAdmin();
    error TossNotResolved();
    error TossNotEnded();
    error TossNotPaused();
    
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

    //║══════════════════════════════════════════╗
    //║              Enums                       ║
    //║══════════════════════════════════════════╝

    // Enumeration to represent the status of a toss
    enum TossStatus {
        CREATED,   // Toss has been created but is ongoing
        PAID,      // Winnings have been paid out
        PAUSED,    // Toss has been paused
        RESOLVED   // Toss has been resolved, but winnings not yet paid
    }

    //║══════════════════════════════════════════╗
    //║              Structs                     ║
    //║══════════════════════════════════════════╝

    // Structure to represent a toss
    struct Toss {
        address admin;                 // Address of the toss creator/admin
        string condition;              // Description or condition of the toss
        uint256 outcomeIndex;          // Index of the winning outcome
        uint256 totalTossingAmount;    // Total amount toss on this toss
        uint256 endTime;               // End time for the toss
        TossStatus status;             // Current status of the toss
    }
}