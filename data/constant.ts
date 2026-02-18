export interface EventItem {
    title: string;
    description: string;
    image?: string;
    tags: string[];
    cols?: string;
    gradient: string;
    minParticipants: number | null;
    maxParticipants: number | null;
    timeLimit: string | null;
    rules: string[];
    eventType: 'individual' | 'group';
    categoryType: 'on_stage' | 'off_stage' | 'flagship';
    shortCode?: string;
    date?: string;
}


export interface Category {
    title: string;
    items: EventItem[];
}

// --- Firebase Data Structures ---

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
    department?: string;
    semester?: string;
    mobile?: string;
    collegeId?: string; // e.g., CMA/22/CS/033
    house?: string;
    chestNo?: string; // User's unique chest number
    createdAt?: string;
    updatedAt?: string;
    role?: 'user' | 'organizer' | 'admin';
}

export const isProfileComplete = (profile: any): boolean => {
    if (!profile) return false;
    const { name, department, semester, house, mobile, collegeId } = profile;

    // Check for presence and non-empty strings
    const hasValue = (val: string | undefined) => val && val.trim().length > 0;

    if (!hasValue(name)) return false;
    if (!hasValue(department)) return false;
    if (!hasValue(semester)) return false;
    if (!hasValue(house)) return false;
    if (!hasValue(collegeId)) return false;

    // Mobile strict check (must be more than just "+91")
    if (!mobile || !mobile.trim() || mobile.trim() === "+91" || mobile.length < 10) return false;

    return true;
};



export interface TeamMember {
    uid: string; // Firebase Auth UID
    name: string; // Display Name
    email: string;
    role: "leader" | "member"; // Leader created the team
    status: "pending" | "confirmed" | "rejected"; // For invite flow (optional future use)
}

export interface TeamRegistration {
    id?: string; // Firestore Document ID (optional for creation)
    eventId: string; // Event Title (e.g., "MIME")
    eventTitle: string;
    leaderId: string; // UID of the creator
    members: TeamMember[];
    memberIds?: string[]; // Array of member UIDs
    teamName?: string; // Optional team name
    status: "confirmed" | "cancelled";
    teamChestNo?: string; // Team's chest number with event code (e.g., MIME101)
    createdAt: string;
}

export interface SoloRegistration {
    userId: string; // User UID
    events: string[]; // Array of Event Titles user has registered for individually
    teamEvents?: string[]; // Array of Event Titles user has registered for as part of a team (for transactional counts)
    lastUpdated: string;
}

// --- End Data Structures ---

