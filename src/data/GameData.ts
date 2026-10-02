/**
 * MAIN QUEST DATA — FIT HANU: 20 Năm Lập Trình Tương Lai
 *
 * Phase A19 — Main Quest Progression
 *
 * Hành trình của sinh viên FIT HANU từ ngày đầu nhập học đến tốt nghiệp.
 * Text/description để trống — điền sau.
 * Prerequisite chain: q_main_01 → q_main_02 → ... → q_main_06
 */

import type { QuestData } from "../systems/QuestTypes";
import type { AcademicChallengeData } from "../systems/AcademicChallenge";

export const MAIN_QUESTS: QuestData[] = [
    // ========================================================
    // Chương 1: Ngày Đầu Nhập Học
    // ========================================================
    {
        id: "q_main_01",
        type: "main",
        title: "", // TODO: "Bước chân vào FIT"
        description: "", // TODO: Mô tả hành trình đầu tiên của SV
        objectives: [
            {
                id: "obj_01_01",
                description: "", // TODO: "Gặp giảng viên hướng dẫn"
                type: "talk_to_npc",
                targetId: "", // TODO: "npc_giang_vien_01"
                required: 1,
                current: 0,
            },
            {
                id: "obj_01_02",
                description: "", // TODO: "Khám phá khu học xá"
                type: "reach_location",
                targetId: "", // TODO: "location_classroom_a"
                required: 1,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO: "memory_founding_01"
            { type: "unlock_quest", value: "q_main_02" },
        ],
        prerequisites: [],
        giverNpcId: "", // TODO: "npc_giang_vien_01"
    },

    // ========================================================
    // Chương 2: Thử Thách Lập Trình Đầu Tiên
    // ========================================================
    {
        id: "q_main_02",
        type: "main",
        title: "", // TODO: "Hello, World!"
        description: "", // TODO
        objectives: [
            {
                id: "obj_02_01",
                description: "", // TODO: "Hoàn thành bài tập lập trình"
                type: "complete_minigame",
                targetId: "", // TODO: "minigame_typing_01"
                required: 1,
                current: 0,
            },
            {
                id: "obj_02_02",
                description: "", // TODO: "Tìm tài liệu cũ trong thư viện"
                type: "collect_item",
                targetId: "", // TODO: "item_old_textbook"
                required: 1,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO: "memory_milestone_01"
            { type: "unlock_location", value: "" }, // TODO: "location_lab_01"
            { type: "unlock_quest", value: "q_main_03" },
        ],
        prerequisites: ["q_main_01"],
        giverNpcId: "", // TODO
    },

    // ========================================================
    // Chương 3: Bí Ẩn Của FIT
    // ========================================================
    {
        id: "q_main_03",
        type: "main",
        title: "", // TODO: "20 Năm Lịch Sử"
        description: "", // TODO
        objectives: [
            {
                id: "obj_03_01",
                description: "", // TODO: "Thu thập 5 mảnh ký ức"
                type: "collect_item",
                targetId: "", // TODO: "memory_fragment"
                required: 5,
                current: 0,
            },
            {
                id: "obj_03_02",
                description: "", // TODO: "Gặp cựu sinh viên huyền thoại"
                type: "talk_to_npc",
                targetId: "", // TODO: "npc_alumni_01"
                required: 1,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO
            { type: "unlock_quest", value: "q_main_04" },
        ],
        prerequisites: ["q_main_02"],
        giverNpcId: "",
    },

    // ========================================================
    // Chương 4: Chiến Đấu Với Bug
    // ========================================================
    {
        id: "q_main_04",
        type: "main",
        title: "", // TODO: "Debug Đại Chiến"
        description: "", // TODO
        objectives: [
            {
                id: "obj_04_01",
                description: "", // TODO: "Đánh bại Bug Boss"
                type: "defeat_enemy",
                targetId: "", // TODO: "boss_bug_01"
                required: 1,
                current: 0,
            },
            {
                id: "obj_04_02",
                description: "", // TODO: "Hoàn thành minigame Debug"
                type: "complete_minigame",
                targetId: "", // TODO: "minigame_debug_01"
                required: 1,
                current: 0,
            },
        ],
        rewards: [
            { type: "item", value: "" }, // TODO: "item_debugger_badge"
            { type: "memory", value: "" }, // TODO
            { type: "unlock_quest", value: "q_main_05" },
        ],
        prerequisites: ["q_main_03"],
        giverNpcId: "",
    },

    // ========================================================
    // Chương 5: Hội Thảo Khoa Học
    // ========================================================
    {
        id: "q_main_05",
        type: "main",
        title: "", // TODO: "Công Trình Nghiên Cứu"
        description: "", // TODO
        objectives: [
            {
                id: "obj_05_01",
                description: "", // TODO: "Tham dự hội thảo"
                type: "reach_location",
                targetId: "", // TODO: "location_conference_hall"
                required: 1,
                current: 0,
            },
            {
                id: "obj_05_02",
                description: "", // TODO: "Trình bày nghiên cứu"
                type: "complete_minigame",
                targetId: "", // TODO: "minigame_presentation_01"
                required: 1,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO
            { type: "unlock_quest", value: "q_main_06" },
        ],
        prerequisites: ["q_main_04"],
        giverNpcId: "",
    },

    // ========================================================
    // Chương 6 (Final): Tốt Nghiệp và Tương Lai
    // ========================================================
    {
        id: "q_main_06",
        type: "main",
        title: "", // TODO: "Lập Trình Tương Lai"
        description: "", // TODO
        objectives: [
            {
                id: "obj_06_01",
                description: "", // TODO: "Đánh bại Final Boss"
                type: "defeat_enemy",
                targetId: "", // TODO: "boss_final_01"
                required: 1,
                current: 0,
            },
            {
                id: "obj_06_02",
                description: "", // TODO: "Hoàn thành mảnh ký ức cuối"
                type: "collect_item",
                targetId: "", // TODO: "memory_fragment_final"
                required: 1,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO: "memory_graduation"
        ],
        prerequisites: ["q_main_05"],
        giverNpcId: "",
    },
];

// ============================================================
// SIDE QUEST DATA (Phase A20 — Sample Side Quests)
// ============================================================

export const SIDE_QUESTS: QuestData[] = [
    // ---- Side quest: Library Explorer ----
    {
        id: "q_side_library",
        type: "side",
        title: "", // TODO: "Thủ Thư Bí Ẩn"
        description: "", // TODO
        objectives: [
            {
                id: "obj_lib_01",
                description: "", // TODO: "Tìm 3 cuốn sách cũ"
                type: "collect_item",
                targetId: "", // TODO: "item_old_book"
                required: 3,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO: "memory_campus_library"
            { type: "item", value: "" }, // TODO: "item_bookmark"
        ],
        prerequisites: [],
        giverNpcId: "", // TODO: "npc_librarian"
        turnInNpcId: "", // TODO: "npc_librarian"
    },

    // ---- Side quest: Club Activities ----
    {
        id: "q_side_club",
        type: "side",
        title: "", // TODO: "CLB Lập Trình"
        description: "", // TODO
        objectives: [
            {
                id: "obj_club_01",
                description: "", // TODO: "Tham gia CLB"
                type: "talk_to_npc",
                targetId: "", // TODO: "npc_club_leader"
                required: 1,
                current: 0,
            },
            {
                id: "obj_club_02",
                description: "", // TODO: "Hoàn thành bài contest"
                type: "complete_minigame",
                targetId: "", // TODO: "minigame_contest_01"
                required: 1,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO: "memory_culture_club"
        ],
        prerequisites: ["q_main_01"],
        giverNpcId: "",
    },

    // ---- Side quest: Alumni Stories ----
    {
        id: "q_side_alumni",
        type: "side",
        title: "", // TODO: "Câu Chuyện Cựu Sinh Viên"
        description: "", // TODO
        objectives: [
            {
                id: "obj_alumni_01",
                description: "", // TODO: "Gặp 3 cựu sinh viên"
                type: "talk_to_npc",
                targetId: "", // TODO: — sẽ track qua 3 NPC riêng
                required: 3,
                current: 0,
            },
        ],
        rewards: [
            { type: "memory", value: "" }, // TODO: "memory_achievement_alumni"
        ],
        prerequisites: [],
        giverNpcId: "",
    },
];

// ============================================================
// LOCATION DATA (Phase A14)
// ============================================================

import type { LocationData } from "../systems/WorldManager";

export const LOCATIONS: LocationData[] = [
    {
        id: "location_main_hall",
        name: "", // TODO: "Sảnh chính FIT"
        description: "", // TODO
        sceneKey: "", // TODO: "SceneMainHall"
        connectedFrom: [],
        mapX: 400,
        mapY: 300,
    },
    {
        id: "location_classroom_a",
        name: "", // TODO: "Phòng học A"
        description: "", // TODO
        sceneKey: "", // TODO: "SceneClassroomA"
        connectedFrom: ["location_main_hall"],
        mapX: 600,
        mapY: 200,
        unlockQuestId: "",
    },
    {
        id: "location_lab_01",
        name: "", // TODO: "Phòng Lab"
        description: "", // TODO
        sceneKey: "", // TODO: "SceneLab"
        connectedFrom: ["location_classroom_a"],
        mapX: 700,
        mapY: 250,
        unlockQuestId: "q_main_02",
    },
    {
        id: "location_library",
        name: "", // TODO: "Thư viện FIT"
        description: "", // TODO
        sceneKey: "", // TODO: "SceneLibrary"
        connectedFrom: ["location_main_hall"],
        mapX: 200,
        mapY: 200,
    },
    {
        id: "location_conference_hall",
        name: "", // TODO: "Hội trường FIT"
        description: "", // TODO
        sceneKey: "", // TODO: "SceneConference"
        connectedFrom: ["location_main_hall"],
        mapX: 400,
        mapY: 100,
        unlockQuestId: "q_main_04",
    },
];

// ============================================================
// MEMORY DATA (Phase A16)
// ============================================================

import type { MemoryData } from "../systems/MemoryManager";

export const MEMORIES: MemoryData[] = [
    // Founding category
    {
        id: "memory_founding_01",
        title: "", // TODO: "Ngày Thành Lập FIT"
        description: "", // TODO
        year: 2004, // TODO: Adjust to actual year
        category: "founding",
        hint: "", // TODO: "Hỏi giảng viên lâu năm nhất"
        sourceId: "",
    },
    {
        id: "memory_founding_02",
        title: "", // TODO: "Những Giảng Viên Đầu Tiên"
        description: "", // TODO
        year: 2004,
        category: "founding",
        hint: "",
        sourceId: "",
    },

    // Milestone category
    {
        id: "memory_milestone_01",
        title: "", // TODO: "Khóa Sinh Viên Đầu Tiên"
        description: "", // TODO
        year: 2004,
        category: "milestone",
        hint: "",
        questId: "q_main_02",
    },
    {
        id: "memory_milestone_02",
        title: "", // TODO: "10 Năm Phát Triển"
        description: "", // TODO
        year: 2014,
        category: "milestone",
        hint: "",
    },
    {
        id: "memory_milestone_03",
        title: "", // TODO: "20 Năm — Lập Trình Tương Lai"
        description: "", // TODO
        year: 2024,
        category: "milestone",
        hint: "",
        questId: "q_main_06",
    },

    // Achievement category
    {
        id: "memory_achievement_alumni",
        title: "", // TODO
        description: "", // TODO
        category: "achievement",
        hint: "",
        questId: "q_side_alumni",
    },

    // Campus category
    {
        id: "memory_campus_library",
        title: "", // TODO
        description: "", // TODO
        category: "campus",
        hint: "",
        questId: "q_side_library",
    },

    // Culture category
    {
        id: "memory_culture_club",
        title: "", // TODO
        description: "", // TODO
        category: "culture",
        hint: "",
        questId: "q_side_club",
    },

    // Graduation (end-game)
    {
        id: "memory_graduation",
        title: "", // TODO: "Lễ Tốt Nghiệp"
        description: "", // TODO
        category: "milestone",
        hint: "",
        questId: "q_main_06",
    },
];

// ============================================================
// Phase A21 — Academic Challenges Data
// ============================================================

export const ACADEMIC_CHALLENGES: AcademicChallengeData[] = [
    {
        id: "challenge_programming",
        title: "", // TODO: "Thi kết thúc học phần: Lập trình Cơ bản"
        subject: "", // TODO: "Nhập môn Lập trình & C"
        description: "", // TODO
        bossId: "boss_programming",
        locationId: "location_nha_c",
        requiredQuestId: "q_main_02",
        rewardMemoryIds: ["memory_milestone_01"],
        unlockQuestId: "q_main_03",
        unlockLocationId: "location_library",
    },
    {
        id: "challenge_dsa",
        title: "", // TODO: "Thử thách: Cấu trúc Dữ liệu & Giải thuật"
        subject: "", // TODO: "DSA"
        description: "", // TODO
        bossId: "boss_dsa",
        locationId: "location_library",
        requiredQuestId: "q_main_03",
        rewardMemoryIds: ["memory_campus_library"],
        unlockQuestId: "q_main_04",
        unlockLocationId: "location_nha_a1",
    },
    {
        id: "challenge_thesis_defense",
        title: "", // TODO: "Bảo vệ Khóa Luận Tốt Nghiệp"
        subject: "", // TODO: "Đồ án Tốt nghiệp FIT HANU"
        description: "", // TODO
        bossId: "boss_thesis",
        locationId: "location_hoi_truong",
        requiredQuestId: "q_main_06",
        rewardMemoryIds: ["memory_graduation", "memory_milestone_03"],
        unlockLocationId: "location_hoi_truong",
    },
];

