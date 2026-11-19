/**
 * DEMO mock exam for Địa lí (Vietnamese geography, grade 12, GDPT 2018 curriculum) in the THPT
 * graduation exam format from 2025: part I = 18 multiple-choice items, part II = 4 true/false items
 * (context paragraph or data table + 4 statements), part III = 6 numeric short-answer items computed
 * from given data; 50 minutes, no Atlat and no images. These are original practice items written for
 * testing the system, not official exam content.
 */
import { createBuilders, DEMO_NOTE, type DemoExam, type DemoQuestion } from "./builders";

const { mc, tf, sa } = createBuilders();

const TOPICS = [
  "Vị trí địa lí và phạm vi lãnh thổ",
  "Thiên nhiên Việt Nam",
  "Dân cư, lao động và đô thị hóa",
  "Nông nghiệp, lâm nghiệp và thủy sản",
  "Công nghiệp",
  "Dịch vụ",
  "Các vùng kinh tế và phát triển kinh tế biển, đảo",
];

const GIA_DINH = "(số liệu giả định, mang tính minh họa)";

const QUESTIONS: DemoQuestion[] = [
  // ── Phần I (18 câu) ──
  mc(0, "EASY", "Lãnh thổ Việt Nam nằm ở vị trí nào sau đây?", [
    "Rìa phía đông của bán đảo Đông Dương, gần trung tâm khu vực Đông Nam Á",
    "Rìa phía tây của bán đảo Đông Dương, tiếp giáp với Ấn Độ Dương",
    "Trung tâm của bán đảo Đông Dương, không tiếp giáp với biển",
    "Phía nam của khu vực Đông Nam Á hải đảo, gần đường Xích đạo",
  ], "A",
    "Việt Nam nằm ở rìa phía đông của bán đảo Đông Dương, gần trung tâm khu vực Đông Nam Á; phía đông và phía nam giáp Biển Đông."),
  mc(0, "EASY", "Do nằm hoàn toàn trong vùng nội chí tuyến bán cầu Bắc nên nước ta có", [
    "nền nhiệt độ cao, cán cân bức xạ quanh năm dương",
    "một mùa đông lạnh kéo dài trên phạm vi cả nước",
    "lượng mưa nhỏ, độ ẩm không khí thấp quanh năm",
    "nhiều loại khoáng sản với trữ lượng rất lớn",
  ], "A",
    "Trong vùng nội chí tuyến, Mặt Trời lên thiên đỉnh hai lần trong năm, góc nhập xạ lớn nên lượng bức xạ nhận được lớn, cán cân bức xạ luôn dương, nền nhiệt độ cao. Mùa đông lạnh chỉ có ở miền Bắc (do gió mùa Đông Bắc); lượng mưa và độ ẩm của nước ta lớn; khoáng sản liên quan đến lịch sử địa chất chứ không do vị trí nội chí tuyến."),
  mc(0, "EASY", "Theo Luật Biển Việt Nam, bộ phận nào của vùng biển nước ta có chế độ pháp lí như lãnh thổ trên đất liền?", [
    "Nội thủy",
    "Lãnh hải",
    "Vùng tiếp giáp lãnh hải",
    "Vùng đặc quyền kinh tế",
  ], "A",
    "Nội thủy là vùng nước tiếp giáp với bờ biển, ở phía trong đường cơ sở; Nhà nước thực hiện chủ quyền hoàn toàn, tuyệt đối và đầy đủ như trên lãnh thổ đất liền. Ở lãnh hải, tàu thuyền nước ngoài vẫn được hưởng quyền qua lại không gây hại; ở vùng tiếp giáp lãnh hải và vùng đặc quyền kinh tế, nước ta có quyền chủ quyền và quyền tài phán chứ không có chủ quyền đầy đủ."),
  mc(1, "EASY", "Gió mùa Đông Bắc hoạt động ở nước ta chủ yếu trong khoảng thời gian", [
    "từ tháng XI đến tháng IV năm sau",
    "từ tháng V đến tháng X",
    "từ tháng VI đến tháng IX",
    "từ tháng III đến tháng VIII",
  ], "A",
    "Gió mùa Đông Bắc (gió mùa mùa đông) xuất phát từ áp cao Xibia, hoạt động từ tháng XI đến tháng IV năm sau, tạo nên mùa đông lạnh ở miền Bắc. Từ tháng V đến tháng X là thời kì hoạt động của gió mùa mùa hạ."),
  mc(1, "MEDIUM", "Nguyên nhân chủ yếu làm cho thiên nhiên nước ta có sự phân hóa rõ rệt theo chiều Bắc – Nam là", [
    "ảnh hưởng của gió mùa Đông Bắc giảm dần về phía nam kết hợp với lượng bức xạ tăng theo chiều giảm vĩ độ",
    "sự khác biệt rất lớn về độ cao địa hình giữa phần lãnh thổ phía bắc và phần lãnh thổ phía nam",
    "khoảng cách tới biển của phần lãnh thổ phía bắc xa hơn nhiều so với phần lãnh thổ phía nam",
    "mạng lưới sông ngòi ở phía nam dày đặc hơn và có tổng lượng nước lớn hơn ở phía bắc",
  ], "A",
    "Lãnh thổ kéo dài theo vĩ độ: càng vào nam, góc nhập xạ càng lớn, lượng bức xạ tăng; đồng thời ảnh hưởng của gió mùa Đông Bắc yếu dần và hầu như kết thúc ở dãy Bạch Mã. Vì vậy phần lãnh thổ phía bắc có mùa đông lạnh, còn phần lãnh thổ phía nam nóng quanh năm, có hai mùa mưa – khô rõ rệt."),
  mc(1, "MEDIUM", "Biện pháp chủ yếu để bảo vệ tài nguyên đất ở vùng đồi núi nước ta là", [
    "áp dụng tổng thể các biện pháp thủy lợi, canh tác như làm ruộng bậc thang, trồng cây theo băng",
    "đẩy mạnh thâm canh, tăng cường bón phân hóa học để nâng cao độ phì của đất",
    "mở rộng diện tích trồng cây lương thực ngắn ngày trên các sườn đồi có độ dốc lớn",
    "thau chua, rửa mặn và cải tạo đất phèn bằng hệ thống kênh mương nội đồng",
  ], "A",
    "Đất đồi núi dễ bị xói mòn, rửa trôi do địa hình dốc và mưa tập trung theo mùa. Cần kết hợp thủy lợi và canh tác hợp lí (ruộng bậc thang, trồng cây theo băng, nông – lâm kết hợp, bảo vệ rừng). Thâm canh bằng phân hóa học dễ làm thoái hóa đất; trồng cây ngắn ngày trên đất dốc làm tăng xói mòn; thau chua rửa mặn là biện pháp cho vùng đồng bằng."),
  mc(1, "HARD", "Vào đầu mùa hạ, khối khí nhiệt đới ẩm từ Bắc Ấn Độ Dương di chuyển theo hướng tây nam vào nước ta. Sau khi vượt qua dãy Trường Sơn và các dãy núi dọc biên giới Việt – Lào, khối khí này gây ra kiểu thời tiết đặc trưng nào ở đồng bằng ven biển Bắc Trung Bộ?", [
    "Khô, nóng do hiệu ứng phơn",
    "Mưa phùn, ẩm ướt kéo dài",
    "Lạnh, khô và trời hanh",
    "Mưa lớn kéo dài nhiều ngày",
  ], "A",
    "Khối khí nhiệt đới ẩm Bắc Ấn Độ Dương gây mưa lớn ở sườn đón gió (Nam Bộ, Tây Nguyên). Khi vượt núi xuống sườn khuất gió phía đông, không khí bị đoạn nhiệt khô, nhiệt độ tăng, độ ẩm giảm, gây thời tiết khô nóng (gió phơn Tây Nam, thường gọi là “gió Lào”) ở đồng bằng ven biển Bắc Trung Bộ và phần nam khu vực Tây Bắc."),
  mc(2, "EASY", "Phát biểu nào sau đây đúng với đặc điểm dân cư nước ta hiện nay?", [
    "Dân số đông, có nhiều thành phần dân tộc",
    "Dân số ít, mật độ dân số thấp",
    "Tỉ lệ dân thành thị cao hơn nông thôn",
    "Dân cư phân bố đều giữa các vùng",
  ], "A",
    "Nước ta có quy mô dân số trên 100 triệu người, gồm 54 dân tộc. Mật độ dân số thuộc loại cao; phần lớn dân cư vẫn sống ở nông thôn; dân cư phân bố không đều (tập trung ở đồng bằng, thưa ở miền núi)."),
  mc(2, "MEDIUM", "Phát biểu nào sau đây đúng về nguồn lao động nước ta hiện nay?", [
    "Nguồn lao động dồi dào, chất lượng lao động ngày càng được nâng lên",
    "Lao động tập trung chủ yếu ở khu vực thành thị và các khu công nghiệp",
    "Phần lớn lao động đã qua đào tạo và có bằng cấp, chứng chỉ",
    "Tỉ trọng lao động trong ngành nông, lâm, thủy sản đang tăng nhanh",
  ], "A",
    "Lực lượng lao động nước ta đông (khoảng hơn 50 triệu người), trình độ ngày càng được nâng lên nhưng tỉ lệ lao động qua đào tạo có bằng cấp, chứng chỉ vẫn còn thấp (chưa đến một phần ba). Lao động vẫn tập trung nhiều ở nông thôn; tỉ trọng lao động khu vực nông, lâm, thủy sản đang giảm theo xu hướng chuyển dịch cơ cấu kinh tế."),
  mc(2, "MEDIUM", "Tác động tích cực của quá trình đô thị hóa đến phát triển kinh tế – xã hội nước ta là", [
    "thúc đẩy chuyển dịch cơ cấu kinh tế và tạo thêm nhiều việc làm",
    "làm tăng tỉ trọng lao động trong khu vực nông nghiệp",
    "làm giảm nhu cầu đầu tư xây dựng cơ sở hạ tầng",
    "hạn chế dòng di cư từ nông thôn ra thành thị",
  ], "A",
    "Đô thị là nơi tập trung công nghiệp, dịch vụ, thị trường tiêu thụ và lao động có trình độ, nên đô thị hóa thúc đẩy chuyển dịch cơ cấu kinh tế theo hướng công nghiệp hóa, tạo việc làm. Đô thị hóa làm giảm tỉ trọng lao động nông nghiệp, làm tăng nhu cầu hạ tầng và thu hút người di cư từ nông thôn."),
  mc(3, "EASY", "Vùng có diện tích và sản lượng lúa lớn nhất nước ta là", [
    "Đồng bằng sông Cửu Long",
    "Đồng bằng sông Hồng",
    "Bắc Trung Bộ",
    "Đông Nam Bộ",
  ], "A",
    "Đồng bằng sông Cửu Long là vùng trọng điểm lúa lớn nhất cả nước, chiếm hơn một nửa diện tích và sản lượng lúa, đóng góp phần lớn lượng gạo xuất khẩu."),
  mc(3, "MEDIUM", "Tây Nguyên là vùng trồng cà phê lớn nhất nước ta chủ yếu nhờ có", [
    "đất badan màu mỡ trên diện rộng và khí hậu cận xích đạo",
    "đất phù sa màu mỡ và mạng lưới sông ngòi dày đặc",
    "khí hậu có mùa đông lạnh và nhiều sương muối",
    "địa hình thấp, bằng phẳng và nhiều đầm phá ven biển",
  ], "A",
    "Tây Nguyên có diện tích đất badan lớn nhất cả nước, phân bố tập trung trên các cao nguyên xếp tầng, kết hợp khí hậu cận xích đạo với mùa khô thuận lợi cho phơi sấy, bảo quản sản phẩm — điều kiện lí tưởng cho cây cà phê."),
  mc(3, "EASY", "Điều kiện tự nhiên thuận lợi để nước ta phát triển nuôi trồng thủy sản nước lợ là có nhiều", [
    "bãi triều, đầm phá và rừng ngập mặn ven biển",
    "sông suối và hồ thủy điện ở vùng miền núi",
    "ô trũng và ruộng lúa ở vùng đồng bằng",
    "ngư trường lớn ở các vùng biển xa bờ",
  ], "A",
    "Nuôi trồng thủy sản nước lợ (tôm, cua…) phát triển ở các bãi triều, đầm phá, cửa sông và vùng rừng ngập mặn ven biển. Sông suối, hồ, ô trũng thích hợp nuôi thủy sản nước ngọt; ngư trường xa bờ phục vụ khai thác (đánh bắt) hải sản."),
  mc(4, "EASY", "Than antraxit của nước ta tập trung chủ yếu ở khu vực", [
    "Quảng Ninh",
    "Tây Nguyên",
    "Đông Nam Bộ",
    "Duyên hải Nam Trung Bộ",
  ], "A",
    "Bể than Quảng Ninh chiếm phần lớn trữ lượng và sản lượng than antraxit (than đá chất lượng cao) của cả nước."),
  mc(4, "MEDIUM", "Các mỏ dầu khí đang được khai thác của nước ta phân bố chủ yếu ở", [
    "các bể trầm tích trên thềm lục địa phía Nam",
    "các thung lũng sông ở vùng núi Tây Bắc",
    "các cao nguyên badan ở vùng Tây Nguyên",
    "các cồn cát ven biển vùng Bắc Trung Bộ",
  ], "A",
    "Dầu khí nước ta được khai thác chủ yếu ở các bể trầm tích trên thềm lục địa phía Nam như bể Cửu Long và bể Nam Côn Sơn; đây là cơ sở hình thành các trung tâm công nghiệp dầu khí ở Đông Nam Bộ."),
  mc(5, "EASY", "Tài nguyên du lịch nào sau đây thuộc nhóm tài nguyên du lịch văn hóa?", [
    "Lễ hội truyền thống",
    "Bãi biển cát trắng",
    "Hang động đá vôi",
    "Suối khoáng nóng",
  ], "A",
    "Tài nguyên du lịch văn hóa gồm di tích lịch sử – văn hóa, lễ hội, làng nghề, nghệ thuật truyền thống… Bãi biển, hang động, suối khoáng là tài nguyên du lịch tự nhiên."),
  mc(6, "EASY", "Thế mạnh nổi bật về công nghiệp của vùng Trung du và miền núi Bắc Bộ là", [
    "khai thác, chế biến khoáng sản và thủy điện",
    "khai thác dầu khí trên thềm lục địa",
    "chế biến lương thực từ lúa gạo xuất khẩu",
    "đóng tàu biển và cơ khí hàng hải",
  ], "A",
    "Vùng giàu khoáng sản (than, sắt, thiếc, apatit…) và có trữ năng thủy điện lớn trên hệ thống sông Hồng (sông Đà, sông Lô, sông Gâm…), nên thế mạnh nổi bật là khai thác, chế biến khoáng sản và thủy điện."),
  mc(6, "HARD", "Các đảo và quần đảo có ý nghĩa đặc biệt quan trọng đối với an ninh quốc phòng của nước ta vì", [
    "chúng là cơ sở để khẳng định chủ quyền đối với vùng biển và thềm lục địa",
    "chúng là nơi tập trung phần lớn dân cư và nguồn lao động của cả nước",
    "chúng có diện tích đất nông nghiệp rộng, cung cấp nhiều lương thực",
    "chúng là nơi khai thác phần lớn sản lượng than và quặng kim loại",
  ], "A",
    "Hệ thống đảo, quần đảo là tuyến phòng thủ tiền tiêu bảo vệ đất liền, đồng thời là căn cứ để xác lập đường cơ sở, khẳng định chủ quyền của nước ta đối với các vùng biển và thềm lục địa. Các đảo có dân cư thưa, diện tích nhỏ, không phải nơi sản xuất lương thực hay khai thác khoáng sản chủ yếu."),

  // ── Phần II (4 câu đúng/sai) ──
  tf(1, "MEDIUM", `Cho bảng số liệu:\nNHIỆT ĐỘ TRUNG BÌNH THÁNG I, THÁNG VII VÀ CẢ NĂM TẠI MỘT SỐ ĐỊA ĐIỂM ${GIA_DINH}\n(Đơn vị: °C)\nĐịa điểm | Tháng I | Tháng VII | Cả năm\nHà Nội | 16,4 | 28,9 | 23,5\nHuế | 19,7 | 29,4 | 25,1\nTP Hồ Chí Minh | 25,8 | 27,1 | 27,1`, [
    ["Chênh lệch nhiệt độ giữa tháng VII và tháng I ở Hà Nội lớn hơn ở Huế.", true],
    ["Nhiệt độ trung bình tháng I giảm dần từ Hà Nội đến TP Hồ Chí Minh.", false],
    ["Nhiệt độ tháng I ở Hà Nội thấp chủ yếu do ảnh hưởng của gió mùa Tây Nam.", false],
    ["Vào tháng VII, Huế có nhiệt độ trung bình cao nhất trong ba địa điểm.", true],
  ], "a) Đúng: Hà Nội 28,9 − 16,4 = 12,5 °C; Huế 29,4 − 19,7 = 9,7 °C.\nb) Sai: nhiệt độ tháng I tăng dần từ bắc vào nam (16,4 → 19,7 → 25,8 °C).\nc) Sai: tháng I là thời kì hoạt động của gió mùa Đông Bắc, mang không khí lạnh đến miền Bắc; gió mùa Tây Nam hoạt động vào mùa hạ.\nd) Đúng: 29,4 °C (Huế) > 28,9 °C (Hà Nội) > 27,1 °C (TP Hồ Chí Minh)."),
  tf(5, "HARD", `Cho bảng số liệu:\nGIÁ TRỊ XUẤT KHẨU VÀ NHẬP KHẨU HÀNG HÓA CỦA VIỆT NAM, GIAI ĐOẠN 2015 – 2023 ${GIA_DINH}\n(Đơn vị: tỉ USD)\nNăm | 2015 | 2018 | 2020 | 2023\nXuất khẩu | 162,0 | 243,7 | 282,6 | 355,5\nNhập khẩu | 165,6 | 236,9 | 262,7 | 327,5`, [
    ["Năm 2015, nước ta nhập siêu.", true],
    ["Giá trị xuất khẩu năm 2023 gấp hơn 2,5 lần năm 2015.", false],
    ["Năm 2023, cán cân xuất nhập khẩu của nước ta là xuất siêu 28,0 tỉ USD.", true],
    ["Giá trị xuất khẩu tăng nhanh chủ yếu do nước ta đẩy mạnh xuất khẩu khoáng sản thô.", false],
  ], "a) Đúng: năm 2015 nhập khẩu (165,6) lớn hơn xuất khẩu (162,0), cán cân là −3,6 tỉ USD.\nb) Sai: 355,5 : 162,0 ≈ 2,19 lần.\nc) Đúng: 355,5 − 327,5 = 28,0 tỉ USD > 0 nên là xuất siêu.\nd) Sai: hàng xuất khẩu chủ yếu là sản phẩm công nghiệp chế biến, chế tạo (điện tử, máy tính, điện thoại, dệt may, giày dép…); tăng trưởng xuất khẩu gắn với công nghiệp hóa, thu hút đầu tư nước ngoài và hội nhập, mở rộng thị trường. Tỉ trọng khoáng sản thô trong cơ cấu xuất khẩu ngày càng giảm."),
  tf(6, "HARD", "Cho thông tin sau:\nĐồng bằng sông Cửu Long là vùng sản xuất lúa gạo, nuôi trồng thủy sản và cây ăn quả lớn nhất cả nước. Tuy nhiên, vùng đang chịu tác động ngày càng rõ rệt của biến đổi khí hậu: mùa khô kéo dài, xâm nhập mặn lấn sâu vào nội đồng, nước biển dâng, sụt lún đất và sạt lở bờ sông, bờ biển. Nhiều địa phương đã điều chỉnh cơ cấu cây trồng, vật nuôi theo hướng thích ứng, chủ động sống chung với lũ, với hạn và mặn.", [
    ["Xâm nhập mặn ở vùng thường gay gắt nhất vào mùa khô, khi lưu lượng nước sông Mê Công xuống thấp.", true],
    ["Do địa hình cao và dốc, Đồng bằng sông Cửu Long ít chịu ảnh hưởng của nước biển dâng.", false],
    ["Mô hình luân canh tôm – lúa ở vùng ven biển là một hướng chuyển đổi thích ứng với điều kiện nước mặn, nước lợ.", true],
    ["Giải pháp chủ yếu để thích ứng với biến đổi khí hậu ở vùng là mở rộng trồng lúa ba vụ trên toàn vùng, kể cả vùng ven biển nhiễm mặn.", false],
  ], "a) Đúng: mùa khô lượng nước từ thượng nguồn sông Mê Công giảm, nước biển theo các cửa sông lấn sâu vào nội đồng.\nb) Sai: vùng có địa hình thấp và bằng phẳng, nhiều nơi chỉ cao hơn mực nước biển rất ít, nên rất dễ bị tác động của nước biển dâng.\nc) Đúng: mùa khô nuôi tôm khi nước mặn/lợ, mùa mưa trồng lúa khi nước ngọt — tận dụng điều kiện tự nhiên theo mùa.\nd) Sai: ở vùng ven biển nhiễm mặn cần chuyển đổi sang nuôi trồng thủy sản nước lợ, mô hình tôm – lúa, cây trồng chịu mặn; mở rộng lúa ba vụ ở đây làm tăng nhu cầu nước ngọt và rủi ro hạn mặn."),
  tf(2, "MEDIUM", "Cho thông tin sau:\nNăm 2023, dân số Việt Nam đạt hơn 100 triệu người, đứng thứ ba ở khu vực Đông Nam Á. Tỉ lệ dân thành thị khoảng 38%. Nước ta đang trong thời kì cơ cấu dân số vàng, đồng thời quá trình già hóa dân số diễn ra khá nhanh.", [
    ["Trong thời kì cơ cấu dân số vàng, số người phụ thuộc (dưới 15 tuổi và từ 65 tuổi trở lên) nhiều hơn số người trong độ tuổi lao động.", false],
    ["Phần lớn dân cư nước ta hiện vẫn sống ở khu vực nông thôn.", true],
    ["Già hóa dân số đặt ra yêu cầu phát triển hệ thống an sinh xã hội và chăm sóc sức khỏe người cao tuổi.", true],
    ["Dân cư nước ta tập trung đông nhất ở vùng miền núi do có nhiều tài nguyên khoáng sản và rừng.", false],
  ], "a) Sai: cơ cấu dân số vàng là thời kì số người trong độ tuổi lao động lớn, gấp hơn hai lần số người phụ thuộc (tỉ số phụ thuộc chung dưới 50%).\nb) Đúng: tỉ lệ dân thành thị khoảng 38% nên khoảng 62% dân số sống ở nông thôn.\nc) Đúng: tỉ lệ người cao tuổi tăng làm tăng nhu cầu về y tế, lương hưu, chăm sóc người cao tuổi.\nd) Sai: dân cư tập trung đông ở đồng bằng, ven biển và đô thị; miền núi tuy giàu tài nguyên nhưng địa hình hiểm trở, cơ sở hạ tầng hạn chế nên dân cư thưa thớt."),

  // ── Phần III (6 câu trả lời ngắn) ──
  sa(3, "EASY", `Cho bảng số liệu:\nDIỆN TÍCH VÀ SẢN LƯỢNG LÚA CỦA NƯỚC TA NĂM 2023 ${GIA_DINH}\nDiện tích: 7 120 nghìn ha\nSản lượng: 43 498 nghìn tấn\nTính năng suất lúa của nước ta năm 2023 (đơn vị: tạ/ha; làm tròn kết quả đến một chữ số thập phân).`, "61,1",
    "Năng suất = sản lượng : diện tích = 43 498 nghìn tấn : 7 120 nghìn ha ≈ 6,109 tấn/ha. Đổi 1 tấn = 10 tạ ⇒ năng suất ≈ 61,09 ≈ 61,1 tạ/ha."),
  sa(2, "MEDIUM", `Một vùng có diện tích 21 260 km² và dân số 18,5 triệu người ${GIA_DINH}. Tính mật độ dân số của vùng (đơn vị: người/km²; làm tròn kết quả đến hàng đơn vị).`, "870",
    "Mật độ dân số = dân số : diện tích = 18 500 000 : 21 260 ≈ 870,18 ≈ 870 người/km²."),
  sa(5, "MEDIUM", `Cho bảng số liệu:\nSỐ LƯỢT KHÁCH DU LỊCH QUỐC TẾ ĐẾN VIỆT NAM ${GIA_DINH}\nNăm 2015: 7,9 triệu lượt\nNăm 2019: 18,0 triệu lượt\nNếu lấy năm 2015 = 100% thì tốc độ tăng trưởng số lượt khách du lịch quốc tế đến Việt Nam năm 2019 là bao nhiêu %? (Làm tròn kết quả đến hàng đơn vị.)`, "228",
    "Tốc độ tăng trưởng (năm 2015 = 100%) = 18,0 : 7,9 × 100% ≈ 227,85% ≈ 228%."),
  sa(4, "HARD", `Cho bảng số liệu:\nSẢN LƯỢNG ĐIỆN PHÂN THEO NGUỒN CỦA NƯỚC TA NĂM 2023 ${GIA_DINH}\n(Đơn vị: tỉ kWh)\nNhiệt điện than: 130,5\nThủy điện: 80,9\nĐiện gió và điện mặt trời: 36,2\nNguồn khác: 32,4\nTính tỉ trọng sản lượng thủy điện trong tổng sản lượng điện của nước ta năm 2023 (đơn vị: %; làm tròn kết quả đến một chữ số thập phân).`, "28,9",
    "Tổng sản lượng điện = 130,5 + 80,9 + 36,2 + 32,4 = 280,0 tỉ kWh.\nTỉ trọng thủy điện = 80,9 : 280,0 × 100% ≈ 28,89% ≈ 28,9%."),
  sa(6, "HARD", `Năm 2023, một vùng có sản lượng lúa 24,0 triệu tấn và dân số 17,4 triệu người ${GIA_DINH}. Tính sản lượng lúa bình quân đầu người của vùng (đơn vị: kg/người; làm tròn kết quả đến hàng đơn vị).`, "1379",
    "Đổi 24,0 triệu tấn = 24 000 000 000 kg.\nBình quân = 24 000 000 000 : 17 400 000 ≈ 1 379,31 ≈ 1379 kg/người."),
  sa(1, "HARD", `Biết nhiệt độ không khí giảm trung bình 0,6 °C khi lên cao 100 m. Tại một trạm khí tượng ở chân núi có độ cao 200 m, nhiệt độ không khí đo được là 25,0 °C ${GIA_DINH}. Theo cách tính trên, nhiệt độ không khí cùng thời điểm ở đỉnh Phan Xi Păng (độ cao 3 143 m) là bao nhiêu °C? (Làm tròn kết quả đến một chữ số thập phân.)`, "7,3",
    "Chênh lệch độ cao: 3 143 − 200 = 2 943 m.\nNhiệt độ giảm: 2 943 : 100 × 0,6 = 17,658 °C.\nNhiệt độ ở đỉnh núi: 25,0 − 17,658 = 7,342 ≈ 7,3 °C."),
];

export const DIA_LI_EXAM: DemoExam = {
  slug: "dia-li",
  subjectName: "Địa lí",
  title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Địa lí",
  durationMinutes: 50,
  shortAnswerPoints: "0.25",
  topics: TOPICS,
  description: `${DEMO_NOTE}\nCấu trúc: Phần I – 18 câu trắc nghiệm nhiều lựa chọn (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu); Phần III – 6 câu trả lời ngắn (0,25 điểm/câu). Thời gian làm bài: 50 phút.`,
  questions: QUESTIONS,
};
