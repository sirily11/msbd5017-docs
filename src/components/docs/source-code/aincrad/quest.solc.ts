import { Checker } from '@/lib/interfaces'

export const source = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract QuestSystem {
    struct Quest {
        string description;
        uint reward;
        bool completed;
        bool verified;
        address completer;
    }

    // maps the address of the creator to the quest
    mapping(address => Quest) private quests;
    // maps the address of the taker to the quest id
    mapping(address => uint256) private questTaken;
    // maps the quest id to the quest
    mapping(uint256 => Quest) private questList;
    // maps the quest id to the creator
    mapping(uint256 => address) private questCreators;
    // maps creator to quest id in order to check if the creator has a quest
    mapping(address => uint256) private creatorQuest;
    uint256 id = 1;

    /**
     * Each quest created should also pay the same amount of ether as the reward
     * @param quest The quest to be created
     */
    function createQuest(Quest memory quest) public payable {
       
    }

    function takeQuest(uint questId) public {
      
    }

    function completeQuest() public {
       
    }

    function verifyComplete() public {
       
    }
}
`

export const solution = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract QuestSystem {
    struct Quest {
        string description;
        uint reward;
        bool completed;
        bool verified;
        address completer;
    }

    event QuestCreated(uint256 id, address indexed creator, Quest quest);
    event QuestTaken(uint256 id, address indexed taker, Quest quest);
    event QuestCompleted(uint256 id, address indexed completer, Quest quest);
    event QuestVerified(
        uint256 id,
        address indexed verifier,
        address indexed completer,
        Quest quest
    );

    // maps the address of the creator to the quest
    mapping(address => Quest) private quests;
    // maps the address of the taker to the quest id
    mapping(address => uint256) private questTaken;
    // maps the quest id to the quest
    mapping(uint256 => Quest) private questList;
    // maps the quest id to the creator
    mapping(uint256 => address) private questCreators;
    // maps creator to quest id in order to check if the creator has a quest
    mapping(address => uint256) private creatorQuest;
    uint256 id = 1;

    /**
     * Each quest created should also pay the same amount of ether as the reward
     * @param quest The quest to be created
     */
    function createQuest(Quest memory quest) public payable {
        require(quest.reward == msg.value, "Reward should be paid");
        require(quest.reward > 0, "Reward should be greater than 0");
        require(
            bytes(quest.description).length > 0,
            "Description should not be empty"
        );
        require(creatorQuest[msg.sender] == 0, "You already have a quest");

        quest.verified = false;
        quest.completer = address(0);

        // Quest created
        // store the quest in the quest list
        questList[id] = quest;
        // store the sender's quest
        quests[msg.sender] = quest;
        questCreators[id] = msg.sender;
        creatorQuest[msg.sender] = id;
        emit QuestCreated(id, msg.sender, quest);
        id++;
    }

    function takeQuest(uint questId) public {
        require(questList[questId].reward > 0, "Quest does not exist");
        require(questTaken[msg.sender] == 0, "You already have a quest");
        require(
            questCreators[questId] != msg.sender,
            "You can't take your own quest"
        );
        require(!questList[questId].completed, "Quest already completed");

        questTaken[msg.sender] = questId;
        emit QuestTaken(questId, msg.sender, questList[questId]);
    }

    function completeQuest() public {
        uint questId = questTaken[msg.sender];
        require(questId > 0, "You don't have a quest");

        Quest storage quest = questList[questId];
        require(quest.reward > 0, "Quest does not exist");
        require(!quest.completed, "Quest already completed");

        // Mark as completed and store completer's address
        quest.completed = true;
        quest.completer = msg.sender;

        // Clear the quest taken status
        questTaken[msg.sender] = 0;

        emit QuestCompleted(questId, msg.sender, quest);
    }

    function verifyComplete() public {
        uint questId = creatorQuest[msg.sender];
        require(questId > 0, "No active quest found");

        Quest storage quest = questList[questId];
        require(quest.reward > 0, "Quest does not exist");
        require(quest.completed, "Quest not completed yet");
        require(!quest.verified, "Quest already verified");
        require(quest.completer != address(0), "No completer found");

        // Mark as verified
        quest.verified = true;

        // Clear creator's quest
        creatorQuest[msg.sender] = 0;

        // Transfer reward to completer
        (bool success, ) = payable(quest.completer).call{value: quest.reward}(
            ""
        );
        require(success, "Transfer failed");

        emit QuestVerified(questId, msg.sender, quest.completer, quest);
    }
}
`

export const checker: Checker = async (solcOutput) => {
  return [false, '']
}
