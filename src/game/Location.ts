export interface LocationUnlockRequirement {
    type: "mainQuest";
    questId: string;
}

export interface LocationDefinition {
    id: string;
    name: string;
    mapKey: string;
    unlockRequirement?: LocationUnlockRequirement;
}

export const LOCATIONS: LocationDefinition[] = [
    {
        id: "campus",
        name: "Khuôn viên HANU",
        mapKey: "campus",
    },

    {
        id: "nha-c",
        name: "Nhà C",
        mapKey: "nha-c",
        unlockRequirement: {
            type: "mainQuest",
            questId: "MQ_001",
        },
    },

    {
        id: "library",
        name: "Thư viện",
        mapKey: "library",
        unlockRequirement: {
            type: "mainQuest",
            questId: "MQ_005",
        },
    },

    {
        id: "nha-a1",
        name: "Nhà A1",
        mapKey: "nha-a1",
        unlockRequirement: {
            type: "mainQuest",
            questId: "MQ_010",
        },
    },

    {
        id: "nha-e",
        name: "Nhà E",
        mapKey: "nha-e",
        unlockRequirement: {
            type: "mainQuest",
            questId: "MQ_015",
        },
    },

    {
        id: "stadium",
        name: "Sân vận động",
        mapKey: "stadium",
        unlockRequirement: {
            type: "mainQuest",
            questId: "MQ_020",
        },
    },
];
