/**
 * DEMO exam content for Tiếng Anh (English), modelled on the format of the Vietnamese THPT graduation
 * exam from 2025: 40 four-option multiple-choice questions (0.25 point each, 50 minutes) — gap-fill on
 * an advertisement (1–6) and a leaflet (7–12), arranging utterances/sentences (13–17), clause/sentence
 * gap-fill in a passage (18–22) and two reading-comprehension passages (23–30, 31–40). Every stem
 * repeats its instruction and full passage because each question is stored separately. All passages
 * and questions are ORIGINAL practice items written for this demo, not official exam content.
 */
import { createBuilders, DEMO_NOTE, type DemoExam, type DemoQuestion } from "./builders";

const { mc } = createBuilders();

const TOPICS = ["Ngữ pháp và từ vựng trong ngữ cảnh", "Sắp xếp câu – đoạn văn", "Điền câu vào đoạn văn", "Đọc hiểu"];

/** Stem = instruction + passage + the specific question (each question is stored on its own). */
function stem(instruction: string, passage: string, question: string): string {
  return `${instruction}\n\n${passage}\n\n${question}`;
}

// ───────────────────────────── Questions 1–6: advertisement ─────────────────────────────
const AD_INSTR =
  "Read the following advertisement and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks.";
const AD = [
  "GREEN WHEELS BIKE-SHARING – NOW IN YOUR CITY!",
  "",
  "Tired of traffic jams and crowded buses? Green Wheels offers a (1) _______ and affordable way to get around town. Our (2) _______ bikes are parked at more than 50 stations across the city centre, and they are available (3) _______ 5 a.m. to midnight every day. Just download our app, scan the code and start riding!",
  "",
  "Members pay only USD 5 a month. Riders (4) _______ the app before 31 May will also receive a free helmet.",
  "",
  "Every bike is checked daily by our technicians, (5) _______ make sure that each ride is safe and smooth. Join thousands of happy riders and (6) _______ a difference to the air we breathe!",
].join("\n");
const ad = (n: number) => stem(AD_INSTR, AD, `Question ${n}: Choose the option that best fits blank (${n}).`);

// ───────────────────────────── Questions 7–12: leaflet ─────────────────────────────
const LEAFLET_INSTR =
  "Read the following leaflet and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks.";
const LEAFLET = [
  "KEEP OUR SCHOOL GREEN!",
  "A guide for every student",
  "",
  "Every day, our school produces too (7) _______ waste. You can help by following these tips:",
  "",
  "• Bring a reusable bottle. There are (8) _______ water fountains on every floor, so there is no need to buy bottled water.",
  "• Turn (9) _______ the lights and fans whenever you leave an empty classroom.",
  "• Sort your rubbish carefully. (10) _______, paper and cans go in the blue bins, while food waste goes in the green ones.",
  "• Take (11) _______ in our monthly clean-up day. All volunteers will receive a certificate.",
  "",
  "Small actions can have a big (12) _______ on our environment. Let's work together!",
].join("\n");
const leaflet = (n: number) => stem(LEAFLET_INSTR, LEAFLET, `Question ${n}: Choose the option that best fits blank (${n}).`);

// ───────────────────────────── Questions 13–17: arrangement ─────────────────────────────
const ARRANGE_INSTR =
  "Mark the letter A, B, C or D on your answer sheet to indicate the best arrangement of utterances or sentences to make a meaningful exchange or text in each of the following questions.";
const arrange = (n: number, lines: string[]) => stem(ARRANGE_INSTR, lines.join("\n"), `Question ${n}: Choose the best arrangement.`);

// ───────────────────────────── Questions 18–22: sentence gap-fill ─────────────────────────────
const GAP_INSTR =
  "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks.";
