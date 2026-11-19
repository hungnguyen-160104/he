/**
 * DEMO exam for Công nghệ (định hướng Nông nghiệp) in the THPT graduation exam format from 2025:
 * part I – 24 single-choice questions (0.25 point each), part II – 4 true/false questions (up to 1
 * point each), no part III, 50 minutes. Content covers Công nghệ 12 (Lâm nghiệp, Thủy sản) and
 * Công nghệ 11 (Chăn nuôi). All items are original practice items, not official exam content.
 */
import { createBuilders, DEMO_NOTE, type DemoExam, type DemoQuestion } from "./builders";

const { mc, tf } = createBuilders();

const TOPICS = [
  "Vai trò, phân loại rừng và sinh trưởng của cây rừng",
  "Trồng, chăm sóc, bảo vệ và khai thác rừng",
  "Môi trường nuôi thủy sản",
  "Thức ăn và công nghệ nuôi thủy sản",
  "Bệnh thủy sản và bảo vệ nguồn lợi thủy sản",
  "Chăn nuôi: giống, thức ăn và phòng bệnh",
];

const QUESTIONS: DemoQuestion[] = [
  // ── Phần I (24 câu) ──
  mc(0, "EASY", "Vai trò nào sau đây là vai trò phòng hộ, bảo vệ môi trường của rừng?", [
    "Điều hòa dòng chảy, hạn chế xói mòn đất, lũ lụt và sạt lở",
    "Cung cấp gỗ làm nguyên liệu cho công nghiệp chế biến",
    "Cung cấp dược liệu, tre nứa và các lâm sản ngoài gỗ",
    "Tạo việc làm, tăng thu nhập cho người dân miền núi",
  ], "A",
    "Rừng giữ nước, điều hòa dòng chảy, giảm xói mòn, lũ lụt và sạt lở là vai trò phòng hộ, bảo vệ môi trường. Cung cấp gỗ, lâm sản ngoài gỗ và tạo việc làm là các vai trò kinh tế – xã hội của rừng."),
  mc(0, "EASY", "Theo Luật Lâm nghiệp năm 2017, vườn quốc gia thuộc loại rừng nào sau đây?", [
    "Rừng đặc dụng",
    "Rừng phòng hộ",
    "Rừng sản xuất",
    "Rừng phòng hộ đầu nguồn",
  ], "A",
    "Rừng đặc dụng được sử dụng chủ yếu để bảo tồn hệ sinh thái rừng, nguồn gen sinh vật, nghiên cứu khoa học, bảo tồn di tích – danh lam thắng cảnh, du lịch sinh thái; vườn quốc gia là một loại rừng đặc dụng. Rừng phòng hộ (trong đó có rừng phòng hộ đầu nguồn) chủ yếu để bảo vệ nguồn nước, đất, chống thiên tai; rừng sản xuất chủ yếu để cung cấp lâm sản."),
  mc(0, "EASY", "Sinh trưởng của cây rừng là", [
    "sự tăng lên về kích thước và khối lượng của cây như chiều cao, đường kính thân, sinh khối",
    "sự biến đổi về chất bên trong cây dẫn đến hiện tượng ra hoa, kết quả",
    "quá trình cây chuyển từ giai đoạn non sang giai đoạn thành thục",
    "quá trình cây hình thành hạt giống và phát tán hạt ra xung quanh",
  ], "A",
    "Sinh trưởng là sự tăng lên về lượng (kích thước, khối lượng) của cây. Sự biến đổi về chất dẫn tới ra hoa, kết quả hay chuyển giai đoạn là biểu hiện của phát triển; hình thành và phát tán hạt là một phần của quá trình sinh sản."),
  mc(0, "MEDIUM", "Ở giai đoạn nào sau đây, cây rừng sinh trưởng chậm dần rồi ngừng hẳn, khả năng ra hoa, kết quả giảm, tán lá thưa dần, cành ngọn dễ khô héo và cây dễ bị sâu bệnh?", [
    "Giai đoạn già cỗi",
    "Giai đoạn non",
    "Giai đoạn gần thành thục",
    "Giai đoạn thành thục",
  ], "A",
    "Đây là các đặc điểm của giai đoạn già cỗi. Ở giai đoạn non và gần thành thục, cây đang sinh trưởng tích cực, chưa ra hoa hoặc mới bắt đầu ra hoa; ở giai đoạn thành thục, cây ra hoa, kết quả ổn định."),
  mc(1, "EASY", "Khi trồng rừng bằng cây con có bầu, cần rạch bỏ vỏ bầu trước khi đặt cây xuống hố nhằm mục đích nào sau đây?", [
    "Giúp rễ cây phát triển ra đất xung quanh, cây nhanh bén rễ",
    "Giữ ẩm cho bầu đất trong suốt mùa khô đầu tiên",
    "Ngăn sâu bệnh trong đất xâm nhập vào bộ rễ",
    "Giảm lượng phân cần bón lót vào hố trồng",
  ], "A",
    "Vỏ bầu (thường bằng nilon) không phân hủy nhanh, nếu để lại sẽ cản trở rễ đâm ra đất, làm cây chậm bén rễ, còi cọc. Rạch bỏ vỏ bầu (giữ nguyên bầu đất) giúp rễ phát triển ra đất xung quanh."),
  mc(1, "EASY", "Hoạt động nào sau đây là nguyên nhân trực tiếp làm suy giảm diện tích rừng tự nhiên?", [
    "Đốt nương làm rẫy, chuyển đổi đất rừng sang trồng cây nông nghiệp",
    "Giao khoán rừng cho hộ gia đình, cộng đồng quản lí và bảo vệ",
    "Xây dựng đường băng cản lửa trong các khu rừng dễ cháy",
    "Trồng bổ sung cây bản địa vào các khoảng trống trong rừng",
  ], "A",
    "Đốt nương làm rẫy và chuyển đổi mục đích sử dụng đất rừng làm mất rừng trực tiếp. Giao khoán bảo vệ rừng, làm đường băng cản lửa và trồng bổ sung cây bản địa đều là biện pháp bảo vệ, phục hồi rừng."),
  mc(1, "MEDIUM", "Phương thức khai thác nào sau đây chỉ chặt những cây đã già, cây có phẩm chất và sức sống kém, giữ lại cây non và cây có phẩm chất tốt, để rừng tự phục hồi?", [
    "Khai thác chọn",
    "Khai thác trắng",
    "Khai thác dần",
    "Khai thác tận thu toàn bộ",
  ], "A",
    "Khai thác chọn chặt có chọn lọc cây già, cây kém phẩm chất và giữ lại cây non, cây tốt nên rừng vẫn duy trì độ che phủ và tự phục hồi. Khai thác trắng chặt toàn bộ cây trong một lần rồi trồng lại; khai thác dần chặt hết cây qua nhiều lần trong một số năm để rừng tái sinh tự nhiên."),
  mc(1, "MEDIUM", "Trong mùa khô hanh, biện pháp nào sau đây giúp phòng cháy và hạn chế cháy lan khi xảy ra cháy rừng?", [
    "Xây dựng đường băng cản lửa và thường xuyên phát dọn vật liệu dễ cháy dưới tán rừng",
    "Đốt thực bì để dọn đất vào thời điểm nắng nóng, gió mạnh trong ngày",
    "Cho phép người dân dùng lửa tự do trong rừng khi lấy mật ong, săn bắt",
    "Chỉ huy động lực lượng chữa cháy khi đám cháy đã lan ra diện rộng",
  ], "A",
    "Đường băng cản lửa ngăn đám cháy lan rộng; phát dọn cành khô, lá rụng, cỏ khô làm giảm vật liệu cháy. Đốt thực bì lúc nắng nóng, gió mạnh, dùng lửa tùy tiện trong rừng dễ gây cháy; chữa cháy phải thực hiện ngay từ khi mới phát hiện, không chờ cháy lan rộng."),
  mc(2, "EASY", "Ao nuôi cá được xây dựng trên vùng đất chua, nước ao có pH thấp hơn khoảng thích hợp. Để nâng pH của nước và đáy ao, người nuôi thường sử dụng biện pháp nào sau đây?", [
    "Bón vôi (như vôi nông nghiệp CaCO₃ hoặc dolomite)",
    "Bón phân urea với lượng lớn",
    "Bổ sung rỉ đường (mật rỉ) vào ao",
    "Bón phân hữu cơ chưa được ủ hoai",
  ], "A",
    "Vôi có tính kiềm, trung hòa acid trong đất và nước nên làm tăng pH. Phân hữu cơ chưa ủ hoai và rỉ đường khi phân hủy sinh ra CO₂, acid hữu cơ làm pH giảm; urea không phải biện pháp nâng pH và còn làm tăng ammonia trong ao."),
  mc(2, "MEDIUM", "Tôm, cá là động vật biến nhiệt. Khi nhiệt độ nước giảm xuống thấp hơn khoảng thích hợp, hiện tượng nào sau đây thường xảy ra?", [
    "Cường độ trao đổi chất giảm, tôm cá ăn ít và chậm lớn",
    "Thân nhiệt của tôm cá vẫn được giữ ổn định nhờ tự điều hòa",
    "Nhu cầu thức ăn của tôm cá tăng mạnh để bù năng lượng",
    "Hàm lượng oxygen hòa tan trong nước giảm mạnh",
  ], "A",
    "Thân nhiệt của động vật biến nhiệt thay đổi theo nhiệt độ môi trường; khi nước lạnh, các phản ứng trao đổi chất chậm lại nên tôm cá giảm ăn, sinh trưởng chậm, sức đề kháng giảm. Nước có nhiệt độ thấp lại hòa tan được nhiều oxygen hơn nước ấm."),
  mc(3, "EASY", "Nhóm nào sau đây là thức ăn tự nhiên của thủy sản trong ao nuôi?", [
    "Tảo, động vật phù du và sinh vật đáy",
    "Thức ăn hỗn hợp dạng viên nổi",
    "Cám gạo, bột ngô và bột sắn",
    "Bột cá, khô dầu đậu tương",
  ], "A",
    "Thức ăn tự nhiên là các sinh vật sẵn có trong thủy vực như tảo (thực vật phù du), động vật phù du, sinh vật đáy, mùn bã hữu cơ. Thức ăn viên, cám, bột ngô, bột cá, khô dầu là thức ăn do con người cung cấp."),
  mc(3, "EASY", "Áp dụng VietGAP trong nuôi trồng thủy sản hướng tới mục tiêu nào sau đây?", [
    "Bảo đảm an toàn thực phẩm, bảo vệ môi trường, an sinh xã hội và truy xuất được nguồn gốc sản phẩm",
    "Tăng mật độ nuôi và sản lượng tối đa, không phụ thuộc vào tác động tới môi trường",
    "Thay thế hoàn toàn thức ăn công nghiệp bằng thức ăn do người nuôi tự phối trộn",
    "Chỉ kiểm tra chất lượng sản phẩm ở khâu thu hoạch để xuất khẩu",
  ], "A",
    "VietGAP (Thực hành sản xuất nông nghiệp tốt ở Việt Nam) quản lí toàn bộ quá trình nuôi theo các tiêu chí an toàn thực phẩm, an toàn môi trường, an sinh xã hội, sức khỏe – phúc lợi vật nuôi và có ghi chép để truy xuất nguồn gốc, không chỉ kiểm tra ở khâu cuối."),
  mc(3, "MEDIUM", "Ưu điểm nổi bật của hệ thống nuôi thủy sản tuần hoàn (RAS) so với nuôi ao truyền thống là", [
    "tiết kiệm nước, kiểm soát tốt môi trường nuôi và hạn chế xả thải ra môi trường",
    "chi phí đầu tư ban đầu và chi phí điện năng vận hành đều rất thấp",
    "không cần theo dõi, quản lí chất lượng nước trong suốt vụ nuôi",
    "chỉ phù hợp với mật độ nuôi thấp nên ít rủi ro dịch bệnh",
  ], "A",
    "Trong RAS, nước được lọc cơ học, lọc sinh học, khử trùng và tái sử dụng, nên tiết kiệm nước, kiểm soát được các yếu tố môi trường, nuôi được mật độ cao và ít xả thải. Nhược điểm là chi phí đầu tư, điện năng lớn và đòi hỏi quản lí, kĩ thuật cao."),
  mc(4, "EASY", "Hành vi nào sau đây bị nghiêm cấm trong khai thác nguồn lợi thủy sản?", [
    "Sử dụng chất nổ, xung điện, chất độc để khai thác thủy sản",
    "Khai thác bằng lưới có kích thước mắt lưới đúng quy định",
    "Thả giống thủy sản để tái tạo nguồn lợi ở sông, hồ",
    "Khai thác ngoài khu vực và thời gian cấm khai thác",
  ], "A",
    "Chất nổ, xung điện, chất độc giết hàng loạt thủy sản ở mọi kích cỡ (kể cả cá con, trứng) và hủy hoại môi trường sống nên bị pháp luật nghiêm cấm. Dùng lưới đúng quy định, thả giống tái tạo và tuân thủ vùng, mùa cấm là các hoạt động khai thác hợp pháp, bền vững."),
  mc(4, "MEDIUM", "Bệnh đốm trắng ở tôm do tác nhân nào gây ra và vì sao dùng kháng sinh không điều trị được bệnh này?", [
    "Do virus; kháng sinh chỉ có tác dụng với vi khuẩn",
    "Do vi khuẩn; tôm nuôi đã kháng hết các loại kháng sinh",
    "Do nấm; kháng sinh bị phân hủy nhanh trong nước ao",
    "Do kí sinh trùng; kháng sinh không thấm qua được vỏ tôm",
  ], "A",
    "Bệnh đốm trắng do virus gây ra (virus hội chứng đốm trắng, WSSV). Kháng sinh tác động lên vi khuẩn, không tiêu diệt được virus, nên bệnh chưa có thuốc đặc trị; cần phòng bệnh bằng con giống sạch bệnh (xét nghiệm PCR), quản lí tốt môi trường và an toàn sinh học."),
  mc(5, "EASY", "Phép giao phối nào sau đây là nhân giống thuần chủng?", [
    "Lợn đực Móng Cái × lợn cái Móng Cái",
    "Lợn đực Landrace × lợn cái Móng Cái",
    "Gà trống Ri × gà mái Lương Phượng",
    "Bò đực Brahman × bò cái Lai Sind",
  ], "A",
    "Nhân giống thuần chủng là cho con đực và con cái cùng một giống giao phối với nhau để tạo ra đời con cùng giống. Các phép giao phối còn lại đều giữa hai giống khác nhau nên là lai giống."),
  mc(5, "MEDIUM", "Trong lai kinh tế, con lai F1 thường được sử dụng để", [
    "nuôi lấy sản phẩm như thịt, trứng, sữa mà không dùng làm giống",
    "làm giống nhân đàn cho các thế hệ tiếp theo",
    "lai trở lại với giống bố để tạo ra giống thuần chủng mới",
    "bảo tồn nguồn gen quý của giống địa phương",
  ], "A",
    "Lai kinh tế tận dụng ưu thế lai, biểu hiện cao nhất ở F1, nên con lai F1 được nuôi lấy sản phẩm. Nếu dùng F1 làm giống, ở các thế hệ sau ưu thế lai giảm và có sự phân li tính trạng."),
  mc(5, "EASY", "Loại thức ăn nào sau đây thuộc nhóm thức ăn thô cho vật nuôi?", [
    "Rơm lúa, cỏ khô",
    "Ngô hạt, cám gạo",
    "Bột cá, khô dầu đậu tương",
    "Premix vitamin – khoáng",
  ], "A",
    "Thức ăn thô có hàm lượng chất xơ cao như rơm, cỏ khô, thân cây ngô. Ngô, cám gạo là thức ăn tinh giàu năng lượng; bột cá, khô dầu là thức ăn giàu protein; premix vitamin – khoáng là thức ăn bổ sung."),
  mc(5, "MEDIUM", "Nguyên lí của phương pháp ủ chua thức ăn xanh (như cây ngô, cỏ voi) để dự trữ cho trâu bò là", [
    "tạo điều kiện yếm khí để vi khuẩn lactic lên men, sinh acid lactic làm giảm pH, ức chế vi sinh vật gây thối",
    "phơi khô nguyên liệu đến độ ẩm thấp để vi sinh vật không thể phát triển",
    "trộn urea với nguyên liệu để phá vỡ liên kết lignin – cellulose, làm mềm thức ăn",
    "ủ hiếu khí để nấm men phân giải protein trong cây thành đường dễ tiêu",
  ], "A",
    "Khi ủ chua, nguyên liệu được nén chặt, đậy kín để tạo môi trường yếm khí; vi khuẩn lactic lên men đường trong cây tạo acid lactic, pH giảm làm ức chế vi sinh vật gây thối nên thức ăn bảo quản được lâu. Phơi khô là phương pháp làm cỏ khô; trộn urea là kiềm hóa rơm."),
  mc(1, "HARD", "Một khu rừng phòng hộ đầu nguồn bị chặt phá trái phép trên diện rộng. Hậu quả nào sau đây dễ xảy ra nhất đối với vùng hạ du?", [
    "Lũ lụt, lũ quét xảy ra thường xuyên hơn vào mùa mưa và thiếu nước vào mùa khô",
    "Lượng mưa trung bình năm ở vùng hạ du tăng lên rõ rệt",
    "Nước sông trong hơn vào mùa lũ do lượng phù sa giảm",
    "Mực nước ngầm ở vùng hạ du dâng cao quanh năm",
  ], "A",
    "Mất rừng đầu nguồn làm giảm khả năng giữ và thấm nước của đất: mùa mưa nước chảy tràn nhanh gây lũ lụt, lũ quét, xói mòn mạnh (nước sông đục hơn vì nhiều phù sa); mùa khô lượng nước ngầm bổ sung cho sông suối ít nên dễ thiếu nước. Mất rừng không làm tăng lượng mưa hay mực nước ngầm ở hạ du."),
  mc(2, "HARD", "Hai ao nuôi có cùng tổng hàm lượng ammonia. Trong các điều kiện sau, điều kiện nào làm nước ao gây độc cho tôm cá mạnh nhất?", [
    "pH = 9,0 và nhiệt độ nước 32 °C",
    "pH = 7,0 và nhiệt độ nước 32 °C",
    "pH = 9,0 và nhiệt độ nước 22 °C",
    "pH = 7,0 và nhiệt độ nước 22 °C",
  ], "A",
    "Trong nước, ammonia tồn tại ở hai dạng NH₄⁺ (ít độc) và NH₃ (rất độc). Khi pH và nhiệt độ tăng, cân bằng chuyển dịch về phía NH₃ nên tỉ lệ NH₃ tăng. Vì vậy với cùng tổng hàm lượng ammonia, nước có pH cao và nhiệt độ cao nhất là độc nhất."),
  mc(3, "HARD", "Trong công nghệ nuôi tôm biofloc, người nuôi bổ sung nguồn carbon hữu cơ (như rỉ đường) vào ao và sục khí liên tục nhằm mục đích chủ yếu nào sau đây?", [
    "Tăng tỉ lệ C/N để vi khuẩn dị dưỡng hấp thu ammonia, tạo hạt floc làm thức ăn bổ sung cho tôm",
    "Ức chế hoạt động của vi khuẩn trong ao để tiết kiệm oxygen hòa tan",
    "Làm nước ao trong hơn để ánh sáng chiếu sâu, tảo đáy phát triển mạnh",
    "Thay thế hoàn toàn thức ăn công nghiệp, không cần cho tôm ăn thêm",
  ], "A",
    "Nguồn carbon bổ sung làm tăng tỉ lệ C/N, giúp vi khuẩn dị dưỡng phát triển, hấp thu ammonia để tổng hợp sinh khối, kết dính với chất hữu cơ, tảo tạo thành hạt floc. Floc làm giảm khí độc và là nguồn thức ăn bổ sung giàu protein, nhờ đó giảm lượng thức ăn và thay nước; tuy nhiên vẫn phải cho ăn thức ăn công nghiệp. Vi khuẩn hoạt động mạnh tiêu tốn nhiều oxygen nên phải sục khí liên tục."),
  mc(4, "HARD", "Một ao nuôi tôm được cơ quan chuyên môn xác định nhiễm bệnh đốm trắng. Cách xử lí nào sau đây là đúng?", [
    "Báo cho cơ quan thú y địa phương, xử lí nước ao bằng hóa chất được phép (như chlorine) trước khi thải, không xả nước bệnh ra môi trường",
    "Xả ngay toàn bộ nước ao ra kênh cấp nước chung, rồi lấy nước mới vào để làm sạch ao",
    "Trộn kháng sinh liều cao vào thức ăn trong nhiều ngày liên tục cho đến khi tôm khỏi bệnh",
    "Vớt tôm chết bán cho thương lái, thả ngay tôm giống mới vào ao mà không cần cải tạo",
  ], "A",
    "Bệnh đốm trắng do virus, lây lan rất nhanh qua nước và vật chủ; phải báo cơ quan thú y, xử lí, tiêu hủy theo hướng dẫn và khử trùng nước trước khi thải để không phát tán mầm bệnh. Xả nước bệnh ra kênh chung làm lây cho các ao khác; kháng sinh không diệt được virus; bán tôm bệnh và thả giống ngay khi chưa cải tạo ao làm mầm bệnh tồn tại, lây lan."),
  mc(5, "HARD", "Bệnh nào sau đây ở vật nuôi do vi khuẩn gây ra, có thể điều trị bằng kháng sinh theo chỉ định của cán bộ thú y?", [
    "Bệnh tụ huyết trùng ở lợn",
    "Bệnh dịch tả lợn châu Phi",
    "Bệnh lở mồm long móng ở trâu bò",
    "Bệnh cúm gia cầm",
  ], "A",
    "Bệnh tụ huyết trùng do vi khuẩn Pasteurella multocida gây ra nên có thể dùng kháng sinh để điều trị khi phát hiện sớm, theo hướng dẫn của thú y. Dịch tả lợn châu Phi, lở mồm long móng và cúm gia cầm đều do virus gây ra, kháng sinh không có tác dụng điều trị; phòng bệnh chủ yếu bằng vaccine và an toàn sinh học."),

  // ── Phần II (4 câu đúng/sai) ──
  tf(1, "MEDIUM", "Một xã miền núi có 50 ha đồi trọc ở vùng đầu nguồn sông, thường xuyên bị xói mòn, sạt lở vào mùa mưa. Xã lập kế hoạch trồng rừng như sau: trồng một số loài cây gỗ bản địa xen với cây keo; sử dụng cây con có bầu, trồng vào đầu mùa mưa; chăm sóc liên tục trong 3 năm đầu và giao khoán cho các hộ dân bảo vệ rừng.", [
    ["Rừng được trồng theo kế hoạch này chủ yếu thuộc loại rừng phòng hộ đầu nguồn.", true],
    ["Khi trồng, cần giữ nguyên vỏ bầu nilon quanh bầu đất để bảo vệ bộ rễ cây con.", false],
    ["Cây keo mọc nhanh, có nốt sần chứa vi khuẩn cố định đạm nên giúp che bóng và cải tạo đất cho cây bản địa ở giai đoạn đầu.", true],
    ["Trồng vào đầu mùa mưa giúp cây con có đủ độ ẩm để bén rễ, nâng cao tỉ lệ sống.", true],
  ], "a) Đúng: rừng ở vùng đầu nguồn, mục đích chính là giữ nước, chống xói mòn, sạt lở nên thuộc rừng phòng hộ đầu nguồn.\nb) Sai: phải rạch bỏ vỏ bầu (giữ nguyên bầu đất) để rễ phát triển ra đất xung quanh; để vỏ bầu sẽ cản trở rễ, cây chậm lớn.\nc) Đúng: keo là cây họ Đậu, mọc nhanh, cộng sinh với vi khuẩn nốt sần cố định đạm, được dùng làm cây phù trợ che bóng và cải tạo đất.\nd) Đúng: đầu mùa mưa đất đủ ẩm, cây con dễ bén rễ và có cả mùa mưa để sinh trưởng trước mùa khô."),
  tf(5, "MEDIUM", "Một trang trại nuôi 500 con lợn thịt nằm gần xã vừa công bố có dịch tả lợn châu Phi. Chủ trang trại đưa ra một số ý kiến về cách phòng, chống dịch cho trang trại.", [
    ["Bệnh dịch tả lợn châu Phi do virus gây ra nên có thể dùng kháng sinh liều cao để điều trị khỏi cho lợn mắc bệnh.", false],
    ["Cần hạn chế người và phương tiện ra vào trại; xe phải được phun sát trùng, người phải sát trùng, thay quần áo và ủng bảo hộ trước khi vào khu chăn nuôi.", true],
    ["Nếu có lợn ốm hoặc chết, nên bán nhanh cho thương lái để giảm thiệt hại kinh tế.", false],
    ["Tận dụng thức ăn thừa từ nhà hàng, bếp ăn chưa qua xử lí nhiệt cho lợn ăn giúp giảm chi phí mà không làm tăng nguy cơ lây bệnh.", false],
  ], "a) Sai: kháng sinh không có tác dụng với virus; bệnh dịch tả lợn châu Phi chưa có thuốc điều trị đặc hiệu, phải phòng bệnh bằng an toàn sinh học (và vaccine theo hướng dẫn của cơ quan thú y).\nb) Đúng: kiểm soát người, phương tiện ra vào và sát trùng là biện pháp an toàn sinh học cơ bản, ngăn mầm bệnh xâm nhập.\nc) Sai: bán chạy lợn bệnh, lợn chết làm phát tán virus ra diện rộng và vi phạm quy định; phải báo cho thú y và tiêu hủy theo hướng dẫn.\nd) Sai: thức ăn thừa có thể chứa sản phẩm thịt lợn nhiễm virus; cho ăn khi chưa nấu chín là một con đường lây bệnh quan trọng."),
  tf(2, "HARD", "Một ao nuôi tôm thẻ chân trắng 45 ngày tuổi được đo các chỉ tiêu môi trường như sau (số liệu giả định, mang tính minh họa):\n– Lúc 5 giờ sáng: nhiệt độ nước 28 °C; oxygen hòa tan 3,0 mg/L; pH 7,6.\n– Lúc 14 giờ: nhiệt độ nước 32 °C; oxygen hòa tan 9,5 mg/L; pH 8,9.\nĐộ trong của nước là 18 cm, nước có màu xanh đậm. Vào sáng sớm, người nuôi thấy tôm nổi đầu, tập trung ở mép bờ.", [
    ["Oxygen hòa tan thấp nhất vào sáng sớm vì suốt đêm tảo và các sinh vật trong ao chỉ hô hấp tiêu thụ oxygen mà không quang hợp.", true],
    ["Độ trong 18 cm và nước màu xanh đậm cho thấy tảo phát triển quá dày; người nuôi nên tăng cường bón phân để gây màu nước.", false],
    ["Người nuôi nên tăng cường chạy quạt nước, sục khí vào ban đêm và sáng sớm, đồng thời giảm lượng thức ăn khi tôm nổi đầu.", true],
    ["Lúc 14 giờ, pH cao làm tỉ lệ ammonia tồn tại ở dạng NH₃ giảm, nên tôm an toàn với khí độc hơn so với lúc sáng sớm.", false],
  ], "a) Đúng: ban ngày tảo quang hợp tạo oxygen; ban đêm chỉ có hô hấp nên oxygen giảm dần, thấp nhất vào gần sáng – trùng với hiện tượng tôm nổi đầu.\nb) Sai: độ trong thấp, nước xanh đậm là dấu hiệu tảo quá dày; cần ngừng bón phân, thay bớt nước, có thể dùng chế phẩm vi sinh. Bón thêm phân làm tảo càng dày, dễ tàn lụi đồng loạt và thiếu oxygen nghiêm trọng hơn.\nc) Đúng: quạt nước, sục khí làm tăng oxygen hòa tan; giảm thức ăn giúp hạn chế thức ăn thừa phân hủy tiêu thụ oxygen và sinh khí độc.\nd) Sai: pH và nhiệt độ càng cao thì tỉ lệ NH₃ (dạng độc) càng tăng, nên buổi chiều có pH 8,9 và nhiệt độ 32 °C là lúc ammonia độc hơn."),
  tf(3, "HARD", "Một cơ sở nuôi cá rô phi trong hệ thống nuôi tuần hoàn (RAS). Đầu vụ thả 10 000 con cá giống, khối lượng trung bình 20 g/con. Sau 6 tháng thu hoạch được 8 500 con, khối lượng trung bình 600 g/con. Tổng lượng thức ăn đã sử dụng trong vụ là 6 125 kg (số liệu giả định, mang tính minh họa).", [
    ["Tỉ lệ sống của cá trong vụ nuôi là 85%.", true],
    ["Hệ số chuyển hóa thức ăn (FCR) của vụ nuôi xấp xỉ 1,20.", false],
    ["Trong bể lọc sinh học của hệ thống, vi khuẩn nitrat hóa chuyển hóa ammonia thành nitrite rồi thành nitrate ít độc hơn.", true],
    ["Nếu vụ sau FCR tăng lên 1,5 với cùng mức tăng khối lượng của cá thì hiệu quả sử dụng thức ăn tốt hơn vụ này.", false],
  ], "a) Đúng: tỉ lệ sống = 8 500 : 10 000 · 100% = 85%.\nb) Sai: khối lượng cá thu hoạch = 8 500 · 0,6 = 5 100 kg; khối lượng cá thả = 10 000 · 0,02 = 200 kg; khối lượng tăng = 4 900 kg. FCR = lượng thức ăn : khối lượng tăng = 6 125 : 4 900 = 1,25 (giá trị 1,20 là do chia cho khối lượng thu hoạch mà chưa trừ khối lượng cá giống).\nc) Đúng: lọc sinh học dựa vào vi khuẩn nitrat hóa: NH₃/NH₄⁺ → NO₂⁻ → NO₃⁻; nitrate ít độc hơn nhiều so với ammonia và nitrite.\nd) Sai: FCR càng lớn nghĩa là cần nhiều thức ăn hơn cho 1 kg tăng khối lượng, tức hiệu quả sử dụng thức ăn kém hơn."),
];

export const CN_NONG_NGHIEP_EXAM: DemoExam = {
  slug: "cong-nghe-nong-nghiep",
  subjectName: "Công nghệ Nông nghiệp",
  title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Công nghệ Nông nghiệp",
  durationMinutes: 50,
  shortAnswerPoints: "0.25",
  topics: TOPICS,
  description: `${DEMO_NOTE}\nCấu trúc: Phần I – 24 câu trắc nghiệm nhiều lựa chọn (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu). Thời gian làm bài: 50 phút.`,
  questions: QUESTIONS,
};
