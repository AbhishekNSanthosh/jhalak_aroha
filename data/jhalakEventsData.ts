export type EventCategory = "onstage" | "offstage" | "online";

export interface EventRule {
    title: string;
    category: EventCategory;
    rules: string[];
    description?: string;
    tags?: string[];
}

export const jhalakEvents: EventRule[] = [
    // On-Stage Events
    {
        title: "Mime",
        category: "onstage",
        rules: [
            "Time Limit - 7 minutes.",
            "Max 8 Members.",
            "Screening Will Be Present.",
            "Only one team from each house is allowed.",
            "Wear black and white clothing. White face makeup is used to make your expressions visible from the back of the hall.",
            "No extra props are allowed.",
            "The theme or message must be conveyed only through facial expressions, body movements, and gestures.",
            "Background instrumental music and sound effects are allowed, but lyrics or narration are strictly prohibited.",
            "No talking, whispering, or making any vocal noises.",
            "Vulgar, offensive, political or religiously sensitive content is strictly prohibited."
        ]
    },
    {
        title: "Karaoke Song (Individual)",
        category: "onstage",
        rules: [
            "Maximum Time Limit is 6 minutes.",
            "Any language song can be sung.",
            "The track should be brought on a pen drive. If the pen drive doesn’t play at the time of the event, the participant is solely responsible.",
            "Maximum 3 participants from each house.",
            "No offensive lyrics, slurs, or overly explicit themes."
        ]
    },
    {
        title: "Group Song",
        category: "onstage",
        rules: [
            "5 to 10 members.",
            "Maximum time limit is 6 minutes.",
            "Any language songs are allowed.",
            "Maximum 2 teams from each house.",
            "Groups must be present at the backstage 2 slots before their turn."
        ]
    },
    {
        title: "Thiruvathira",
        category: "onstage",
        rules: [
            "8 to 10 participants.",
            "The track should be brought on a pen drive, if it doesn't play at the time of the event, the participant is solely responsible.",
            "Only one team from each house is allowed.",
            "Maximum time limit is 10 minutes.",
            "Screening is required.",
            "Groups must be present at the backstage 2 slots before their turn."
        ]
    },
    {
        title: "Monoact",
        category: "onstage",
        rules: [
            "Maximum time allowed: 5 minutes.",
            "No bad language or offensive topics.",
            "Any content involving vulgarity or offensive themes toward any community will lead to immediate disqualification."
        ]
    },
    {
        title: "Group Dance",
        category: "onstage",
        rules: [
            "Time limit – 6 to 10 minutes.",
            "Max 15 participants.",
            "The track should be brought on a pen drive if it doesn’t play at the time of the event the participant is solely responsible.",
            "Only two teams from each house are allowed.",
            "Screening is required.",
            "Costumes must be decent and appropriate for college.",
            "Be backstage 15 minutes before your turn."
        ]
    },
    {
        title: "Step N Synchro",
        category: "onstage",
        rules: [
            "Time limit is 5 minutes.",
            "Maximum two pair of participants from a house are allowed.",
            "The track should be brought on a pen drive, if it doesn’t play at the time of the event, the participant is solely responsible.",
            "The performance must be a synchronized step/dance routine emphasizing uniformity, timing, and formations.",
            "Screening is required.",
            "Vulgar, offensive, political, or discriminatory gestures/lyrics are strictly prohibited.",
            "Dangerous stunts, fire, water, powder, or sharp props are not allowed.",
            "Be backstage 15 minutes before your turn."
        ]
    },
    {
        title: "Nostalgia (Dance)",
        category: "onstage",
        rules: [
            "Maximum time limit - 6 minutes.",
            "Max 8 participants.",
            "The track should be brought on a pen drive if it doesn't play at the time of the event, the participant is solely responsible.",
            "Songs, costumes, and choreography should clearly represent a specific period (e.g., 80s, 90s, early 2000s, folk tradition, vintage cinema, etc.).",
            "Songs listed before 2005 will only be permitted.",
            "Costumes should match the nostalgic theme and must be appropriate and decent.",
            "Only two teams from each house are allowed.",
            "Screening is required."
        ]
    },
    {
        title: "Instrumental Music Solo",
        category: "onstage",
        rules: [
            "Maximum Time Limit- 10 minutes.",
            "Maximum 3 Participants from Each house.",
            "Participants must bring their own musical instruments.",
            "Any musical instrument (String, Wind & Keyboard) is allowed.",
            "Only live instrumental performance is allowed.",
            "Tuning should be done before entering the stage to save time.",
            "Use of a metronome/click track is permitted for timing support."
        ]
    },
    {
        title: "Oppana",
        category: "onstage",
        rules: [
            "7 to 10 Participants (only girls).",
            "Duration of the dance should not be more than 8 minutes.",
            "Screening is required.",
            "Performers must wear traditional attire—typically a Kachi (cloth), Kuppayam (blouse), and a Thattam (headscarf). The bride should be dressed in fine jewelry and silks.",
            "Traditional Oppana songs in Malayalam/Mappila style must be used.",
            "Vulgarity, cinematic dance steps, western dance moves, or acrobatics are prohibited.",
            "Only one team from each house is allowed."
        ]
    },
    {
        title: "Fancy Dress",
        category: "onstage",
        rules: [
            "Maximum time allotted for the performance is up to two minutes.",
            "Background music is allowed.",
            "No religious deity to be enacted and do not hurt the sentiments of any religion, culture or nationality.",
            "Enacting smokers, drunkards or any such negative acts / dress are not allowed.",
            "Participants can portray famous personalities (historical or current), mythological figures, or creative concepts.",
            "Dangerous materials, sharp objects, fire, liquids, animals, or substances causing harm are strictly prohibited."
        ]
    },
    {
        title: "Fashion Show",
        category: "onstage",
        rules: [
            "Each team must have a specific theme.",
            "Maximum 10 participants.",
            "Maximum Time Limit- 5 minutes.",
            "Costumes should reflect creativity and be relevant to the theme.",
            "Background music is allowed and should match the theme of the performance.",
            "Vulgarity, offensive gestures, or content hurting cultural/religious sentiments is strictly prohibited and will lead to disqualification.",
            "Only one team from each house is allowed."
        ]
    },
    {
        title: "Recitation",
        category: "onstage",
        rules: [
            "Maximum time limit- 5 minutes.",
            "The content can be a poem by a famous poet or an original piece, and it must be appropriate and respectful.",
            "Any language is allowed, but the humor should be understood by the general audience.",
            "Poems can be in the specified language (e.g., English, Malayalam, or Hindi) as per the category."
        ]
    },
    {
        title: "Light Music",
        category: "onstage",
        rules: [
            "Maximum Time Limit- 5 minutes.",
            "A single instrument (Harmonium/Keyboard/Guitar) or a shruti box is allowed.",
            "Songs can be original or popular and it must be appropriate and respectful.",
            "Generally, this is a \"live\" event. No backing tracks or karaoke are allowed."
        ]
    },
    {
        title: "Margam Kali",
        category: "onstage",
        rules: [
            "7 to 12 participants.",
            "Only one team from each house is allowed.",
            "Maximum time limit is 10 minutes.",
            "Screening is required.",
            "Performers must wear the traditional Chattayum Mundum- ചട്ടയ ും മ ണ് ും (white blouse and dhoti with a fan-shaped fold) and traditional jewelry."
        ]
    },
    {
        title: "Solo Dance",
        category: "onstage",
        rules: [
            "Time limit – 3 to 5 minutes.",
            "The track should be brought on a pen drive if it doesn't play at the time of the event, the participant is solely responsible.",
            "Screening is required.",
            "The dance should be appropriate, creative and safe; offensive moves or vulgar gestures are not allowed.",
            "Outfits must be appropriate for a college audience. Any costume deemed \"indecent\" will lead to disqualification.",
            "Maximum 3 participants from each house are allowed."
        ]
    },
    {
        title: "RJ Hunt",
        category: "onstage",
        rules: [
            "Maximum Time Limit- 5 minutes.",
            "Participant gets a fixed theme to host or present.",
            "Topics are given on the spot to test spontaneity.",
            "The content should be appropriate, creative and encouraging; offensive languages or topics are not allowed."
        ]
    },
    {
        title: "Vattapaatu",
        category: "onstage",
        rules: [
            "The group must consist of 6 to 10 members, including the leader singer and the chorus.",
            "Maximum Time Limit - 8 minutes.",
            "Songs must be traditional folk or ‘Mappila’ heritage songs; cinematic versions or parodies are strictly prohibited.",
            "The use of traditional percussion like the duff or rhythmic clapping is mandatory; no electronic background tracks are allowed.",
            "Only one team from each house is allowed."
        ]
    },
    {
        title: "Kadhaprasangam (Story Telling)",
        category: "onstage",
        rules: [
            "A solo performance is required.",
            "Maximum Time Limit- 10 minutes.",
            "The story can be an adaptation of a famous literary work or an original script, but it must have a clear social or moral message.",
            "Reading from a book or phone is not allowed.",
            "Stories must be appropriate for a college audience. Avoid any content that is offensive, vulgar, or promotes hate speech."
        ]
    },
    {
        title: "Mimicry",
        category: "onstage",
        rules: [
            "This is a solo performance. No group acts or assistants are allowed.",
            "Each participant is allotted between 3 to 5 minutes.",
            "Any language is allowed, but the humor should be understood by the general audience.",
            "Vulgarity, offensive gestures are strictly prohibited",
            "No pre-recorded background music or sound effects. Everything must be produced by your voice."
        ]
    },
    {
        title: "Group Folks’ Song (Nadanpattu)",
        category: "onstage",
        rules: [
            "A team must consist of 5 to 10 members (including singers and instrumentalists).",
            "Each team is allowed 5 to 7 minutes for their performance.",
            "Use of traditional instruments (like Dholak, Harmonium, Flute, or Manjira) is encouraged.",
            "Only authentic folk songs are allowed. No film songs or \"pop-remixes\" of folk tunes.",
            "Traditional ethnic wear that complements the region of the song is highly recommended."
        ]
    },
    {
        title: "Spot Choreography",
        category: "onstage",
        rules: [
            "Max. time limit: 3 minutes.",
            "A theme and/or music track will be provided on the spot.",
            "No external objects are allowed.",
            "Vulgarity, offensive gestures are strictly prohibited.",
            "Use of dangerous or hazardous props (fire, water, sharp objects, glass, chemicals, etc.) is strictly prohibited."
        ]
    },
    {
        title: "Classical Dance",
        category: "onstage",
        rules: [
            "Maximum Time limit:8 minutes.",
            "It’s a solo event.",
            "Dance event can be Bharatanatyam, Mohiniyattam, Kuchipudi, Kathak, Kathakali (Solo Adaptation), Odissi, Manipuri, Sattriya etc.",
            "Participants must wear traditional costumes appropriate to the classical dance form.",
            "Use of ornaments and make-up should maintain the dignity and authenticity of the style.",
            "Dangerous accessories, fire, water, glass, or prohibited materials are strictly not allowed.",
            "Vulgarity, offensive gestures, or content hurting cultural/religious sentiments is strictly prohibited and will lead to disqualification."
        ]
    },
    {
        title: "Carnatic Music",
        category: "onstage",
        rules: [
            "Max. time limit: 5 minutes.",
            "Solo performance only",
            "Participants must perform classical Carnatic music compositions.",
            "Film songs, fusion, light music, bhajans in cinematic style, or western adaptations are not permitted.",
            "Electronic shruti box / tambura apps are allowed."
        ]
    },

    // Off-Stage Events
    {
        title: "Essay Writing / Story Writing",
        category: "offstage",
        rules: [
            "Time limit: 1 hour.",
            "The specific topic for the essay will be announced 10 minutes before the start of the event to ensure fairness.",
            "The essay should be between 800 and 1000 words.",
            "Mobile phones, books, or electronic devices are strictly prohibited.",
            "Plagiarism or copied content will lead to disqualification.",
            "Any form of unfair practice, including communication with others, will result in immediate disqualification.",
            "Participants will not be allowed to leave the hall during the first 30 minutes of the competition.",
            "Participants must bring the sheet (A4) and other required materials.",
            "Only blue or black ink pens are permitted. Use of pencil is not permitted."
        ]
    },
    {
        title: "Poem Writing",
        category: "offstage",
        rules: [
            "Time limit: 1 hour.",
            "The theme or starting line will be provided 10 minutes before the start time.",
            "There is typically no strict word limit, but the poem should generally fit within 1 to 2 pages.",
            "Participants must bring the sheet (A4) and other required materials.",
            "Plagiarism or copied content will lead to disqualification.",
            "Mobile phones, books, or electronic devices are strictly prohibited",
            "Participants must report at least 15 min. before competition.",
            "Poems must not contain vulgarity, hate speech, or offensive remarks.",
            "The content should maintain the decorum of an educational institution."
        ]
    },
    {
        title: "Drawing (Pencil Sketching, Water Colour)",
        category: "offstage",
        rules: [
            "Time limit: 2 hours.",
            "The theme or starting line will be provided 10 minutes before the start time.",
            "Participants must bring the pencils and other required materials.",
            "Drawing sheet will be provided during the event.",
            "Using reference photos from phones or printed sheets is usually prohibited.",
            "Participants must report at least 15 min. before competition.",
            "Decision of the judges will be final.",
            "Participants must maintain silence and stay within their allotted space."
        ]
    },
    {
        title: "Glass Painting",
        category: "offstage",
        rules: [
            "Time limit: 2 hours.",
            "The theme will be provided 10 minutes before the start time.",
            "Participants must report at least 15 min. before competition.",
            "Individual participation is only allowed.",
            "The college typically provides the workspace; however, participants must bring their own glass sheet. (30 x 30) cm.",
            "Participants are responsible for bringing their own glass colors, liners, brushes, and cleaning materials.",
            "Participants must ensure their workspace is kept tidy and any spills are cleaned immediately to avoid damaging the venue."
        ]
    },
    {
        title: "Poster Designing",
        category: "offstage",
        rules: [
            "Time limit: 1.5 hours.",
            "Theme will be given on the spot.",
            "Participants must report at least 15 min. before competition.",
            "Drawing sheet will be provided during the event.",
            "Participants must bring colors and other decoration materials",
            "Only hand-drawn designs are allowed. Use of digital prints, stencils, or pre-cut stickers is strictly prohibited.",
            "Participants may use watercolours, poster colours, acrylics, or markers."
        ]
    },
    {
        title: "Collage",
        category: "offstage",
        rules: [
            "Time limit: 1.5 hours.",
            "Theme will be given on the spot.",
            "Use of mobile phones or internet is strictly prohibited.",
            "Participants must report at least 15 min. before competition.",
            "Chart paper will be provided during the event.",
            "Participants must bring all required materials (magazines, glue, scissors, sketch pens, colours, etc.)",
            "Allowed materials include newspapers, ribbons, coloured or handmade papers, photographs, markers, and cut-outs."
        ]
    },
    {
        title: "Calligraphy",
        category: "offstage",
        rules: [
            "Time limit: 1 hour.",
            "Participants must bring the sheet (A4) and other required materials.",
            "Participants may use pen, pencils, crayons, watercolour, sketches, etc.",
            "Use of any kind of stencil is strictly prohibited.",
            "Participants must submit their work on time.",
            "A specific quote, poem, or paragraph will be provided at the start of the event to be written.",
            "Subtle borders or flourishing are allowed, but they should not overshadow the legibility of the writing."
        ]
    },
    {
        title: "Cartoon",
        category: "offstage",
        rules: [
            "Time limit: 1 hour.",
            "Theme will be given on the spot.",
            "Chart paper will be provided during the event.",
            "Participants must bring all the required materials.",
            "All drawing must be done during the event. Participants cannot bring pre-sketched characters or traced outlines.",
            "Use of black waterproof ink, fine-liners, markers, or coloured pencils is allowed. Charcoal and messy oils are usually discouraged."
        ]
    },
    {
        title: "Extempore",
        category: "offstage",
        rules: [
            "Thinking time: 5 minutes",
            "Speaking time: 5 minutes",
            "Each participant will pick a topic by lot. If they refuse a topic, they cannot ask for a second one.",
            "The topics can be selected only once.",
            "No paper or materials allowed during speech."
        ]
    },
    {
        title: "Quiz",
        category: "offstage",
        rules: [
            "Maximum of 2 participants per team.",
            "The quiz will be conducted based on topics covering general knowledge and current affairs.",
            "The Quiz Master’s decision is final and no arguments will be entertained."
        ]
    },
    {
        title: "Debate",
        category: "offstage",
        rules: [
            "Maximum of 2 participants per team.",
            "Topic will be given on the day before the event.",
            "The debate shall be conducted in English or Malayalam.",
            "The debate will follow a structured format: opening statement, rebuttal round, and concluding remarks.",
            "Each speaker will be allotted a fixed time (3 minutes) for the main speech.",
            "Rebuttal time will be limited (1–2 minutes).",
            "A warning bell will be given 30 seconds before the end of time; exceeding the time limit may result in penalty.",
            "You can use small cue cards for notes, but reading an entire pre-written essay is not allowed.",
            "Mobile phones and laptops are strictly prohibited on stage during the debate.",
            "No personal insults or offensive language. Address the argument, not the person."
        ]
    },
    {
        title: "Art From Waste",
        category: "offstage",
        rules: [
            "Time limit: 2 hours.",
            "Waste materials such as paper scraps, plastic bottles, cardboard, metal pieces, cloth waste, etc., are permitted.",
            "No ready-made decorative items or new materials should be used, except adhesives and basic colouring if required.",
            "Participants should complete their artwork within the given time limit.",
            "Participants are responsible for any damage caused to college property during the event."
        ]
    },
    {
        title: "Logo Making",
        category: "offstage",
        rules: [
            "Time limit: 1 hour.",
            "Theme will be given on the spot.",
            "The logo must be created manually (hand drawn).",
            "Chart paper will be provided during the event.",
            "Participants must bring their own materials.",
            "The design should be clean and recognizable. Avoid overcrowding the logo with too many details."
        ]
    },
    {
        title: "Caption Writing",
        category: "offstage",
        rules: [
            "Time allotted: 30 min.",
            "An image will be displayed on the spot.",
            "Participants must write a suitable caption for the given image.",
            "The caption shall be written in English or Malayalam.",
            "Use of offensive, abusive, or inappropriate language is strictly prohibited.",
            "The caption should not exceed 20 words.",
            "Use of mobile phones or internet is strictly prohibited.",
            "The caption must connect logically to the image.",
            "Any use of offensive language, double meanings, or hate speech will lead to instant disqualification."
        ]
    },
    {
        title: "Face Painting",
        category: "offstage",
        rules: [
            "Time limit: 2 hours.",
            "Participants may choose themes of their preference.",
            "Participation is team-based, with a maximum of 2 members (one painter and one model).",
            "Only skin-safe, non-toxic, cosmetic-grade paints may be used.",
            "Participants must bring their own materials (brushes, sponges, wipes, mirrors, etc.).",
            "The design should cover a significant portion of the face (it can extend to the neck/ears, but not the full body).",
            "Vulgar, offensive, political or religiously sensitive content is strictly prohibited."
        ]
    },
    {
        title: "Mehendi Designing",
        category: "offstage",
        rules: [
            "Time limit: 1 hour.",
            "Participants may choose themes of their preference.",
            "Mehendi should be applied only on the hand.",
            "No pre-drawn sketches on the skin or use of readymade stencils/stickers. All work must be freehand"
        ]
    },
    // Online / Special
    {
        title: "Movie Scene Recreation",
        category: "online",
        rules: [
            "Maximum performance duration: 10 minutes",
            "Each team shall consist of minimum 2 and maximum 5 participants.",
            "The team must recreate a scene from a recognized film (Indian or International)",
            "The video must be pre-recorded (off-stage) and not performed live.",
            "Video must be shot in landscape orientation (16:9) only.",
            "Minimum resolution: 720p (HD). Preferred: 1080p.",
            "The original source must be played at the beginning of the video.",
            "Video must be uploaded in the drive on or before 26-02-2026.",
            "Late submissions will not be accepted.",
            "The recreated scene should be clearly identifiable to judges and audience.",
            "Dialogue delivery may be in the original language or translated, but the essence of the scene must be retained.",
            "Vulgar, offensive, political, or religiously sensitive content is strictly prohibited."
        ]
    },
];