export const categories: Category[] = [
    {
        title: "Flagship Event",
        items: [
            {
                title: "AROHA",
                description: "The heartbeat of Jhalak. A fusion of rhythm, grace, and energy.",
                image: "/dance.png",
                tags: ["Main Stage"],
                cols: "md:col-span-2 md:row-span-2",
                gradient: "from-[#BA170D] to-black",
                minParticipants: null,
                maxParticipants: null,
                timeLimit: null,
                rules: [],
                eventType: 'group',
                categoryType: 'flagship',
                shortCode: 'ARH'
            }
        ]
    },
    {
        title: "On-Stage Events",
        items: [
            {
                title: "MIME",
                description: "Convey a theme through facial expressions, body movements, and gestures without words.",
                tags: ["Group", "Drama", "Non‑verbal"],
                minParticipants: 1,
                maxParticipants: 8,
                timeLimit: "7 minutes",
                rules: [
                    "Screening required",
                    "Only one team per house",
                    "Black and white clothing, white face makeup",
                    "No props, no lyrics or narration, no vocal sounds",
                    "Background instrumental music allowed",
                    "No vulgar, offensive, political or religious content"
                ],
                gradient: "from-gray-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'MI'
            },

            {
                title: "Karaoke Song (Individual)",
                description: "Solo singing performance with karaoke track.",
                tags: ["Solo", "Music", "Karaoke"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "6 minutes",
                rules: [
                    "Any language",
                    "Track on pen drive (participant’s responsibility)",
                    "Maximum 3 participants per house",
                    "No offensive lyrics"
                ],
                gradient: "from-blue-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'KARA'
            },

            {
                title: "Group Song",
                description: "Group singing performance in any language.",
                tags: ["Group", "Music", "Choir"],
                minParticipants: 5,
                maxParticipants: 10,
                timeLimit: "6 minutes",
                rules: [
                    "Any language",
                    "Maximum 2 teams per house",
                    "Be backstage 2 slots before turn"
                ],
                gradient: "from-purple-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'GS'
            },

            {
                title: "Thiruvathira",
                description: "Traditional Kerala dance form performed in a group.",
                tags: ["Group", "Traditional", "Dance"],
                minParticipants: 8,
                maxParticipants: 10,
                timeLimit: "10 minutes",
                rules: [
                    "Track on pen drive (participant’s responsibility)",
                    "Only one team per house",
                    "Screening required",
                    "Be backstage 2 slots before turn"
                ],
                gradient: "from-orange-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'TH'
            },

            {
                title: "Monoact",
                description: "Solo acting performance with a message.",
                tags: ["Solo", "Acting"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes",
                rules: [
                    "No bad language or offensive topics",
                    "Vulgarity leads to disqualification"
                ],
                gradient: "from-yellow-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'MONO'
            },

            {
                title: "Group Dance",
                description: "Group dance performance with choreography.",
                tags: ["Group", "Dance"],
                minParticipants: 2,
                maxParticipants: 15,
                timeLimit: "6–10 minutes",
                rules: [
                    "Track on pen drive (participant’s responsibility)",
                    "Only two teams per house",
                    "Screening required",
                    "Costumes must be decent",
                    "Be backstage 15 minutes before turn"
                ],
                gradient: "from-green-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'GD'
            },

            {
                title: "Step N Synchro",
                description: "Synchronized dance routine for pairs emphasizing uniformity and timing.",
                tags: ["Duo", "Dance", "Synchronized"],
                minParticipants: 2,
                maxParticipants: 2,
                timeLimit: "5 minutes",
                rules: [
                    "Maximum two pairs per house",
                    "Track on pen drive (participant’s responsibility)",
                    "Screening required",
                    "No vulgar/offensive gestures",
                    "No dangerous stunts, fire, water, powder, sharp props",
                    "Be backstage 15 minutes before turn"
                ],
                gradient: "from-teal-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'SNS'
            },

            {
                title: "Nostalgia (Dance)",
                description: "Dance performance representing a specific past era (80s, 90s, early 2000s, folk tradition, vintage cinema).",
                tags: ["Group", "Dance", "Nostalgic"],
                minParticipants: 2,
                maxParticipants: 8,
                timeLimit: "6 minutes",
                rules: [
                    "Songs must be from before 2005",
                    "Costumes must match the nostalgic theme",
                    "Track on pen drive (participant’s responsibility)",
                    "Only two teams per house",
                    "Screening required"
                ],
                gradient: "from-pink-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'NO'
            },

            {
                title: "Instrumental Music Solo",
                description: "Solo performance on any instrument (string, wind, keyboard).",
                tags: ["Solo", "Music", "Instrumental"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "10 minutes",
                rules: [
                    "Maximum 3 participants per house",
                    "Bring own instrument",
                    "Only live instrumental",
                    "Tune before entering stage",
                    "Metronome/click track permitted"
                ],
                gradient: "from-indigo-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'INST'
            },

            {
                title: "Oppana",
                description: "Traditional Muslim wedding dance performed by girls.",
                tags: ["Group", "Traditional", "Dance", "Girls only"],
                minParticipants: 7,
                maxParticipants: 10,
                timeLimit: "8 minutes",
                rules: [
                    "Only girls",
                    "Traditional attire: Kachi, Kuppayam, Thattam; bride in silk and jewelry",
                    "Traditional Oppana songs in Malayalam/Mappila style",
                    "No cinematic steps, western moves, acrobatics",
                    "Screening required",
                    "Only one team per house"
                ],
                gradient: "from-rose-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'OP'
            },

            {
                title: "Fancy Dress",
                description: "Portray a famous personality, mythological figure, or creative concept.",
                tags: ["Solo", "Creative", "Costume"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "2 minutes",
                rules: [
                    "Background music allowed",
                    "No religious deity enactment",
                    "No negative acts (smokers, drunkards)",
                    "No dangerous materials"
                ],
                gradient: "from-cyan-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'FANC'
            },

            {
                title: "Fashion Show",
                description: "Team fashion walk based on a specific theme.",
                tags: ["Group", "Fashion", "Walk"],
                minParticipants: 2,
                maxParticipants: 10,
                timeLimit: "5 minutes",
                rules: [
                    "Each team must have a theme",
                    "Costumes reflect creativity and theme",
                    "Background music allowed",
                    "No vulgarity or offensive gestures",
                    "Only one team per house"
                ],
                gradient: "from-amber-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'FS'
            },

            {
                title: "Recitation",
                description: "Recite a poem by a famous poet or an original piece.",
                tags: ["Solo", "Literary", "Poetry"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes",
                rules: [
                    "Any language, but humor should be understood by general audience",
                    "Content must be appropriate and respectful"
                ],
                gradient: "from-emerald-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'RECI'
            },

            {
                title: "Light Music",
                description: "Solo singing with live accompaniment (one instrument or shruti box).",
                tags: ["Solo", "Music", "Light Music"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes",
                rules: [
                    "One instrument (harmonium/keyboard/guitar) or shruti box allowed",
                    "Songs can be original or popular",
                    "Live event - no backing tracks or karaoke"
                ],
                gradient: "from-sky-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'LIGH'
            },

            {
                title: "Margam Kali",
                description: "Traditional dance form of the Syrian Christians in Kerala.",
                tags: ["Group", "Traditional", "Dance"],
                minParticipants: 7,
                maxParticipants: 12,
                timeLimit: "10 minutes",
                rules: [
                    "Only one team per house",
                    "Screening required",
                    "Traditional attire: Chattayum Mundum and jewelry"
                ],
                gradient: "from-violet-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'MK'
            },

            {
                title: "Solo Dance",
                description: "Individual dance performance in any style.",
                tags: ["Solo", "Dance"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "3-5 minutes",
                rules: [
                    "Track on pen drive (participant’s responsibility)",
                    "Screening required",
                    "No vulgar moves, decent outfits",
                    "Maximum 3 participants per house"
                ],
                gradient: "from-fuchsia-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'SOLO'
            },

            {
                title: "RJ Hunt",
                description: "On-the-spot hosting challenge with a given theme.",
                tags: ["Solo", "Anchoring", "Speaking"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes",
                rules: [
                    "Topics given on the spot",
                    "Content must be appropriate, creative, and encouraging",
                    "No offensive language"
                ],
                gradient: "from-lime-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'RJHT'
            },

            {
                title: "Vattapattu",
                description: "Traditional folk song performance with percussion.",
                tags: ["Group", "Music", "Folk"],
                minParticipants: 6,
                maxParticipants: 10,
                timeLimit: "8 minutes",
                rules: [
                    "Includes lead singer and chorus",
                    "Traditional folk or Mappila heritage songs only",
                    "Traditional percussion (duff or clapping) mandatory, no electronic tracks",
                    "Only one team per house"
                ],
                gradient: "from-stone-900 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'VA'
            },

            {
                title: "Kadhaprasangam (Story Telling)",
                description: "Solo storytelling with a social or moral message.",
                tags: ["Solo", "Storytelling"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "10 minutes",
                rules: [
                    "Adaptation of literary work or original script",
                    "No reading from book/phone",
                    "Must be appropriate for college audience"
                ],
                gradient: "from-red-900 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'KADH'
            },

            {
                title: "Mimicry",
                description: "Solo vocal imitation of sounds, voices, or characters.",
                tags: ["Solo", "Mimicry", "Comedy"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "3-5 minutes",
                rules: [
                    "Any language, humor must be understandable",
                    "No vulgarity or offensive gestures",
                    "No pre-recorded background music – everything by voice"
                ],
                gradient: "from-orange-800 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'MIMI'
            },

            {
                title: "Group Folks' Song (Nadanpattu)",
                description: "Group performance of authentic folk songs.",
                tags: ["Group", "Music", "Folk"],
                minParticipants: 5,
                maxParticipants: 10,
                timeLimit: "5-7 minutes",
                rules: [
                    "Includes singers and instrumentalists",
                    "Traditional instruments encouraged",
                    "Only authentic folk songs, no film songs or remixes",
                    "Traditional ethnic wear recommended"
                ],
                gradient: "from-amber-800 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'GFS'
            },

            {
                title: "Spot Choreography",
                description: "Impromptu dance choreography on a given theme or music.",
                tags: ["Group", "Dance", "On-the-spot"],
                minParticipants: 2, // assumed
                maxParticipants: null,
                timeLimit: "3 minutes",
                rules: [
                    "Theme/music provided on the spot",
                    "No external objects",
                    "No vulgarity or offensive gestures",
                    "No dangerous props"
                ],
                gradient: "from-lime-800 to-black",
                eventType: 'group',
                categoryType: 'on_stage',
                shortCode: 'SPOT'
            },

            {
                title: "Classical Dance",
                description: "Solo performance in a recognised classical dance form.",
                tags: ["Solo", "Dance", "Classical"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "8 minutes",
                rules: [
                    "Forms: Bharatanatyam, Mohiniyattam, Kuchipudi, Kathak, Kathakali (solo), Odissi, Manipuri, Sattriya",
                    "Traditional costumes, ornaments, makeup",
                    "No dangerous accessories, fire, water, glass",
                    "No vulgarity or offensive content"
                ],
                gradient: "from-purple-800 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'CLAS'
            },

            {
                title: "Karnatic Music",
                description: "Solo classical Carnatic vocal performance.",
                tags: ["Solo", "Music", "Classical"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes",
                rules: [
                    "Classical Karnatic compositions only",
                    "No film songs, fusion, light music, cinematic bhajans",
                    "Electronic shruti box/tambura apps allowed"
                ],
                gradient: "from-indigo-800 to-black",
                eventType: 'individual',
                categoryType: 'on_stage',
                shortCode: 'KARN'
            }
        ]
    },
    {
        title: "Off-Stage Events",
        items: [
            {
                title: "Essay Writing (English)",
                description: "Write an essay in English on a given topic.",
                tags: ["Writing", "Essay", "Solo", "English"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Topic announced 10 minutes before start",
                    "800-1000 words",
                    "No mobile phones, books, or electronic devices",
                    "Plagiarism leads to disqualification",
                    "Cannot leave hall during first 30 minutes",
                    "Bring A4 sheet, use blue/black ink only"
                ],
                gradient: "from-blue-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'ESS_EN',
                date: '18 Feb 2026'
            },

            {
                title: "Essay Writing (Malayalam)",
                description: "Write an essay in Malayalam on a given topic.",
                tags: ["Writing", "Essay", "Solo", "Malayalam"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Topic announced 10 minutes before start",
                    "800-1000 words",
                    "No mobile phones, books, or electronic devices",
                    "Plagiarism leads to disqualification",
                    "Cannot leave hall during first 30 minutes",
                    "Bring A4 sheet, use blue/black ink only"
                ],
                gradient: "from-blue-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'ESS_ML',
                date: '20 Feb 2026'
            },

            {
                title: "Essay Writing (Hindi)",
                description: "Write an essay in Hindi on a given topic.",
                tags: ["Writing", "Essay", "Solo", "Hindi"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Topic announced 10 minutes before start",
                    "800-1000 words",
                    "No mobile phones, books, or electronic devices",
                    "Plagiarism leads to disqualification",
                    "Cannot leave hall during first 30 minutes",
                    "Bring A4 sheet, use blue/black ink only"
                ],
                gradient: "from-blue-600 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'ESS_HI',
                date: '25 Feb 2026'
            },

            {
                title: "Story Writing (English)",
                description: "Write a creative story in English on a given topic.",
                tags: ["Writing", "Story", "Solo", "English"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Topic announced 10 minutes before start",
                    "800-1000 words",
                    "No mobile phones, books, or electronic devices",
                    "Plagiarism leads to disqualification",
                    "Cannot leave hall during first 30 minutes",
                    "Bring A4 sheet, use blue/black ink only"
                ],
                gradient: "from-purple-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'STRY_EN',
                date: '20 Feb 2026'
            },

            {
                title: "Story Writing (Malayalam)",
                description: "Write a creative story in Malayalam on a given topic.",
                tags: ["Writing", "Story", "Solo", "Malayalam"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Topic announced 10 minutes before start",
                    "800-1000 words",
                    "No mobile phones, books, or electronic devices",
                    "Plagiarism leads to disqualification",
                    "Cannot leave hall during first 30 minutes",
                    "Bring A4 sheet, use blue/black ink only"
                ],
                gradient: "from-purple-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'STRY_ML',
                date: '18 Feb 2026'
            },

            {
                title: "Story Writing (Hindi)",
                description: "Write a creative story in Hindi on a given topic.",
                tags: ["Writing", "Story", "Solo", "Hindi"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Topic announced 10 minutes before start",
                    "800-1000 words",
                    "No mobile phones, books, or electronic devices",
                    "Plagiarism leads to disqualification",
                    "Cannot leave hall during first 30 minutes",
                    "Bring A4 sheet, use blue/black ink only"
                ],
                gradient: "from-purple-600 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'STRY_HI',
                date: '21 Feb 2026'
            },

            {
                title: "Poem Writing (English)",
                description: "Compose a poem in English on a given theme or starting line.",
                tags: ["Writing", "Poetry", "Solo", "English"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Theme/starting line given 10 minutes before",
                    "1-2 pages",
                    "Bring A4 sheet",
                    "No plagiarism, no phones",
                    "No vulgarity or hate speech"
                ],
                gradient: "from-green-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'POEM_EN',
                date: '19 Feb 2026'
            },

            {
                title: "Poem Writing (Malayalam)",
                description: "Compose a poem in Malayalam on a given theme or starting line.",
                tags: ["Writing", "Poetry", "Solo", "Malayalam"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Theme/starting line given 10 minutes before",
                    "1-2 pages",
                    "Bring A4 sheet",
                    "No plagiarism, no phones",
                    "No vulgarity or hate speech"
                ],
                gradient: "from-green-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'POEM_ML',
                date: '21 Feb 2026'
            },

            {
                title: "Poem Writing (Hindi)",
                description: "Compose a poem in Hindi on a given theme or starting line.",
                tags: ["Writing", "Poetry", "Solo", "Hindi"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Theme/starting line given 10 minutes before",
                    "1-2 pages",
                    "Bring A4 sheet",
                    "No plagiarism, no phones",
                    "No vulgarity or hate speech"
                ],
                gradient: "from-green-600 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'POEM_HI',
                date: '25 Feb 2026'
            },

            {
                title: "Pencil Sketching",
                description: "Create a pencil sketch based on a given theme.",
                tags: ["Art", "Sketching", "Solo", "Pencil"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "2 hours",
                rules: [
                    "Theme given 10 minutes before",
                    "Bring own pencils (HB, 2B, 4B, etc.); drawing sheet provided",
                    "No reference photos",
                    "Maintain silence",
                    "Only pencil medium allowed"
                ],
                gradient: "from-gray-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'PENC',
                date: '18 Feb 2026'
            },

            {
                title: "Water Colour Painting",
                description: "Create a water colour painting based on a given theme.",
                tags: ["Art", "Painting", "Solo", "Water Colour"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "2 hours",
                rules: [
                    "Theme given 10 minutes before",
                    "Bring own water colours, brushes, and palette; drawing sheet provided",
                    "No reference photos",
                    "Maintain silence",
                    "Only water colour medium allowed"
                ],
                gradient: "from-cyan-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'WATC',
                date: '19 Feb 2026'
            },
            {
                title: "Glass Painting",
                description: "Paint on glass sheet with a given theme.",
                tags: ["Art", "Painting", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "2 hours",
                rules: [
                    "Theme given 10 minutes before",
                    "Bring own glass sheet (30x30 cm), colours, brushes",
                    "Keep workspace tidy"
                ],
                gradient: "from-pink-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'GLAS',
                date: '20 Feb 2026'
            },

            {
                title: "Poster Designing",
                description: "Design a hand-drawn poster on a given theme.",
                tags: ["Art", "Design", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1.5 hours",
                rules: [
                    "Theme on the spot",
                    "Drawing sheet provided",
                    "Bring colours and materials",
                    "Hand-drawn only, no digital prints or stencils"
                ],
                gradient: "from-purple-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'POST',
                date: '20 Feb 2026'
            },

            {
                title: "Collage",
                description: "Create a collage using provided materials on a given theme.",
                tags: ["Art", "Collage", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1.5 hours",
                rules: [
                    "Theme on the spot",
                    "Chart paper provided",
                    "Bring magazines, glue, scissors, etc.",
                    "No phones or internet"
                ],
                gradient: "from-red-800 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'COLL',
                date: '21 Feb 2026'
            },

            {
                title: "Calligraphy",
                description: "Write a given quote or poem in an artistic style.",
                tags: ["Art", "Calligraphy", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Bring A4 sheet and materials (pen, pencils, watercolour, etc.)",
                    "No stencils",
                    "Subtle borders allowed, but must not overshadow legibility"
                ],
                gradient: "from-indigo-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'CALL',
                date: '25 Feb 2026'
            },

            {
                title: "Cartoon",
                description: "Draw a cartoon on a given theme.",
                tags: ["Art", "Cartoon", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Theme on the spot",
                    "Chart paper provided",
                    "Bring materials",
                    "All drawing done during event, no pre‑sketched outlines",
                    "Use black ink, markers, coloured pencils; no charcoal"
                ],
                gradient: "from-orange-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'CART',
                date: '25 Feb 2026'
            },

            {
                title: "Extempore (English)",
                description: "Speak in English on a topic drawn by lot with minimal preparation.",
                tags: ["Speaking", "Solo", "Impromptu", "English"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes speaking, 5 minutes thinking",
                rules: [
                    "Topic picked by lot",
                    "No paper or materials during speech"
                ],
                gradient: "from-teal-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'EXTM_EN',
                date: '18 Feb 2026'
            },

            {
                title: "Extempore (Malayalam)",
                description: "Speak in Malayalam on a topic drawn by lot with minimal preparation.",
                tags: ["Speaking", "Solo", "Impromptu", "Malayalam"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes speaking, 5 minutes thinking",
                rules: [
                    "Topic picked by lot",
                    "No paper or materials during speech"
                ],
                gradient: "from-teal-600 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'EXTM_ML',
                date: '19 Feb 2026'
            },

            {
                title: "Extempore (Hindi)",
                description: "Speak in Hindi on a topic drawn by lot with minimal preparation.",
                tags: ["Speaking", "Solo", "Impromptu", "Hindi"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "5 minutes speaking, 5 minutes thinking",
                rules: [
                    "Topic picked by lot",
                    "No paper or materials during speech"
                ],
                gradient: "from-teal-500 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'EXTM_HI',
                date: '20 Feb 2026'
            },

            {
                title: "Quiz",
                description: "General knowledge and current affairs quiz for teams of two.",
                tags: ["Team", "Quiz", "Knowledge"],
                minParticipants: 1,
                maxParticipants: 2,
                timeLimit: null, // not specified
                rules: [
                    "Maximum 2 participants per team",
                    "Quiz Master's decision is final"
                ],
                gradient: "from-cyan-700 to-black",
                eventType: 'group',
                categoryType: 'off_stage',
                shortCode: 'QU'
            },

            {
                title: "Debate",
                description: "Structured debate on a given topic (team of two).",
                tags: ["Team", "Debate", "Speaking"],
                minParticipants: 1,
                maxParticipants: 2,
                timeLimit: "3 min main speech + 1-2 min rebuttal",
                rules: [
                    "Topic given day before",
                    "English or Malayalam",
                    "Opening statement, rebuttal, concluding remarks",
                    "Warning bell 30 seconds before end",
                    "Cue cards allowed, no phones/laptops on stage",
                    "No personal insults"
                ],
                gradient: "from-rose-700 to-black",
                eventType: 'group',
                categoryType: 'off_stage',
                shortCode: 'DE'
            },

            {
                title: "Art from Waste",
                description: "Create artwork using waste materials.",
                tags: ["Art", "Recycling", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "2 hours",
                rules: [
                    "Use waste materials like paper scraps, plastic bottles, cardboard",
                    "No ready-made decorative items",
                    "Adhesives and basic colouring allowed"
                ],
                gradient: "from-lime-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'ARTW',
                date: '21 Feb 2026'
            },

            {
                title: "Logo Making",
                description: "Design a hand-drawn logo on a given theme.",
                tags: ["Art", "Design", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Theme on the spot",
                    "Chart paper provided",
                    "Bring materials",
                    "Clean and recognisable design"
                ],
                gradient: "from-amber-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'LOGO',
                date: '25 Feb 2026'
            },

            {
                title: "Caption Writing",
                description: "Write a caption for a displayed image.",
                tags: ["Writing", "Creative", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "30 minutes",
                rules: [
                    "Image displayed on the spot",
                    "Caption in English or Malayalam",
                    "Max 20 words",
                    "No offensive language",
                    "No phones or internet"
                ],
                gradient: "from-emerald-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'CAPT',
                date: '25 Feb 2026'
            },

            {
                title: "Face Painting",
                description: "Create a face painting design on a provided model.",
                tags: ["Art", "Face Painting", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "2 hours",
                rules: [
                    "Choose own theme",
                    "Use skin-safe, non-toxic paints",
                    "Bring own materials (brushes, sponges, etc.)",
                    "Model will be provided by organizers",
                    "Design covers significant part of face",
                    "No vulgar/offensive content"
                ],
                gradient: "from-fuchsia-700 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'FACE',
                date: '19 Feb 2026'
            },

            {
                title: "Mehendi Designing",
                description: "Apply freehand mehendi on hand.",
                tags: ["Art", "Mehendi", "Solo"],
                minParticipants: 1,
                maxParticipants: 1,
                timeLimit: "1 hour",
                rules: [
                    "Choose own theme",
                    "Applied only on hand",
                    "No pre-drawn sketches or stencils - all freehand"
                ],
                gradient: "from-rose-600 to-black",
                eventType: 'individual',
                categoryType: 'off_stage',
                shortCode: 'MEHN',
                date: '21 Feb 2026'
            },

            {
                title: "Movie Scene Recreation",
                description: "Recreate a scene from a film in a pre-recorded video.",
                tags: ["Video", "Acting", "Team"],
                minParticipants: 2,
                maxParticipants: 5,
                timeLimit: "10 minutes (video length)",
                rules: [
                    "Recreate a scene from a recognised film (Indian or International)",
                    "Video must be pre-recorded, not live",
                    "Landscape orientation (16:9), min 720p",
                    "Original source played at beginning",
                    "Upload by 26-02-2026",
                    "Submission Link: https://drive.google.com/drive/folders/1bGGA52Y9Q0XA3FJVp0ouWS39PPSKggUK",
                    "No vulgar/offensive content"
                ],
                gradient: "from-sky-700 to-black",
                eventType: 'group',
                categoryType: 'off_stage',
                shortCode: 'MSR'
            }

        ]
    }
];

export const DEPARTMENTS = ["CIVIL", "MECH", "EEE", "CSE"];
export const SEMESTERS = ["S2", "S4", "S6", "S8"];
export const CSE_SEMESTERS = ["S2 A", "S2 B", "S4 A", "S4 B", "S6", "S8"];