const ROOFTOP = [
  "In many crowded cities, rooftops are among the last unused spaces, often covered with nothing but water tanks and broken furniture. Over the past decade, however, a growing number of residents (18) _______. These rooftop gardens provide fresh vegetables, cool the buildings below and offer a quiet place to relax after work.",
  "",
  "The benefits go beyond food. Plants absorb heat from the sun, (19) _______. Measurements have shown that on a hot afternoon the surface of a green roof can be many degrees cooler than bare concrete. Lower temperatures mean that families rely less on air conditioners, which in turn reduces their electricity bills.",
  "",
  "Rooftop gardens also bring neighbours together. In one apartment block, residents (20) _______ now meet every weekend to water the plants and share the harvest. (21) _______, many of them had never spoken to one another. Children now learn where their food comes from, and older residents enjoy passing on their gardening knowledge.",
  "",
  "Of course, not every roof is suitable. A garden full of soil and water adds a great deal of weight, so engineers must first check (22) _______. With careful planning, though, even a small roof can become a green space that benefits both people and the planet.",
].join("\n");
const rooftop = (n: number) => stem(GAP_INSTR, ROOFTOP, `Question ${n}: Choose the option that best fits blank (${n}).`);

// ───────────────────────────── Questions 23–30: reading 1 ─────────────────────────────
const READ_INSTR =
  "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the following questions.";
const CRAFTS = [
  "In recent years, traditional craft villages across Vietnam have faced a difficult choice. For centuries, families in these villages have produced pottery, silk, lacquerware and bamboo products by hand, passing their skills from parents to children. However, cheap factory-made goods now dominate the market, and many young people prefer to move to the cities, where they can find better-paid jobs.",
  "",
  "To survive, some villages have turned to tourism. Visitors can now watch artisans at work, join short workshops and even make their own souvenirs. In one pottery village, tourists spend an afternoon shaping clay on a wheel before their pieces are fired in a traditional kiln. Such experiences are popular with both foreign visitors and urban families, who are eager to see how everyday objects were made in the past.",
  "",
  "Tourism has brought clear benefits. Money from tickets and workshops allows older artisans to continue their work, and it gives young people a reason to stay at home. Some young artisans have even opened online shops, selling handmade products to customers around the world.",
  "",
  "Yet the change is not without problems. As visitor numbers grow, some workshops have started to produce simple, identical items that can be made and sold quickly. Critics worry that the crafts may lose their artistic value and become little more than a show for tourists. Local leaders therefore stress that tourism should support the crafts, not replace them. In their view, the real attraction of a craft village is its authenticity, and once that is lost, visitors will have little reason to come back.",
].join("\n");
const crafts = (q: string) => stem(READ_INSTR, CRAFTS, q);

// ───────────────────────────── Questions 31–40: reading 2 ─────────────────────────────
const AI_TUTORS = [
  "Not long ago, the idea of a computer program that could explain a maths problem, correct an essay or answer a student's questions at midnight sounded like science fiction. Today, such tools are available to anyone with a smartphone, and some can even hold a spoken conversation in several languages. Artificial intelligence (AI) tutors are spreading rapidly in schools and homes, and many educators believe they could change the way young people learn. [I]",
  "",
  "Supporters point to the personal attention these programs can offer. In a typical class of forty students, a teacher cannot possibly check every student's understanding at every moment. [II] An AI tutor, by contrast, can adjust the difficulty of exercises to each learner, give instant feedback and allow students to repeat a lesson as many times as they need without feeling embarrassed. For shy students, or for those who have fallen behind, this patient and private support can be especially valuable.",
  "",
  "However, critics warn that the technology has serious limitations. AI tutors sometimes produce answers that sound convincing but are simply wrong, and students who trust them blindly may end up learning mistakes. [III] There is also a concern that if a machine is always ready with a hint, learners may give up too quickly when a task becomes difficult, and so never develop the persistence that real learning requires. Moreover, not every family can afford a fast internet connection or a modern device, so the gap between rich and poor students could grow wider rather than smaller.",
  "",
  "Most experts agree that the answer is not to ban these tools but to use them wisely. [IV] Teachers remain essential: they can design tasks that require students to think for themselves, show them how to check information against more than one source, and provide the encouragement and human connection that no program can replace. In the classroom of the future, the most successful learners may be those who know when to ask a machine for help and when to rely on their own minds.",
].join("\n");
const aiTutors = (q: string) => stem(READ_INSTR, AI_TUTORS, q);

