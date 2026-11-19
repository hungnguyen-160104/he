/**
 * DEMO mock exam for Giáo dục kinh tế và pháp luật (THPT graduation exam format from 2025): part I has
 * 24 single-choice questions (0.25 point each), part II has 4 true/false questions (up to 1 point each),
 * no part III, 50 minutes. Content follows the GDKT&PL 12 curriculum (with a few grade 10–11 items).
 * These are original practice items, not official exam content.
 */
import { createBuilders, DEMO_NOTE, type DemoExam, type DemoQuestion } from "./builders";

const { mc, tf } = createBuilders();

const TOPICS = [
  "Tăng trưởng và phát triển kinh tế",
  "Hội nhập kinh tế quốc tế",
  "Bảo hiểm và an sinh xã hội",
  "Kinh doanh, trách nhiệm xã hội, quản lí thu chi",
  "Quyền và nghĩa vụ của công dân về kinh tế",
  "Quyền và nghĩa vụ về văn hóa – xã hội, hôn nhân và gia đình",
  "Pháp luật quốc tế",
];

const QUESTIONS: DemoQuestion[] = [
  // ── Phần I (24 câu) ──
  mc(0, "EASY", "Sự gia tăng về quy mô sản lượng của nền kinh tế trong một thời kì nhất định so với kì gốc, thường được đo bằng mức tăng của tổng sản phẩm quốc nội (GDP) hoặc tổng thu nhập quốc dân (GNI), được gọi là", [
    "tăng trưởng kinh tế",
    "phát triển kinh tế",
    "hội nhập kinh tế quốc tế",
    "chuyển dịch cơ cấu kinh tế",
  ], "A",
    "Tăng trưởng kinh tế là sự gia tăng quy mô sản lượng của nền kinh tế (GDP, GNI) trong một thời kì so với kì gốc. Phát triển kinh tế có nội hàm rộng hơn: tăng trưởng kinh tế gắn với chuyển dịch cơ cấu kinh tế hợp lí, tiến bộ và tiến bộ xã hội."),
  mc(0, "EASY", "Chỉ tiêu nào sau đây được sử dụng để đánh giá mức độ phát triển con người của một quốc gia, tổng hợp từ ba khía cạnh: sức khỏe (tuổi thọ), giáo dục và mức sống (thu nhập)?", [
    "Chỉ số phát triển con người (HDI)",
    "Tổng sản phẩm quốc nội (GDP)",
    "Chỉ số giá tiêu dùng (CPI)",
    "Tốc độ tăng trưởng kinh tế",
  ], "A",
    "HDI là chỉ số tổng hợp phản ánh tuổi thọ, trình độ giáo dục và thu nhập bình quân. GDP và tốc độ tăng trưởng phản ánh quy mô, mức tăng sản lượng; CPI phản ánh sự biến động giá cả hàng tiêu dùng."),
  mc(1, "EASY", "Việc Việt Nam trở thành thành viên của Tổ chức Thương mại Thế giới (WTO) năm 2007 là biểu hiện của hội nhập kinh tế quốc tế ở cấp độ", [
    "toàn cầu",
    "khu vực",
    "song phương",
    "địa phương",
  ], "A",
    "Hội nhập kinh tế quốc tế diễn ra ở các cấp độ song phương (giữa hai quốc gia), khu vực (ví dụ trong khuôn khổ ASEAN) và toàn cầu. WTO là tổ chức thương mại có phạm vi toàn cầu nên việc gia nhập WTO là hội nhập ở cấp độ toàn cầu."),
  mc(1, "EASY", "Tập đoàn Z của nước ngoài bỏ vốn xây dựng nhà máy sản xuất linh kiện điện tử tại Việt Nam và trực tiếp quản lí, điều hành hoạt động của nhà máy. Đây là hình thức", [
    "đầu tư trực tiếp nước ngoài",
    "đầu tư gián tiếp nước ngoài",
    "viện trợ phát triển không hoàn lại",
    "nhập khẩu hàng hóa từ nước ngoài",
  ], "A",
    "Nhà đầu tư nước ngoài bỏ vốn và trực tiếp tham gia quản lí, điều hành dự án là đầu tư trực tiếp nước ngoài (FDI). Đầu tư gián tiếp là hình thức mua cổ phiếu, trái phiếu… mà nhà đầu tư không trực tiếp quản lí hoạt động sản xuất, kinh doanh."),
  mc(2, "EASY", "Anh T làm việc theo hợp đồng lao động tại một công ty và tham gia bảo hiểm xã hội bắt buộc. Khi vợ sinh con, anh T được nghỉ việc và hưởng trợ cấp theo quy định. Anh T đang được hưởng chế độ nào của bảo hiểm xã hội?", [
    "Chế độ thai sản",
    "Chế độ ốm đau",
    "Chế độ hưu trí",
    "Chế độ tử tuất",
  ], "A",
    "Lao động nam đang đóng bảo hiểm xã hội bắt buộc được nghỉ việc hưởng chế độ thai sản khi vợ sinh con. Chế độ ốm đau dành cho trường hợp người lao động bị ốm; hưu trí khi đủ điều kiện về tuổi và thời gian đóng; tử tuất khi người tham gia qua đời."),
  mc(2, "EASY", "Chị M tham gia bảo hiểm thất nghiệp đủ thời gian theo quy định. Sau khi chấm dứt hợp đồng lao động đúng pháp luật và chưa tìm được việc làm, chị được hưởng trợ cấp hằng tháng và được hỗ trợ học nghề. Chị M đang được hưởng quyền lợi của loại hình bảo hiểm nào?", [
    "Bảo hiểm thất nghiệp",
    "Bảo hiểm y tế",
    "Bảo hiểm nhân thọ",
    "Bảo hiểm tài sản",
  ], "A",
    "Bảo hiểm thất nghiệp bù đắp một phần thu nhập cho người lao động khi bị mất việc làm (trợ cấp thất nghiệp), đồng thời hỗ trợ tư vấn, giới thiệu việc làm và học nghề để sớm quay lại thị trường lao động."),
  mc(3, "EASY", "Trước khi mở cửa hàng bánh mì, anh P khảo sát nhu cầu của người dân trong khu vực, tìm hiểu các cửa hàng cùng loại ở xung quanh và giá thuê mặt bằng. Việc làm của anh P thuộc nội dung nào khi lập kế hoạch kinh doanh?", [
    "Phân tích môi trường kinh doanh",
    "Phân chia lợi nhuận cho các thành viên",
    "Đánh giá kết quả kinh doanh cuối năm",
    "Thực hiện nghĩa vụ nộp thuế",
  ], "A",
    "Tìm hiểu nhu cầu khách hàng, đối thủ cạnh tranh và chi phí mặt bằng là phân tích môi trường kinh doanh, giúp nhận ra thuận lợi, khó khăn, cơ hội và thách thức trước khi xác định mục tiêu, chiến lược kinh doanh."),
  mc(4, "EASY", "Theo Hiến pháp năm 2013, mọi người có quyền tự do kinh doanh trong những ngành nghề mà pháp luật", [
    "không cấm",
    "cho phép",
    "khuyến khích",
    "ưu tiên phát triển",
  ], "A",
    "Hiến pháp năm 2013 quy định mọi người có quyền tự do kinh doanh trong những ngành nghề mà pháp luật không cấm. Như vậy, phạm vi tự do kinh doanh rất rộng, chỉ bị giới hạn bởi những ngành nghề bị pháp luật cấm."),
  mc(4, "EASY", "Trên đường đi học về, bạn Q nhặt được một chiếc ví có tiền và giấy tờ tùy thân của người khác. Để thực hiện đúng nghĩa vụ tôn trọng tài sản của người khác, Q cần", [
    "tìm cách trả lại cho người bị mất hoặc giao nộp cho cơ quan có thẩm quyền",
    "giữ lại số tiền và gửi trả giấy tờ cho người bị mất qua đường bưu điện",
    "giữ lại toàn bộ vì người đánh rơi phải tự chịu trách nhiệm về tài sản của mình",
    "chia số tiền cho các bạn cùng đi để mọi người cùng giữ bí mật",
  ], "A",
    "Pháp luật dân sự quy định người nhặt được tài sản bị đánh rơi phải thông báo hoặc trả lại cho chủ sở hữu; nếu không biết chủ sở hữu thì phải thông báo hoặc giao nộp cho cơ quan có thẩm quyền (công an hoặc chính quyền cấp xã nơi gần nhất). Giữ lại tiền hay chia nhau đều là chiếm giữ trái phép tài sản của người khác."),
  mc(5, "EASY", "Bạn H là học sinh người dân tộc thiểu số ở vùng có điều kiện kinh tế – xã hội đặc biệt khó khăn được miễn học phí và được hưởng chính sách hỗ trợ học tập theo quy định của Nhà nước. Điều này thể hiện việc bảo đảm quyền nào của công dân?", [
    "Quyền học tập",
    "Quyền tự do kinh doanh",
    "Quyền sở hữu tài sản",
    "Quyền tự do ngôn luận",
  ], "A",
    "Công dân có quyền và nghĩa vụ học tập. Nhà nước thực hiện các chính sách miễn, giảm học phí và hỗ trợ học sinh dân tộc thiểu số, học sinh ở vùng khó khăn để bảo đảm mọi công dân đều có cơ hội học tập."),
  mc(6, "EASY", "Theo Công ước của Liên hợp quốc về Luật biển năm 1982, lãnh hải là vùng biển có chiều rộng không vượt quá bao nhiêu hải lí tính từ đường cơ sở?", [
    "12 hải lí",
    "24 hải lí",
    "200 hải lí",
    "350 hải lí",
  ], "A",
    "Lãnh hải rộng không quá 12 hải lí tính từ đường cơ sở. Vùng tiếp giáp lãnh hải kéo dài đến 24 hải lí, vùng đặc quyền kinh tế đến 200 hải lí tính từ đường cơ sở; thềm lục địa có thể được mở rộng ra ngoài 200 hải lí trong một số trường hợp theo quy định của Công ước Liên hợp quốc về Luật biển năm 1982, nhưng đó không phải là chiều rộng của lãnh hải."),
  mc(0, "MEDIUM", "Đọc thông tin: Trong 5 năm, tổng sản phẩm trên địa bàn (GRDP) của tỉnh X tăng trung bình 9%/năm. Tuy nhiên, nhiều cơ sở sản xuất xả thải gây ô nhiễm nguồn nước, chênh lệch thu nhập giữa thành thị và nông thôn ngày càng lớn, tỉ lệ học sinh bỏ học ở các xã vùng sâu chưa giảm.\nThông tin trên cho thấy tỉnh X", [
    "có tăng trưởng kinh tế nhưng chưa bảo đảm phát triển bền vững",
    "đã đạt được sự phát triển bền vững về mọi mặt",
    "không đạt được tăng trưởng kinh tế trong 5 năm",
    "chỉ chú trọng bảo vệ môi trường và tiến bộ xã hội",
  ], "A",
    "GRDP tăng đều cho thấy tỉnh X có tăng trưởng kinh tế. Tuy nhiên, phát triển bền vững đòi hỏi kết hợp hài hòa tăng trưởng kinh tế với bảo đảm tiến bộ, công bằng xã hội và bảo vệ môi trường; ô nhiễm, chênh lệch thu nhập và tình trạng bỏ học cho thấy tỉnh X chưa đạt được điều đó."),
  mc(1, "MEDIUM", "Nhờ các hiệp định thương mại tự do mà Việt Nam tham gia, nhiều mặt hàng nông sản của doanh nghiệp K được giảm hoặc xóa bỏ thuế nhập khẩu khi xuất khẩu sang thị trường các nước đối tác, nhờ đó doanh nghiệp tăng được số lượng đơn hàng. Thông tin trên thể hiện tác động tích cực nào của hội nhập kinh tế quốc tế?", [
    "Mở rộng thị trường, tạo điều kiện thúc đẩy xuất khẩu",
    "Làm tăng sức ép cạnh tranh đối với doanh nghiệp trong nước",
    "Làm gia tăng sự phụ thuộc vào nguồn vốn từ nước ngoài",
    "Hạn chế khả năng tiếp cận khoa học, công nghệ hiện đại",
  ], "A",
    "Việc cắt giảm, xóa bỏ thuế quan theo các hiệp định thương mại tự do giúp hàng hóa Việt Nam thâm nhập thị trường nước ngoài dễ hơn, tức là mở rộng thị trường và thúc đẩy xuất khẩu. Sức ép cạnh tranh hay nguy cơ phụ thuộc là những thách thức của hội nhập, không phải điều được nêu trong thông tin."),
  mc(2, "MEDIUM", "Chị L tự nguyện kí hợp đồng mua bảo hiểm vật chất cho chiếc ô tô của mình với một doanh nghiệp bảo hiểm và đóng phí theo thỏa thuận trong hợp đồng. Chị L đã tham gia loại hình bảo hiểm nào?", [
    "Bảo hiểm thương mại",
    "Bảo hiểm xã hội bắt buộc",
    "Bảo hiểm y tế",
    "Bảo hiểm thất nghiệp",
  ], "A",
    "Bảo hiểm thương mại do doanh nghiệp bảo hiểm cung cấp, hoạt động kinh doanh vì mục tiêu lợi nhuận và được thực hiện trên cơ sở hợp đồng bảo hiểm. Bảo hiểm vật chất xe là loại tự nguyện; bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp do Nhà nước tổ chức, không vì mục tiêu lợi nhuận."),
  mc(4, "MEDIUM", "Chị K kinh doanh tạp hóa và nộp thuế đầy đủ, đúng hạn. Anh S bán hàng trực tuyến có doanh thu lớn nhưng không kê khai để trốn thuế. Ông D đề nghị cơ quan thuế giải thích cách tính thuế đối với hộ kinh doanh. Bà E cố ý kê khai doanh thu thấp hơn thực tế để giảm số thuế phải nộp. Những ai dưới đây đã vi phạm nghĩa vụ nộp thuế?", [
    "Anh S và bà E",
    "Chị K và anh S",
    "Ông D và bà E",
    "Anh S, ông D và bà E",
  ], "A",
    "Không kê khai doanh thu để trốn thuế (anh S) và cố ý kê khai doanh thu thấp hơn thực tế (bà E) là vi phạm nghĩa vụ nộp thuế. Chị K thực hiện đúng nghĩa vụ; ông D thực hiện quyền của người nộp thuế được cơ quan thuế giải thích, hướng dẫn về các quy định thuế."),
  mc(5, "MEDIUM", "Khi đào móng xây nhà trên mảnh đất của gia đình, ông K phát hiện một số đồ gốm nghi là cổ vật. Theo quy định của pháp luật về di sản văn hóa, ông K cần", [
    "giữ nguyên hiện trạng và thông báo kịp thời cho cơ quan nhà nước có thẩm quyền",
    "tự mang số đồ gốm đi bán cho những người sưu tầm cổ vật",
    "tiếp tục đào để tìm thêm cổ vật rồi mới quyết định có thông báo hay không",
    "giữ lại làm tài sản riêng vì đồ vật được tìm thấy trên đất của gia đình",
  ], "A",
    "Pháp luật về di sản văn hóa quy định tổ chức, cá nhân phát hiện di vật, cổ vật phải bảo vệ nguyên trạng và thông báo kịp thời cho cơ quan nhà nước có thẩm quyền. Việc tự ý chiếm giữ, mua bán hoặc tiếp tục đào bới có thể làm hư hại, thất thoát di sản và vi phạm nghĩa vụ bảo vệ di sản văn hóa."),
  mc(5, "MEDIUM", "Anh A 19 tuổi, chị B 18 tuổi; cả hai tự nguyện quyết định kết hôn, không bị mất năng lực hành vi dân sự và không thuộc các trường hợp cấm kết hôn. Theo Luật Hôn nhân và gia đình năm 2014, việc kết hôn của anh A và chị B", [
    "chưa đủ điều kiện vì anh A chưa đủ 20 tuổi",
    "đủ điều kiện vì cả hai đã đủ 18 tuổi",
    "chưa đủ điều kiện vì chị B chưa đủ 20 tuổi",
    "đủ điều kiện nếu được cha mẹ hai bên đồng ý",
  ], "A",
    "Luật Hôn nhân và gia đình năm 2014 quy định độ tuổi kết hôn: nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên. Chị B đã đủ tuổi nhưng anh A mới 19 tuổi nên chưa đủ điều kiện; sự đồng ý của cha mẹ không thay thế được điều kiện về độ tuổi."),
  mc(5, "MEDIUM", "Ông P mắc một bệnh truyền nhiễm thuộc diện phải cách li y tế theo quy định nhưng đã tự ý rời khỏi nơi cách li để đi dự tiệc đông người. Hành vi của ông P đã vi phạm", [
    "nghĩa vụ thực hiện các quy định về phòng bệnh, khám bệnh, chữa bệnh",
    "quyền được bảo vệ, chăm sóc sức khỏe của chính ông P",
    "nghĩa vụ bảo vệ di sản văn hóa của công dân",
    "quyền tự do đi lại và cư trú của những người dự tiệc",
  ], "A",
    "Công dân có quyền được bảo vệ, chăm sóc sức khỏe, đồng thời có nghĩa vụ thực hiện các quy định về phòng bệnh, khám bệnh, chữa bệnh. Tự ý rời nơi cách li khi mắc bệnh truyền nhiễm là vi phạm nghĩa vụ này và có thể làm lây lan dịch bệnh, ảnh hưởng đến sức khỏe cộng đồng."),
  mc(6, "MEDIUM", "Bộ phận nào sau đây không thuộc lãnh thổ quốc gia của một quốc gia ven biển?", [
    "Vùng đặc quyền kinh tế",
    "Nội thủy",
    "Lãnh hải",
    "Vùng trời phía trên lãnh hải",
  ], "A",
    "Lãnh thổ quốc gia gồm vùng đất, vùng nước (trong đó có nội thủy và lãnh hải), vùng lòng đất và vùng trời phía trên các vùng đó; quốc gia có chủ quyền đối với lãnh thổ. Trong vùng đặc quyền kinh tế, quốc gia ven biển chỉ có quyền chủ quyền và quyền tài phán theo luật biển quốc tế, nên vùng này không thuộc lãnh thổ quốc gia."),
  mc(3, "HARD", "Gia đình anh H có tổng thu nhập 25 triệu đồng/tháng. Theo kế hoạch, gia đình chi 15 triệu đồng cho các khoản thiết yếu (ăn uống, điện nước, học tập…), 4 triệu đồng cho các khoản không thiết yếu, số tiền còn lại dành để tiết kiệm. Tháng này, giá điện, nước tăng khiến khoản chi thiết yếu tăng thêm 1,5 triệu đồng. Để vẫn giữ nguyên số tiền tiết kiệm theo kế hoạch, cách điều chỉnh hợp lí nhất là", [
    "giảm chi không thiết yếu xuống còn 2,5 triệu đồng",
    "giảm chi không thiết yếu xuống còn 3,5 triệu đồng",
    "giảm chi thiết yếu xuống còn 13,5 triệu đồng",
    "giữ nguyên chi không thiết yếu, tiết kiệm còn 4,5 triệu đồng",
  ], "A",
    "Số tiền tiết kiệm theo kế hoạch: 25 – 15 – 4 = 6 triệu đồng. Chi thiết yếu mới: 15 + 1,5 = 16,5 triệu đồng (khoản thiết yếu cần được ưu tiên, không thể cắt giảm). Muốn tiết kiệm vẫn là 6 triệu đồng thì chi không thiết yếu chỉ còn 25 – 16,5 – 6 = 2,5 triệu đồng. Giữ nguyên chi không thiết yếu sẽ làm tiết kiệm giảm xuống 4,5 triệu đồng, không đạt mục tiêu."),
  mc(4, "HARD", "Ông T mở cửa hàng vật liệu xây dựng, đăng kí kinh doanh và nộp thuế đầy đủ. Trong thời gian ông T đi chữa bệnh dài ngày, con trai ông là anh V được giao trông coi cửa hàng đã tự ý nhập xi măng giả nhãn hiệu về bán để kiếm lời. Vợ anh V là chị G biết rõ nhưng vẫn đăng bài quảng cáo trên mạng xã hội rằng đó là hàng chính hãng. Một khách hàng là anh N phát hiện sự việc và báo cho cơ quan chức năng. Những ai dưới đây đã vi phạm nghĩa vụ của công dân trong hoạt động kinh doanh?", [
    "Anh V và chị G",
    "Ông T và anh V",
    "Ông T, anh V và chị G",
    "Anh V, chị G và anh N",
  ], "A",
    "Anh V kinh doanh hàng giả nhãn hiệu; chị G quảng cáo sai sự thật, lừa dối người tiêu dùng — cả hai đều vi phạm nghĩa vụ kinh doanh đúng pháp luật, bảo đảm chất lượng hàng hóa và bảo vệ quyền lợi người tiêu dùng. Ông T kinh doanh đúng pháp luật và không biết việc anh V tự ý làm; anh N tố giác vi phạm là hành vi đúng đắn."),
  mc(5, "HARD", "Vợ chồng anh C và chị D có một căn nhà là tài sản chung. Vì cần vốn kinh doanh, anh C tự ý làm thủ tục bán căn nhà mà không bàn bạc và không được chị D đồng ý. Theo pháp luật về hôn nhân và gia đình, nhận định nào sau đây là đúng?", [
    "Anh C vi phạm quyền bình đẳng giữa vợ và chồng trong quan hệ tài sản",
    "Anh C có quyền bán vì là người tạo ra thu nhập chính của gia đình",
    "Anh C chỉ vi phạm pháp luật nếu giấy tờ nhà đứng tên chị D",
    "Anh C vi phạm quyền bình đẳng giữa vợ và chồng trong quan hệ nhân thân",
  ], "A",
    "Vợ chồng bình đẳng với nhau về quyền và nghĩa vụ trong việc tạo lập, chiếm hữu, sử dụng, định đoạt tài sản chung; việc định đoạt nhà ở là tài sản chung phải có sự thỏa thuận của cả hai vợ chồng, không phụ thuộc vào việc ai tạo ra thu nhập nhiều hơn hay ai đứng tên. Hành vi của anh C liên quan đến tài sản nên vi phạm quan hệ tài sản, không phải quan hệ nhân thân."),
  mc(6, "HARD", "Một số tàu cá mang cờ của nước X vào vùng đặc quyền kinh tế của Việt Nam đánh bắt hải sản khi chưa được phép của Việt Nam. Theo Công ước của Liên hợp quốc về Luật biển năm 1982, hành vi này", [
    "xâm phạm quyền chủ quyền của Việt Nam đối với tài nguyên thiên nhiên trong vùng đặc quyền kinh tế",
    "là hợp pháp vì tàu thuyền các nước được hưởng quyền tự do hàng hải trong vùng đặc quyền kinh tế",
    "là hợp pháp vì vùng đặc quyền kinh tế là vùng biển quốc tế, không thuộc quyền tài phán của quốc gia ven biển",
    "chỉ bị coi là vi phạm khi các tàu cá đánh bắt trong vùng nội thủy của Việt Nam",
  ], "A",
    "Trong vùng đặc quyền kinh tế, quốc gia ven biển có quyền chủ quyền về thăm dò, khai thác, bảo tồn và quản lí tài nguyên thiên nhiên, cùng quyền tài phán theo Công ước. Các quốc gia khác chỉ được hưởng quyền tự do hàng hải, hàng không, đặt dây cáp và ống dẫn ngầm; đánh bắt hải sản khi chưa được phép là xâm phạm quyền chủ quyền của Việt Nam."),
  mc(6, "HARD", "Quốc gia B và quốc gia C đều là thành viên của Tổ chức Thương mại Thế giới (WTO). Quốc gia B áp dụng mức thuế tiêu thụ đặc biệt đối với rượu vang nhập khẩu từ quốc gia C cao hơn so với rượu vang cùng loại sản xuất trong nước. Việc làm của quốc gia B đã vi phạm nguyên tắc nào của WTO?", [
    "Nguyên tắc đối xử quốc gia (NT)",
    "Nguyên tắc đối xử tối huệ quốc (MFN)",
    "Nguyên tắc minh bạch",
    "Nguyên tắc ưu đãi dành cho các nước đang phát triển",
  ], "A",
    "Nguyên tắc đối xử quốc gia yêu cầu hàng hóa nhập khẩu, sau khi đã vào thị trường nội địa, không bị đối xử kém thuận lợi hơn hàng hóa cùng loại sản xuất trong nước (kể cả về thuế nội địa). Nguyên tắc đối xử tối huệ quốc liên quan đến việc không phân biệt đối xử giữa hàng hóa của các nước thành viên với nhau."),
  // ── Phần II (4 câu) ──
  tf(0, "MEDIUM", "Đọc thông tin sau:\nNăm vừa qua, tổng sản phẩm quốc nội (GDP) của quốc gia Y tăng 7% so với năm trước, trong khi quy mô dân số chỉ tăng khoảng 1%. Cơ cấu kinh tế tiếp tục chuyển dịch theo hướng tăng tỉ trọng công nghiệp và dịch vụ, giảm tỉ trọng nông nghiệp. Tuổi thọ trung bình và số năm đi học bình quân của người dân tăng lên, tỉ lệ hộ nghèo giảm. Tuy nhiên, tình trạng khai thác rừng trái phép và ô nhiễm không khí ở các đô thị lớn vẫn diễn biến phức tạp, làm suy giảm chất lượng môi trường sống của người dân.", [
    ["Mức tăng 7% của GDP phản ánh tăng trưởng kinh tế của quốc gia Y.", true],
    ["Do GDP tăng nhanh hơn dân số nên GDP bình quân đầu người của quốc gia Y tăng lên.", true],
    ["Tuổi thọ trung bình tăng và tỉ lệ hộ nghèo giảm là biểu hiện của tiến bộ xã hội, một nội dung của phát triển kinh tế.", true],
    ["Quốc gia Y đã đạt được phát triển bền vững vì có tốc độ tăng trưởng cao và cơ cấu kinh tế chuyển dịch hợp lí.", false],
  ], "a) Đúng: mức tăng GDP so với năm trước là thước đo tăng trưởng kinh tế.\nb) Đúng: GDP tăng 7% trong khi dân số tăng khoảng 1% nên GDP bình quân đầu người tăng (xấp xỉ 6%).\nc) Đúng: phát triển kinh tế gồm tăng trưởng kinh tế, chuyển dịch cơ cấu kinh tế hợp lí và tiến bộ xã hội; tuổi thọ, giáo dục, giảm nghèo phản ánh tiến bộ xã hội.\nd) Sai: phát triển bền vững còn đòi hỏi bảo vệ môi trường; tình trạng phá rừng, ô nhiễm không khí cho thấy quốc gia Y chưa bảo đảm yêu cầu này."),
  tf(2, "MEDIUM", "Đọc tình huống sau:\nAnh Q làm việc theo hợp đồng lao động không xác định thời hạn tại Công ty X. Hằng tháng, công ty trích một phần tiền lương của anh và cùng đóng bảo hiểm xã hội bắt buộc, bảo hiểm y tế, bảo hiểm thất nghiệp cho anh theo quy định. Vợ anh Q là chị P bán hàng tự do tại nhà, không có hợp đồng lao động; chị chủ động đăng kí tham gia bảo hiểm xã hội tự nguyện để khi về già có lương hưu. Ngoài ra, anh Q còn kí hợp đồng mua bảo hiểm nhân thọ cho con gái tại một doanh nghiệp bảo hiểm, đóng phí định kì theo thỏa thuận.", [
    ["Anh Q thuộc đối tượng tham gia bảo hiểm xã hội bắt buộc vì làm việc theo hợp đồng lao động không xác định thời hạn.", true],
    ["Chị P không làm việc theo hợp đồng lao động nên pháp luật không cho phép chị tham gia bảo hiểm xã hội.", false],
    ["Hợp đồng bảo hiểm nhân thọ anh Q mua cho con gái là một loại bảo hiểm thương mại, được tham gia trên cơ sở tự nguyện.", true],
    ["Bảo hiểm y tế mà anh Q tham gia do doanh nghiệp bảo hiểm kinh doanh nhằm mục tiêu lợi nhuận.", false],
  ], "a) Đúng: người lao động làm việc theo hợp đồng lao động không xác định thời hạn thuộc đối tượng tham gia bảo hiểm xã hội bắt buộc.\nb) Sai: người lao động tự do, không thuộc diện bắt buộc vẫn được tham gia bảo hiểm xã hội tự nguyện, như chị P đã làm.\nc) Đúng: bảo hiểm nhân thọ do doanh nghiệp bảo hiểm cung cấp trên cơ sở hợp đồng, là bảo hiểm thương mại, người mua tự nguyện tham gia.\nd) Sai: bảo hiểm y tế là chính sách an sinh do Nhà nước tổ chức thực hiện, không vì mục tiêu lợi nhuận."),
  tf(3, "HARD", "Đọc tình huống sau:\nCông ty cổ phần M chuyên sản xuất giấy. Để giảm chi phí, ban giám đốc chỉ đạo chỉ vận hành hệ thống xử lí nước thải vào ban ngày, còn ban đêm xả trực tiếp nước thải chưa qua xử lí ra sông. Cơ quan chức năng kiểm tra, xử phạt vi phạm hành chính và buộc công ty khắc phục hậu quả. Sau sự việc, công ty đầu tư hệ thống xử lí nước thải mới, công khai kết quả quan trắc môi trường, ưu tiên tuyển dụng lao động địa phương và trích một phần lợi nhuận hỗ trợ xây dựng trường học cho xã bên cạnh. Tuy vậy, một số cổ đông cho rằng khoản hỗ trợ xây trường học làm giảm lợi nhuận nên công ty không cần thực hiện.", [
    ["Việc xả nước thải chưa qua xử lí ra sông là vi phạm nghĩa vụ bảo vệ môi trường, thể hiện công ty chưa thực hiện trách nhiệm pháp lí của doanh nghiệp.", true],
    ["Việc hỗ trợ xây dựng trường học cho địa phương thể hiện trách nhiệm nhân văn (từ thiện) của doanh nghiệp.", true],
    ["Ý kiến của một số cổ đông là đúng vì mục tiêu duy nhất của doanh nghiệp là tối đa hóa lợi nhuận.", false],
    ["Sau khi đã nộp tiền phạt, công ty không còn nghĩa vụ phải khắc phục hậu quả ô nhiễm đã gây ra.", false],
  ], "a) Đúng: tuân thủ pháp luật về bảo vệ môi trường là nghĩa vụ bắt buộc, thuộc trách nhiệm pháp lí của doanh nghiệp; xả thải chưa qua xử lí là vi phạm.\nb) Đúng: tự nguyện đóng góp cho cộng đồng như xây trường học, làm từ thiện là trách nhiệm nhân văn của doanh nghiệp.\nc) Sai: bên cạnh mục tiêu lợi nhuận, doanh nghiệp còn có trách nhiệm xã hội; thực hiện tốt trách nhiệm xã hội giúp nâng cao uy tín, tạo dựng niềm tin và góp phần phát triển bền vững.\nd) Sai: việc nộp phạt không làm chấm dứt nghĩa vụ khắc phục hậu quả; công ty vẫn phải thực hiện các biện pháp khắc phục ô nhiễm theo quyết định của cơ quan có thẩm quyền."),
  tf(5, "HARD", "Đọc tình huống sau:\nAnh K và chị L kết hôn được ba năm và có một con trai hai tuổi. Anh K cho rằng chồng là trụ cột kinh tế nên mọi việc lớn trong gia đình phải do anh quyết định. Khi chị L muốn đăng kí học thạc sĩ vào buổi tối để nâng cao trình độ chuyên môn, anh K kiên quyết ngăn cản, yêu cầu chị nghỉ việc ở nhà chăm con vì cho rằng đó là việc của phụ nữ. Không đồng ý, chị L trao đổi thẳng thắn với chồng, đồng thời nhờ cán bộ hội phụ nữ ở địa phương tư vấn về quyền và nghĩa vụ của vợ chồng theo pháp luật.", [
    ["Việc anh K ngăn cản chị L đi học là vi phạm quyền bình đẳng giữa vợ và chồng trong quan hệ nhân thân.", true],
    ["Anh K có quyền quyết định mọi việc lớn trong gia đình vì anh là người tạo ra thu nhập chủ yếu.", false],
    ["Chị L chỉ được đi học khi có sự đồng ý của chồng vì vợ chồng phải thống nhất với nhau trong mọi việc.", false],
    ["Việc chăm sóc, nuôi dưỡng con chung là trách nhiệm riêng của người vợ.", false],
  ], "a) Đúng: pháp luật quy định vợ, chồng có nghĩa vụ tôn trọng, tạo điều kiện, giúp đỡ nhau học tập, nâng cao trình độ văn hóa, chuyên môn; ngăn cản vợ đi học là vi phạm quyền bình đẳng trong quan hệ nhân thân.\nb) Sai: vợ chồng bình đẳng, có quyền và nghĩa vụ ngang nhau về mọi mặt trong gia đình, không phụ thuộc vào thu nhập của mỗi người.\nc) Sai: học tập là quyền của công dân; vợ chồng cần bàn bạc, tôn trọng nhau, nhưng người chồng không có quyền ngăn cấm vợ thực hiện quyền học tập.\nd) Sai: cha và mẹ có quyền và nghĩa vụ ngang nhau trong việc chăm sóc, nuôi dưỡng, giáo dục con."),
];

export const GDKTPL_EXAM: DemoExam = {
  slug: "gdktpl",
  subjectName: "Giáo dục kinh tế và pháp luật",
  title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Giáo dục kinh tế và pháp luật",
  durationMinutes: 50,
  shortAnswerPoints: "0.25",
  topics: TOPICS,
  description: `${DEMO_NOTE}\nCấu trúc: Phần I – 24 câu trắc nghiệm nhiều lựa chọn (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu). Thời gian làm bài: 50 phút.`,
  questions: QUESTIONS,
};