const QUESTIONS: DemoQuestion[] = [
  // ── 1–6: advertisement ──
  mc(0, "EASY", ad(1), ["convenient", "convenience", "conveniently", "inconvenience"], "A",
    "Chỗ trống đứng sau mạo từ \"a\", trước danh từ \"way\" và song song với tính từ \"affordable\" (nối bằng \"and\") nên cần một tính từ: \"convenient\" (thuận tiện). \"convenience\"/\"inconvenience\" là danh từ, \"conveniently\" là trạng từ."),
  mc(0, "MEDIUM", ad(2), ["new yellow electric", "yellow new electric", "electric new yellow", "new electric yellow"], "A",
    "Trật tự tính từ trước danh từ (OSASCOMP): tuổi/độ mới (new) → màu sắc (yellow) → tính từ phân loại/mục đích (electric, đứng sát danh từ). Vậy đáp án là \"new yellow electric bikes\"."),
  mc(0, "EASY", ad(3), ["from", "since", "at", "during"], "A",
    "Cấu trúc \"from … to …\" chỉ khoảng thời gian: \"available from 5 a.m. to midnight\" (hoạt động từ 5 giờ sáng đến nửa đêm). \"since\" dùng với thì hoàn thành, \"at\"/\"during\" không đi với \"to\" trong cấu trúc này."),
  mc(0, "MEDIUM", ad(4), ["downloading", "downloaded", "download", "are downloading"], "A",
    "Câu đã có động từ chính \"will receive\", nên chỗ trống là mệnh đề quan hệ rút gọn bổ nghĩa cho \"Riders\". Người đi xe chủ động tải ứng dụng nên dùng hiện tại phân từ: \"Riders downloading the app\" = \"Riders who download the app\". \"downloaded\" mang nghĩa bị động, còn \"download\"/\"are downloading\" tạo ra hai động từ chính."),
  mc(0, "EASY", ad(5), ["who", "which", "whom", "whose"], "A",
    "Chỗ trống thay cho danh từ chỉ người \"our technicians\" và làm chủ ngữ cho động từ \"make sure\" nên dùng đại từ quan hệ \"who\". \"which\" dùng cho vật, \"whom\" làm tân ngữ, \"whose\" phải đi kèm danh từ."),
  mc(0, "EASY", ad(6), ["make", "do", "take", "give"], "A",
    "Cụm cố định \"make a difference (to something)\": tạo ra sự khác biệt, có ảnh hưởng tích cực. Không nói \"do/take/give a difference\"."),

  // ── 7–12: leaflet ──
  mc(0, "EASY", leaflet(7), ["much", "many", "few", "little"], "A",
    "\"waste\" (rác thải) là danh từ không đếm được, và ý câu là trường học thải ra quá nhiều rác, nên dùng \"too much waste\". \"many\"/\"few\" đi với danh từ đếm được số nhiều; \"too little\" sai nghĩa."),
  mc(0, "EASY", leaflet(8), ["a few", "a little", "much", "every"], "A",
    "\"water fountains\" là danh từ đếm được số nhiều và động từ là \"There are\" nên dùng \"a few\" (một vài). \"a little\"/\"much\" đi với danh từ không đếm được; \"every\" đi với danh từ số ít."),
  mc(0, "EASY", leaflet(9), ["off", "on", "up", "over"], "A",
    "\"turn off the lights and fans\": tắt đèn và quạt khi rời lớp học trống — phù hợp với chủ đề tiết kiệm năng lượng. \"turn on\" (bật) ngược nghĩa; \"turn up\" (tăng lên) và \"turn over\" (lật lại) không hợp ngữ cảnh."),
  mc(0, "MEDIUM", leaflet(10), ["For example", "However", "Otherwise", "Despite this"], "A",
    "Câu sau đưa ra ví dụ cụ thể cho lời khuyên \"Sort your rubbish carefully\" (giấy và lon bỏ vào thùng xanh dương, rác thực phẩm bỏ vào thùng xanh lá), nên dùng \"For example\". \"However\"/\"Despite this\" chỉ sự tương phản, \"Otherwise\" nghĩa là \"nếu không thì\"."),
  mc(0, "EASY", leaflet(11), ["part", "place", "care", "notice"], "A",
    "\"take part in\" = tham gia (một hoạt động). \"take place\" (diễn ra) có chủ ngữ là sự kiện; \"take care of\" (chăm sóc) và \"take notice of\" (chú ý) không đi với \"in\" và không hợp nghĩa."),
  mc(0, "MEDIUM", leaflet(12), ["impact", "result", "cause", "reason"], "A",
    "Kết hợp từ \"have a big impact on something\": có tác động lớn đến điều gì. \"result\", \"cause\", \"reason\" không kết hợp với \"have … on\" theo nghĩa này."),

  // ── 13–17: arrangement ──
  mc(1, "EASY", arrange(13, [
    "a. Nam: Sure, I'd love to. What time does it start?",
    "b. Mai: Nam, would you like to join our book club meeting this Saturday?",
    "c. Mai: At 9 a.m. in the school library.",
  ]), ["b – a – c", "a – b – c", "c – a – b", "b – c – a"], "A",
    "Mai mở đầu bằng lời mời (b), Nam nhận lời và hỏi giờ bắt đầu (a), Mai trả lời thời gian và địa điểm (c). Thứ tự hợp lí: b – a – c."),
  mc(1, "MEDIUM", arrange(14, [
    "a. Lan: That sounds great, but isn't it expensive?",
    "b. Minh: Not really. Students get a 50% discount, so it's only about 200,000 dong a month.",
    "c. Minh: I've just joined the new gym near our school.",
    "d. Lan: Really? What made you decide to do that?",
    "e. Minh: I want to get fit before the school sports festival, and they offer free classes for beginners.",
  ]), ["c – d – e – a – b", "c – a – e – d – b", "c – d – b – a – e", "e – a – c – d – b"], "A",
    "Minh báo tin vừa đăng kí phòng tập (c) → Lan ngạc nhiên, hỏi lí do (d) → Minh giải thích muốn khỏe hơn và có lớp miễn phí (e) → Lan khen nhưng hỏi có đắt không (a) → Minh trả lời không đắt vì được giảm giá (b). Thứ tự hợp lí: c – d – e – a – b."),
  mc(1, "MEDIUM", arrange(15, [
    "Dear Ms Hoa,",
    "a. First, the bus will leave the school gate at 7 a.m. sharp, so please make sure your child arrives on time.",
    "b. I am writing to inform you about the Grade 11 field trip to the national park next Friday.",
    "c. Finally, students should bring a packed lunch, a water bottle and comfortable shoes.",
    "d. If you have any questions, please do not hesitate to contact me.",
    "e. Then, after a guided walk through the forest, we will return to school at around 5 p.m.",
    "Best regards,",
    "Tuan Nguyen (Class teacher)",
  ]), ["b – a – e – c – d", "b – e – a – c – d", "a – b – e – c – d", "b – a – c – e – d"], "A",
    "Thư mở đầu bằng mục đích viết thư (b), sau đó trình bày lần lượt theo các từ nối \"First\" (a) → \"Then\" (e) → \"Finally\" (c), và kết thư bằng lời mời liên hệ nếu có thắc mắc (d). Thứ tự hợp lí: b – a – e – c – d."),
  mc(1, "MEDIUM", arrange(16, [
    "a. As a result, they often feel tired and find it hard to concentrate in class the next day.",
    "b. Many teenagers use their smartphones late into the night.",
    "c. Experts therefore recommend switching off all screens at least an hour before going to bed.",
    "d. The blue light from these screens tricks the brain into thinking it is still daytime.",
    "e. This makes it more difficult for young people to fall asleep.",
  ]), ["b – d – e – a – c", "d – b – e – a – c", "b – d – a – e – c", "b – c – e – d – a"], "A",
    "Câu chủ đề nêu hiện tượng thiếu niên dùng điện thoại khuya (b) → \"these screens\" trong d chỉ màn hình điện thoại vừa nhắc, ánh sáng xanh đánh lừa não (d) → \"This\" khiến khó ngủ (e) → hệ quả \"As a result\" mệt mỏi hôm sau (a) → lời khuyên của chuyên gia \"therefore\" (c). Thứ tự hợp lí: b – d – e – a – c."),
  mc(1, "MEDIUM", arrange(17, [
    "a. However, the old building was too small to hold all the books donated by local people.",
    "b. Ten years ago, our village opened its first community library.",
    "c. Today, it welcomes more than two hundred readers every week, most of them children.",
    "d. Thanks to a fundraising campaign, a larger library was built next to the primary school in 2022.",
    "e. At first, it was just a single room in the village hall with a few hundred books.",
  ]), ["b – e – a – d – c", "b – a – e – d – c", "e – b – a – d – c", "b – d – e – a – c"], "A",
    "Đoạn văn kể theo trình tự thời gian: thư viện được mở mười năm trước (b) → lúc đầu chỉ là một phòng nhỏ (e) → \"However\" tòa nhà cũ quá nhỏ so với số sách được tặng (a) → nhờ gây quỹ, thư viện lớn hơn được xây năm 2022 (d) → \"Today\" mỗi tuần đón hơn 200 bạn đọc (c). Thứ tự hợp lí: b – e – a – d – c."),

  // ── 18–22: sentence gap-fill ──
  mc(2, "MEDIUM", rooftop(18), [
    "have turned these empty spaces into small gardens",
    "turning these empty spaces into small gardens",
    "who have turned these empty spaces into small gardens",
    "have moved away from these empty spaces to the countryside",
  ], "A",
    "Câu \"a growing number of residents …\" còn thiếu động từ chính, nên cần một vị ngữ đầy đủ: \"have turned these empty spaces into small gardens\". Dạng V-ing và mệnh đề quan hệ \"who …\" khiến câu không có động từ chính; phương án nói về việc chuyển về nông thôn thì không khớp với câu sau \"These rooftop gardens …\"."),
  mc(2, "MEDIUM", rooftop(19), [
    "which helps to keep the rooms underneath cooler",
    "that helps to keep the rooms underneath cooler",
    "which makes the rooms underneath much hotter",
    "helps to keep the rooms underneath cooler",
  ], "A",
    "Sau dấu phẩy cần mệnh đề quan hệ không xác định với \"which\" thay cho cả mệnh đề trước (việc cây hấp thụ nhiệt): \"which helps to keep the rooms underneath cooler\". \"that\" không dùng sau dấu phẩy; thiếu \"which\" thì thành lỗi nối hai mệnh đề bằng dấu phẩy; \"much hotter\" trái với ý đoạn văn (mái xanh mát hơn)."),
  mc(2, "MEDIUM", rooftop(20), [
    "who started a shared garden on their roof two years ago",
    "started a shared garden on their roof two years ago",
    "which started a shared garden on their roof two years ago",
    "who refused to share the roof with their neighbours",
  ], "A",
    "Câu đã có động từ chính \"now meet\", nên chỗ trống là mệnh đề quan hệ bổ nghĩa cho \"residents\" (chỉ người → \"who\"): \"who started a shared garden on their roof two years ago\". Thiếu \"who\" sẽ có hai động từ chính; \"which\" không dùng cho người; \"refused to share the roof\" mâu thuẫn với việc cùng nhau tưới cây, chia sẻ thu hoạch."),
  mc(2, "MEDIUM", rooftop(21), ["Before the garden was created", "Since the garden was created", "After the garden had been created", "Although the garden was created"], "A",
    "Mệnh đề chính dùng quá khứ hoàn thành \"had never spoken to one another\" diễn tả việc trước một mốc quá khứ, và ý đoạn văn là khu vườn đã gắn kết hàng xóm. Vì vậy: \"Before the garden was created, many of them had never spoken to one another\". \"After …\"/\"Since …\" mâu thuẫn với việc nay họ gặp nhau hằng tuần; \"Although\" không có quan hệ nhượng bộ."),
  mc(2, "MEDIUM", rooftop(22), [
    "whether the building can support the extra load",
    "whether can the building support the extra load",
    "how much the plants will cost at the market",
    "whether the residents enjoy gardening at weekends",
  ], "A",
    "Câu trước nói khu vườn rất nặng, nên kĩ sư phải kiểm tra \"whether the building can support the extra load\" (tòa nhà có chịu được tải trọng tăng thêm không). Trong câu hỏi gián tiếp không đảo trợ động từ (\"whether can the building\" sai); hai phương án về giá cây và sở thích làm vườn không liên quan đến trọng lượng."),

  // ── 23–30: reading 1 ──
  mc(3, "MEDIUM", crafts("Question 23: Which of the following is NOT mentioned in paragraph 1 as a product of traditional craft villages?"), ["jewellery", "silk", "lacquerware", "pottery"], "A",
    "Đoạn 1 liệt kê \"pottery, silk, lacquerware and bamboo products\". \"jewellery\" (đồ trang sức) không được nhắc đến."),
  mc(3, "MEDIUM", crafts("Question 24: The word \"dominate\" in paragraph 1 is closest in meaning to _______."), ["control", "avoid", "damage", "follow"], "A",
    "\"cheap factory-made goods now dominate the market\" = hàng công nghiệp giá rẻ đang chiếm lĩnh/chi phối thị trường. \"dominate\" gần nghĩa nhất với \"control\" (kiểm soát, chi phối)."),
  mc(3, "MEDIUM", crafts("Question 25: The word \"they\" in paragraph 1 refers to _______."), ["young people", "families", "the cities", "factory-made goods"], "A",
    "\"many young people prefer to move to the cities, where they can find better-paid jobs\" — người tìm được việc lương cao hơn ở thành phố là \"young people\"."),
  mc(3, "MEDIUM", crafts("Question 26: The word \"eager\" in paragraph 2 is OPPOSITE in meaning to _______."), ["unwilling", "keen", "enthusiastic", "impatient"], "A",
    "\"eager to see\" = háo hức, rất muốn xem. Từ trái nghĩa là \"unwilling\" (không muốn, miễn cưỡng). \"keen\" và \"enthusiastic\" là từ gần nghĩa; \"impatient\" (nóng lòng) cũng không phải từ trái nghĩa."),
  mc(3, "MEDIUM", crafts("Question 27: Which of the following best paraphrases this sentence in paragraph 4?\n\"Local leaders therefore stress that tourism should support the crafts, not replace them.\""), [
    "According to local leaders, tourism should help the crafts survive rather than take their place.",
    "Local leaders believe that tourism has already replaced the traditional crafts.",
    "Local leaders want the crafts to be replaced by more modern forms of tourism.",
    "Local leaders insist that tourism and the crafts cannot exist together.",
  ], "A",
    "Câu gốc: lãnh đạo địa phương nhấn mạnh du lịch nên hỗ trợ nghề thủ công chứ không thay thế nó. Câu diễn đạt lại đúng: \"tourism should help the crafts survive rather than take their place\" (\"take their place\" = \"replace them\"). Các phương án còn lại đều nói du lịch đã/nên thay thế nghề hoặc không thể cùng tồn tại — trái với câu gốc."),
  mc(3, "MEDIUM", crafts("Question 28: Which of the following is TRUE according to the passage?"), [
    "Some young artisans now sell their handmade products online.",
    "Tourists are not allowed to make their own souvenirs.",
    "Factory-made goods are more expensive than handmade ones.",
    "All workshops have stopped producing artistic items.",
  ], "A",
    "Đoạn 3: \"Some young artisans have even opened online shops, selling handmade products to customers around the world\" — nên ý \"một số nghệ nhân trẻ bán sản phẩm thủ công qua mạng\" là đúng. Đoạn 2 cho biết du khách có thể tự làm đồ lưu niệm; đoạn 1 nói hàng công nghiệp \"cheap\" (rẻ); đoạn 4 chỉ nói \"some workshops\", không phải tất cả."),
  mc(3, "MEDIUM", crafts("Question 29: In which paragraph does the writer mention a concern about the quality of craft products?"), ["Paragraph 4", "Paragraph 1", "Paragraph 2", "Paragraph 3"], "A",
    "Đoạn 4 nêu lo ngại một số xưởng làm ra sản phẩm đơn giản, giống hệt nhau và nghề thủ công có thể mất đi giá trị nghệ thuật (\"lose their artistic value\") — đó là mối lo về chất lượng sản phẩm."),
  mc(3, "MEDIUM", crafts("Question 30: It can be inferred from the passage that _______."), [
    "the future of craft villages depends on balancing tourism with traditional skills",
    "tourism has solved all the problems faced by craft villages",
    "young people in craft villages are no longer interested in tourism",
    "foreign visitors are the only customers of craft villages",
  ], "A",
    "Bài viết nêu cả lợi ích (đoạn 3) lẫn nguy cơ mất tính chân thực (đoạn 4) của du lịch, và nhấn mạnh du lịch phải hỗ trợ chứ không thay thế nghề. Do đó có thể suy ra tương lai của làng nghề phụ thuộc vào việc cân bằng giữa du lịch và kĩ năng truyền thống. Các phương án khác mâu thuẫn với bài (du lịch vẫn có vấn đề; người trẻ mở cửa hàng trực tuyến; khách gồm cả gia đình thành thị và khách mua hàng trên mạng)."),

  // ── 31–40: reading 2 ──
  mc(3, "HARD", aiTutors("Question 31: Where in the passage does the following sentence best fit?\n\"For example, a program might give the wrong date for a historical event or make an error in a calculation while explaining each step with great confidence.\""), ["[III]", "[I]", "[II]", "[IV]"], "A",
    "Câu cần chèn là ví dụ (\"For example\") cho ý AI đưa ra câu trả lời nghe có vẻ thuyết phục nhưng sai (\"answers that sound convincing but are simply wrong\") ở đoạn 3, nên đặt tại vị trí [III]. Các vị trí còn lại đứng sau những câu không nói về lỗi sai của AI."),
  mc(3, "MEDIUM", aiTutors("Question 32: The word \"convincing\" in paragraph 3 is closest in meaning to _______."), ["believable", "confusing", "complicated", "unusual"], "A",
    "\"answers that sound convincing but are simply wrong\" = câu trả lời nghe có vẻ đáng tin nhưng thực ra sai. \"convincing\" gần nghĩa nhất với \"believable\" (đáng tin, có sức thuyết phục)."),
  mc(3, "MEDIUM", aiTutors("Question 33: The word \"they\" in paragraph 1 refers to _______."), ["AI tutors", "educators", "young people", "schools and homes"], "A",
    "\"AI tutors are spreading rapidly in schools and homes, and many educators believe they could change the way young people learn\" — thứ có thể thay đổi cách người trẻ học là \"AI tutors\"."),
  mc(3, "MEDIUM", aiTutors("Question 34: Which of the following best summarises paragraph 2?"), [
    "AI tutors can give each learner patient, individual support that one teacher cannot easily provide in a large class.",
    "Teachers in large classes no longer need to check their students' understanding.",
    "Shy students learn better in classes of forty than in small groups.",
    "AI tutors make students feel embarrassed when they repeat a lesson.",
  ], "A",
    "Đoạn 2 so sánh: giáo viên lớp 40 học sinh không thể theo sát từng em, còn gia sư AI điều chỉnh bài tập cho từng người, phản hồi ngay và kiên nhẫn — tức là hỗ trợ cá nhân hóa mà một giáo viên khó làm được trong lớp đông. Các phương án khác sai ý (giáo viên vẫn cần kiểm tra; không so sánh quy mô lớp với học sinh nhút nhát; học sinh học lại \"without feeling embarrassed\")."),
  mc(3, "MEDIUM", aiTutors("Question 35: According to paragraph 3, which of the following is NOT a concern about AI tutors?"), [
    "They will cause many teachers to lose their jobs.",
    "They sometimes give answers that are wrong.",
    "They may make students give up too easily on difficult tasks.",
    "They may leave students from poorer families further behind.",
  ], "A",
    "Đoạn 3 nêu ba lo ngại: AI đôi khi trả lời sai, người học dễ bỏ cuộc khi gặp bài khó, và khoảng cách giàu – nghèo có thể tăng. Việc giáo viên mất việc không được nhắc đến; đoạn 4 còn khẳng định giáo viên vẫn rất cần thiết."),
  mc(3, "HARD", aiTutors("Question 36: The word \"persistence\" in paragraph 3 is closest in meaning to _______."), ["determination", "intelligence", "curiosity", "confidence"], "A",
    "\"learners may give up too quickly … and so never develop the persistence that real learning requires\" — \"persistence\" là sự kiên trì, bền bỉ không bỏ cuộc, đối lập với \"give up too quickly\". Gần nghĩa nhất là \"determination\" (quyết tâm, kiên định)."),
  mc(3, "MEDIUM", aiTutors("Question 37: Which of the following is TRUE according to the passage?"), [
    "Most experts think AI tools should be used carefully rather than banned.",
    "AI tutors can only be used in schools.",
    "Teachers will become less important as AI tutors spread.",
    "AI tutors never make mistakes when they explain their answers.",
  ], "A",
    "Đoạn 4: \"Most experts agree that the answer is not to ban these tools but to use them wisely\" — khớp với ý chuyên gia cho rằng nên dùng thận trọng thay vì cấm. Đoạn 1 nói AI có trên điện thoại, ở cả trường và nhà; đoạn 4 khẳng định \"Teachers remain essential\"; đoạn 3 nói AI đôi khi trả lời sai."),
  mc(3, "MEDIUM", aiTutors("Question 38: According to paragraph 2, why can an AI tutor be especially helpful for shy students?"), [
    "They can practise in private and repeat lessons without feeling embarrassed.",
    "They no longer have to do any homework.",
    "They can spend more time talking to their classmates.",
    "They are given higher marks than other students.",
  ], "A",
    "Đoạn 2: AI cho phép học lại bài nhiều lần \"without feeling embarrassed\", và \"For shy students … this patient and private support can be especially valuable\". Vì vậy học sinh nhút nhát được lợi vì có thể luyện tập riêng tư, học lại mà không ngại. Các phương án còn lại không có trong bài."),
  mc(3, "HARD", aiTutors("Question 39: It can be inferred from paragraph 4 that the writer believes _______."), [
    "students should learn to balance help from AI with their own thinking",
    "students should stop using AI tutors completely",
    "AI tutors will soon provide the human connection that teachers offer",
    "teachers should let AI programs design all classroom tasks",
  ], "A",
    "Câu cuối đoạn 4: người học thành công nhất là người biết khi nào nhờ máy giúp và khi nào dựa vào trí óc của chính mình — tức là cần cân bằng giữa sự trợ giúp của AI và tư duy độc lập. Tác giả không ủng hộ cấm AI, khẳng định không chương trình nào thay thế được sự kết nối con người, và giáo viên là người thiết kế nhiệm vụ."),
  mc(3, "HARD", aiTutors("Question 40: Which of the following best summarises the passage?"), [
    "AI tutors offer real benefits for personalised learning but also have limitations, so they should be used wisely with the guidance of teachers.",
    "AI tutors are a dangerous technology that should be removed from schools as soon as possible.",
    "AI tutors have already replaced teachers in most classrooms around the world.",
    "AI tutors are useful only for students from wealthy families who can afford modern devices.",
  ], "A",
    "Bài viết giới thiệu sự phổ biến của gia sư AI (đoạn 1), lợi ích hỗ trợ cá nhân hóa (đoạn 2), các hạn chế (đoạn 3) và kết luận nên sử dụng khôn ngoan, giáo viên vẫn giữ vai trò thiết yếu (đoạn 4). Câu tóm tắt đầy đủ nhất là câu nêu cả lợi ích, hạn chế và cách dùng hợp lí cùng giáo viên; các phương án khác hoặc cực đoan, hoặc sai sự thật, hoặc chỉ nói một chi tiết."),
];

export const TIENG_ANH_EXAM: DemoExam = {
  slug: "tieng-anh",
  subjectName: "Tiếng Anh",
  title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Tiếng Anh",
  durationMinutes: 50,
  shortAnswerPoints: "0.25",
  topics: TOPICS,
  description: `${DEMO_NOTE}\nCấu trúc: 40 câu trắc nghiệm nhiều lựa chọn (0,25 điểm/câu) gồm điền từ vào quảng cáo và tờ rơi (câu 1–12), sắp xếp hội thoại – thư – đoạn văn (câu 13–17), điền cụm từ/câu vào đoạn văn (câu 18–22) và hai bài đọc hiểu (câu 23–30, câu 31–40). Thời gian làm bài: 50 phút.`,
  questions: QUESTIONS,
};
