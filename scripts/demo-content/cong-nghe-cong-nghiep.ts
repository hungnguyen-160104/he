/**
 * DEMO mock exam for Công nghệ (định hướng Công nghiệp), THPT graduation exam format from 2025:
 * Part I – 24 single-choice questions, Part II – 4 true/false questions, no Part III, 50 minutes.
 * Content follows Công nghệ 12 (Điện – điện tử: national power system, three-phase circuits,
 * household low-voltage network and electrical safety, electronic components, op-amps, digital
 * electronics and microcontrollers) plus one Công nghệ 11 item (internal combustion engines).
 * These are original practice items, not official exam content.
 */
import { createBuilders, DEMO_NOTE, type DemoExam, type DemoQuestion } from "./builders";

const { mc, tf } = createBuilders();

const TOPICS = [
  "Hệ thống điện quốc gia",
  "Mạch điện xoay chiều ba pha",
  "Mạng điện hạ áp trong gia đình và an toàn điện",
  "Linh kiện điện tử",
  "Điện tử tương tự – khuếch đại thuật toán",
  "Điện tử số và vi điều khiển",
  "Động cơ đốt trong (Công nghệ 11)",
];

const QUESTIONS: DemoQuestion[] = [
  // ── Phần I (24 câu) ──
  mc(0, "EASY", "Trong hệ thống điện quốc gia, lưới điện có chức năng", [
    "truyền tải và phân phối điện năng từ nguồn điện đến nơi tiêu thụ",
    "biến đổi các dạng năng lượng khác thành điện năng",
    "biến đổi điện năng thành cơ năng, nhiệt năng, quang năng",
    "lưu trữ điện năng để dự phòng khi nguồn điện bị sự cố",
  ], "A",
    "Hệ thống điện quốc gia gồm nguồn điện (nhà máy điện – biến đổi năng lượng thành điện năng), lưới điện (truyền tải và phân phối điện năng) và phụ tải (tiêu thụ điện năng)."),
  mc(0, "EASY", "Lưới điện truyền tải ở nước ta thường có các cấp điện áp nào sau đây?", [
    "220 kV và 500 kV",
    "0,4 kV và 22 kV",
    "22 kV và 35 kV",
    "220 V và 380 V",
  ], "A",
    "Lưới điện truyền tải dùng điện áp cao và siêu cao (220 kV, 500 kV) để truyền điện năng đi xa; các cấp 35 kV, 22 kV, 0,4 kV (380/220 V) thuộc lưới điện phân phối."),
  mc(0, "MEDIUM", "Điện năng được truyền tải đi xa bằng điện áp cao chủ yếu là để", [
    "giảm cường độ dòng điện trên đường dây, nhờ đó giảm tổn hao công suất do tỏa nhiệt",
    "tăng cường độ dòng điện trên đường dây, nhờ đó điện năng truyền đi nhanh hơn",
    "giảm điện trở của dây dẫn, nhờ đó giảm được tiết diện dây dẫn cần dùng",
    "tăng tần số của dòng điện, nhờ đó giảm sụt áp trên đường dây",
  ], "A",
    "Với cùng công suất truyền tải $P = UI\\cos\\varphi$, điện áp càng cao thì dòng điện càng nhỏ; tổn hao $\\Delta P = I^2R$ giảm theo bình phương dòng điện. Điện trở dây và tần số không phụ thuộc vào điện áp truyền tải."),
  mc(1, "EASY", "Khi nguồn điện hoặc tải ba pha đối xứng được nối hình sao, quan hệ giữa các đại lượng dây và pha là", [
    "$U_d = \\sqrt{3}\\,U_p$ và $I_d = I_p$",
    "$U_d = U_p$ và $I_d = \\sqrt{3}\\,I_p$",
    "$U_d = \\sqrt{3}\\,U_p$ và $I_d = \\sqrt{3}\\,I_p$",
    "$U_d = U_p$ và $I_d = I_p$",
  ], "A",
    "Nối hình sao: dòng điện chạy trong dây pha cũng chính là dòng điện qua mỗi pha nên $I_d = I_p$; điện áp dây lớn gấp √3 lần điện áp pha. (Nối tam giác thì ngược lại: $U_d = U_p$, $I_d = \\sqrt{3}\\,I_p$.)"),
  mc(1, "MEDIUM", "Cần đấu nhiều bóng đèn loại 220 V vào lưới điện ba pha bốn dây 380/220 V sao cho các đèn sáng bình thường kể cả khi số đèn bật ở mỗi pha không bằng nhau. Cách đấu phù hợp là", [
    "chia đều đèn vào ba pha, nối hình sao có dây trung tính",
    "chia đều đèn vào ba pha, nối hình tam giác",
    "chia đều đèn vào ba pha, nối hình sao không có dây trung tính",
    "mắc nối tiếp các đèn rồi nối vào giữa hai dây pha",
  ], "A",
    "Mỗi đèn cần điện áp 220 V = điện áp pha nên phải nối giữa dây pha và dây trung tính (hình sao). Dây trung tính giữ cho điện áp trên mỗi pha luôn bằng 220 V khi tải không đối xứng. Nối tam giác đặt 380 V lên đèn làm đèn hỏng; mắc nối tiếp thì điện áp mỗi đèn thay đổi theo số đèn bật."),
  mc(1, "MEDIUM", "Một tải ba pha đối xứng, mỗi pha là một điện trở thuần 38 Ω, được nối hình tam giác vào lưới điện ba pha có điện áp dây 380 V. Cường độ dòng điện dây xấp xỉ bằng", [
    "17,3 A",
    "10,0 A",
    "5,8 A",
    "30,0 A",
  ], "A",
    "Nối tam giác: $U_p = U_d = 380$ V ⇒ $I_p = \\dfrac{380}{38} = 10$ A ⇒ $I_d = \\sqrt{3}\\,I_p \\approx 17{,}3$ A."),
  mc(1, "MEDIUM", "Một động cơ không đồng bộ ba pha có 2 cặp cực từ ($p = 2$), được cấp điện từ lưới có tần số 50 Hz. Tốc độ quay của từ trường quay trong động cơ là", [
    "1500 vòng/phút",
    "3000 vòng/phút",
    "750 vòng/phút",
    "6000 vòng/phút",
  ], "A",
    "$n_1 = \\dfrac{60f}{p} = \\dfrac{60\\cdot 50}{2} = 1500$ vòng/phút. Rôto của động cơ không đồng bộ quay chậm hơn một chút so với từ trường quay."),
  mc(2, "MEDIUM", "Một bàn là điện có công suất định mức 1000 W, mỗi ngày sử dụng 30 phút ở đúng công suất định mức. Điện năng bàn là tiêu thụ trong 30 ngày là", [
    "15 kWh",
    "30 kWh",
    "1,5 kWh",
    "150 kWh",
  ], "A",
    "$A = P\\cdot t = 1\\text{ kW}\\cdot 0{,}5\\text{ h}\\cdot 30 = 15$ kWh."),
  mc(2, "EASY", "Việc làm nào sau đây đảm bảo an toàn khi sửa chữa đường dây điện trong nhà?", [
    "Ngắt aptomat tổng và treo biển báo trước khi sửa chữa",
    "Dùng tay chạm nhẹ vào dây dẫn để kiểm tra còn điện hay không",
    "Đứng trên nền nhà ẩm ướt, chân trần khi đấu nối dây điện",
    "Dùng tua vít có chuôi bằng kim loại trần để đấu dây",
  ], "A",
    "Phải cắt nguồn điện (ngắt aptomat, cầu dao) và treo biển báo để người khác không đóng điện; dùng dụng cụ có chuôi cách điện, đứng trên vật cách điện khô và kiểm tra điện bằng bút thử điện, tuyệt đối không dùng tay."),
  mc(2, "MEDIUM", "Một mạch điện 220 V cấp cho bếp điện 2000 W, nồi cơm điện 700 W và ấm đun siêu tốc 600 W; các thiết bị có thể dùng đồng thời (coi hệ số công suất bằng 1). Aptomat bảo vệ mạch này nên có dòng điện định mức phù hợp nhất là", [
    "20 A",
    "10 A",
    "6 A",
    "63 A",
  ], "A",
    "Tổng công suất 3300 W ⇒ $I = \\dfrac{3300}{220} = 15$ A. Chọn aptomat có dòng định mức lớn hơn và gần với dòng làm việc nhất: 20 A. Loại 6 A, 10 A sẽ tác động (ngắt) khi dùng đồng thời các thiết bị; loại 63 A quá lớn, không bảo vệ được dây dẫn khi quá tải."),
  mc(3, "EASY", "Một điện trở có các vòng màu theo thứ tự: nâu – đen – đỏ – nhũ vàng. Giá trị và sai số của điện trở là", [
    "1 kΩ, sai số ±5%",
    "100 Ω, sai số ±5%",
    "10 kΩ, sai số ±5%",
    "1 kΩ, sai số ±10%",
  ], "A",
    "Nâu = 1, đen = 0, đỏ = hệ số nhân $10^2$ ⇒ $R = 10\\cdot 10^2 = 1000$ Ω = 1 kΩ; vòng nhũ vàng chỉ sai số ±5% (nhũ bạc là ±10%)."),
  mc(3, "EASY", "Đặc điểm cơ bản của diode bán dẫn là", [
    "chỉ cho dòng điện chạy qua theo một chiều, từ anode sang cathode",
    "cho dòng điện chạy qua theo cả hai chiều như nhau",
    "khuếch đại biên độ của tín hiệu điện đặt vào",
    "ngăn dòng điện một chiều, cho dòng điện xoay chiều đi qua",
  ], "A",
    "Diode có tiếp giáp P–N, khi phân cực thuận (anode dương hơn cathode) thì dẫn điện, phân cực ngược thì gần như không dẫn; nhờ đó diode được dùng để chỉnh lưu. Khuếch đại là chức năng của transistor, ngăn dòng một chiều là đặc điểm của tụ điện."),
  mc(3, "EASY", "Transistor lưỡng cực (BJT) có ba cực là", [
    "cực gốc (B), cực góp (C), cực phát (E)",
    "anode (A), cathode (K), cực điều khiển (G)",
    "cực máng (D), cực nguồn (S), cực cổng (G)",
    "anode (A), cathode (K), cực gốc (B)",
  ], "A",
    "BJT gồm ba cực: base (cực gốc), collector (cực góp), emitter (cực phát). Bộ ba anode – cathode – cực điều khiển là của thyristor; cực máng – nguồn – cổng là của transistor trường (FET)."),
  mc(3, "MEDIUM", "Một LED có điện áp thuận 2 V, dòng điện làm việc 15 mA, được mắc nối tiếp với một điện trở hạn dòng vào nguồn một chiều 5 V. Giá trị điện trở hạn dòng cần dùng là", [
    "200 Ω",
    "333 Ω",
    "133 Ω",
    "20 Ω",
  ], "A",
    "Điện áp trên điện trở: $5 - 2 = 3$ V ⇒ $R = \\dfrac{3\\text{ V}}{0{,}015\\text{ A}} = 200$ Ω."),
  mc(3, "MEDIUM", "Trong mạch chỉnh lưu cầu một pha dùng bốn diode, ở mỗi nửa chu kì của điện áp xoay chiều đầu vào thì", [
    "có hai diode dẫn điện, dòng điện qua tải luôn theo một chiều",
    "chỉ có một diode dẫn điện, dòng điện qua tải đổi chiều liên tục",
    "cả bốn diode cùng dẫn điện, dòng điện qua tải luôn theo một chiều",
    "không có diode nào dẫn điện ở nửa chu kì âm",
  ], "A",
    "Ở mỗi nửa chu kì, một cặp diode đối diện được phân cực thuận và dẫn điện, cặp còn lại bị phân cực ngược; hai cặp luân phiên nhau nên dòng điện qua tải luôn cùng một chiều trong cả hai nửa chu kì (chỉnh lưu hai nửa chu kì)."),
  mc(4, "MEDIUM", "Một mạch khuếch đại đảo dùng khuếch đại thuật toán lí tưởng có điện trở vào $R_1 = 10$ kΩ và điện trở hồi tiếp $R_{ht} = 100$ kΩ. Khi điện áp vào là 0,2 V thì điện áp ra là", [
    "–2 V",
    "2 V",
    "–2,2 V",
    "2,2 V",
  ], "A",
    "Khuếch đại đảo: $U_{ra} = -\\dfrac{R_{ht}}{R_1}U_{\\text{vào}} = -\\dfrac{100}{10}\\cdot 0{,}2 = -2$ V (tín hiệu ra ngược pha tín hiệu vào). Giá trị 2,2 V ứng với công thức của mạch khuếch đại không đảo."),
  mc(4, "EASY", "Khuếch đại thuật toán được dùng làm mạch so sánh (không có hồi tiếp). Khi điện áp ở đầu vào không đảo lớn hơn điện áp ở đầu vào đảo thì điện áp ra", [
    "ở mức bão hòa dương, xấp xỉ điện áp nguồn dương",
    "ở mức bão hòa âm, xấp xỉ điện áp nguồn âm",
    "luôn bằng 0 V",
    "bằng hiệu điện áp giữa hai đầu vào",
  ], "A",
    "Mạch so sánh: hệ số khuếch đại vòng hở rất lớn nên chỉ cần $U_+ > U_-$ là đầu ra lên mức bão hòa dương; ngược lại khi $U_+ < U_-$ thì đầu ra ở mức bão hòa âm."),
  mc(5, "EASY", "Cổng logic hai đầu vào nào sau đây cho đầu ra bằng 0 chỉ khi cả hai đầu vào đều bằng 1?", [
    "Cổng NAND",
    "Cổng AND",
    "Cổng NOR",
    "Cổng XOR",
  ], "A",
    "NAND = AND rồi đảo: chỉ khi hai đầu vào cùng bằng 1 thì đầu ra bằng 0. Cổng AND cho đầu ra 1 khi cả hai đầu vào bằng 1; cổng NOR cho 0 khi có ít nhất một đầu vào bằng 1; cổng XOR cho 0 khi hai đầu vào bằng nhau (cả 00 và 11)."),
  mc(5, "EASY", "Trong hệ thống tưới cây tự động dùng vi điều khiển, cảm biến độ ẩm đất đóng vai trò là", [
    "khối đầu vào, cung cấp tín hiệu về độ ẩm cho vi điều khiển xử lí",
    "khối đầu ra, nhận lệnh từ vi điều khiển để bật, tắt máy bơm",
    "bộ nhớ lưu chương trình điều khiển của vi điều khiển",
    "khối nguồn cung cấp năng lượng cho toàn bộ mạch điện",
  ], "A",
    "Cảm biến thu nhận thông tin từ môi trường và gửi tín hiệu vào vi điều khiển (khối đầu vào); vi điều khiển xử lí theo chương trình rồi điều khiển cơ cấu chấp hành như máy bơm, rơ le (khối đầu ra)."),
  mc(6, "EASY", "Ở động cơ đốt trong 4 kì, để hoàn thành một chu trình làm việc thì trục khuỷu quay", [
    "2 vòng (720°)",
    "1 vòng (360°)",
    "4 vòng (1440°)",
    "nửa vòng (180°)",
  ], "A",
    "Chu trình 4 kì gồm nạp – nén – cháy dãn nở (sinh công) – thải; mỗi kì piston đi một hành trình ứng với nửa vòng quay trục khuỷu, nên 4 kì ứng với 2 vòng quay (720°)."),
  mc(1, "HARD", "Một động cơ điện ba pha làm việc ở lưới điện có điện áp dây 380 V, cường độ dòng điện dây 10 A và hệ số công suất 0,8. Công suất tác dụng của động cơ xấp xỉ bằng", [
    "5,27 kW",
    "3,04 kW",
    "9,12 kW",
    "6,58 kW",
  ], "A",
    "$P = \\sqrt{3}\\,U_d I_d\\cos\\varphi = \\sqrt{3}\\cdot 380\\cdot 10\\cdot 0{,}8 \\approx 5265$ W ≈ 5,27 kW. Giá trị 6,58 kW là công suất biểu kiến $S = \\sqrt{3}\\,U_d I_d$ (chưa nhân $\\cos\\varphi$); 3,04 kW và 9,12 kW là do dùng sai hệ số 1 hoặc 3 thay cho √3."),
  mc(2, "HARD", "Giả sử biểu giá bán lẻ điện sinh hoạt (chưa gồm thuế) như sau: bậc 1 (từ 0 đến 50 kWh): 1 900 đồng/kWh; bậc 2 (từ 51 đến 100 kWh): 2 000 đồng/kWh; bậc 3 (từ 101 đến 200 kWh): 2 300 đồng/kWh. Trong một tháng, công tơ điện của một hộ gia đình có chỉ số đầu kì là 2 350 kWh và chỉ số cuối kì là 2 500 kWh. Số tiền điện (chưa gồm thuế) hộ phải trả là", [
    "310 000 đồng",
    "345 000 đồng",
    "285 000 đồng",
    "300 000 đồng",
  ], "A",
    "Điện năng tiêu thụ: 2 500 – 2 350 = 150 kWh, chia theo bậc: 50 kWh bậc 1, 50 kWh bậc 2, 50 kWh bậc 3.\nTiền điện = 50 · 1 900 + 50 · 2 000 + 50 · 2 300 = 95 000 + 100 000 + 115 000 = 310 000 đồng. (Tính cả 150 kWh theo một mức giá duy nhất là sai cách tính bậc thang.)"),
  mc(4, "HARD", "Một mạch khuếch đại không đảo dùng khuếch đại thuật toán lí tưởng, điện trở $R_1 = 1$ kΩ nối từ đầu vào đảo xuống đất, điện trở hồi tiếp $R_{ht}$ nối từ đầu ra về đầu vào đảo. Khi điện áp vào là 0,3 V thì điện áp ra đo được là 3,3 V. Giá trị của $R_{ht}$ là", [
    "10 kΩ",
    "11 kΩ",
    "1 kΩ",
    "110 kΩ",
  ], "A",
    "Hệ số khuếch đại $K = \\dfrac{3{,}3}{0{,}3} = 11$. Khuếch đại không đảo: $K = 1 + \\dfrac{R_{ht}}{R_1} \\Rightarrow R_{ht} = (11 - 1)\\cdot 1\\text{ kΩ} = 10$ kΩ. Giá trị 11 kΩ là do dùng nhầm công thức khuếch đại đảo $|K| = \\dfrac{R_{ht}}{R_1}$."),
  mc(5, "HARD", "Cho mạch logic: hai tín hiệu A và B đưa vào một cổng NOR; đầu ra của cổng NOR cùng với tín hiệu C đưa vào một cổng AND, đầu ra của cổng AND là Y. Tổ hợp tín hiệu vào nào sau đây cho Y = 1?", [
    "A = 0, B = 0, C = 1",
    "A = 1, B = 0, C = 1",
    "A = 0, B = 0, C = 0",
    "A = 1, B = 1, C = 1",
  ], "A",
    "$Y = \\overline{A + B}\\cdot C$. Để Y = 1 cần đồng thời $\\overline{A + B} = 1$ (tức A = B = 0) và C = 1. Chỉ tổ hợp A = 0, B = 0, C = 1 thỏa mãn; nếu A hoặc B bằng 1 thì đầu ra NOR bằng 0, còn nếu C = 0 thì đầu ra AND bằng 0."),
  // ── Phần II (4 câu đúng/sai) ──
  tf(2, "MEDIUM", "Một hộ gia đình dùng điện áp 220 V, các thiết bị và thời gian sử dụng trung bình mỗi ngày như sau:\n– 1 điều hòa nhiệt độ 1100 W, dùng 8 giờ;\n– 1 bình nóng lạnh 2500 W, dùng 1 giờ;\n– 5 bóng đèn LED, mỗi bóng 20 W, dùng 6 giờ;\n– 1 tủ lạnh có công suất trung bình 150 W, hoạt động 24 giờ.\nCoi các thiết bị làm việc đúng công suất nêu trên, hệ số công suất bằng 1; giá điện bình quân là 2 500 đồng/kWh; một tháng tính 30 ngày.", [
    ["Điện năng tiêu thụ của điều hòa nhiệt độ trong một ngày là 8,8 kWh.", true],
    ["Khi tất cả các thiết bị cùng hoạt động, cường độ dòng điện tổng chạy qua aptomat tổng là 17,5 A.", true],
    ["Điện năng tiêu thụ của hộ gia đình trong một tháng là 465 kWh.", true],
    ["Số tiền điện hộ gia đình phải trả trong một tháng là 1 395 000 đồng.", false],
  ], "a) Đúng: $A = 1{,}1\\text{ kW}\\cdot 8\\text{ h} = 8{,}8$ kWh.\nb) Đúng: $P = 1100 + 2500 + 5\\cdot 20 + 150 = 3850$ W ⇒ $I = \\dfrac{3850}{220} = 17{,}5$ A.\nc) Đúng: mỗi ngày: điều hòa 8,8 kWh; bình nóng lạnh 2,5 kWh; đèn LED $5\\cdot 20\\cdot 6 = 600$ Wh = 0,6 kWh; tủ lạnh $0{,}15\\cdot 24 = 3{,}6$ kWh ⇒ tổng 15,5 kWh/ngày ⇒ 30 ngày: 465 kWh.\nd) Sai: tiền điện = 465 · 2 500 = 1 162 500 đồng."),
  tf(1, "HARD", "Một tải ba pha đối xứng gồm ba cuộn dây giống nhau, mỗi cuộn có điện trở $R = 6$ Ω và cảm kháng $X_L = 8$ Ω. Tải được đấu vào lưới điện ba pha bốn dây 380/220 V (điện áp dây 380 V, điện áp pha 220 V).", [
    ["Tổng trở của mỗi pha tải là 14 Ω.", false],
    ["Khi tải nối hình sao, cường độ dòng điện dây là 22 A.", true],
    ["Khi tải nối hình sao, công suất tác dụng của tải xấp xỉ 8,7 kW.", true],
    ["Nếu chuyển sang nối hình tam giác trên cùng lưới điện đó thì cường độ dòng điện chạy qua mỗi pha của tải tăng gấp 3 lần so với khi nối hình sao.", false],
  ], "a) Sai: $Z = \\sqrt{R^2 + X_L^2} = \\sqrt{6^2 + 8^2} = 10$ Ω (không cộng trực tiếp R và $X_L$); $\\cos\\varphi = \\dfrac{R}{Z} = 0{,}6$.\nb) Đúng: nối sao: $U_p = 220$ V ⇒ $I_p = \\dfrac{220}{10} = 22$ A, và $I_d = I_p = 22$ A.\nc) Đúng: $P = 3U_pI_p\\cos\\varphi = 3\\cdot 220\\cdot 22\\cdot 0{,}6 = 8712$ W ≈ 8,7 kW (tính theo $\\sqrt{3}\\,U_dI_d\\cos\\varphi$ cũng được ≈ 8,7 kW).\nd) Sai: nối tam giác: $U_p = U_d = 380$ V ⇒ $I_p = 38$ A, chỉ tăng √3 ≈ 1,73 lần so với 22 A; dòng điện dây $I_d = \\sqrt{3}\\cdot 38 \\approx 65{,}8$ A mới tăng khoảng 3 lần."),
  tf(4, "HARD", "Một mạch khuếch đại đảo dùng khuếch đại thuật toán (coi là lí tưởng) được cấp nguồn đối xứng ±12 V, điện áp ra chỉ thay đổi trong khoảng từ –12 V đến +12 V (giới hạn bão hòa). Điện trở $R_1 = 4{,}7$ kΩ nối từ tín hiệu vào đến đầu vào đảo, điện trở hồi tiếp $R_{ht} = 47$ kΩ nối từ đầu ra về đầu vào đảo, đầu vào không đảo nối đất.", [
    ["Hệ số khuếch đại điện áp của mạch là –10, tín hiệu ra ngược pha với tín hiệu vào.", true],
    ["Khi đặt vào mạch điện áp một chiều 0,5 V thì điện áp ra là +5 V.", false],
    ["Khi tín hiệu vào là điện áp hình sin có biên độ 2 V thì tín hiệu ra là điện áp hình sin có biên độ 20 V.", false],
    ["Muốn độ lớn hệ số khuếch đại bằng 20 mà vẫn giữ nguyên $R_1$ thì cần thay $R_{ht}$ bằng điện trở 94 kΩ.", true],
  ], "a) Đúng: $K = -\\dfrac{R_{ht}}{R_1} = -\\dfrac{47}{4{,}7} = -10$; dấu trừ thể hiện tín hiệu ra ngược pha.\nb) Sai: $U_{ra} = -10\\cdot 0{,}5 = -5$ V.\nc) Sai: theo tính toán biên độ ra là 20 V, vượt giới hạn bão hòa 12 V nên tín hiệu ra bị xén đỉnh ở khoảng ±12 V, không còn là hình sin.\nd) Đúng: $R_{ht} = |K|\\cdot R_1 = 20\\cdot 4{,}7 = 94$ kΩ."),
  tf(5, "MEDIUM", "Một mạch báo động trong xưởng sản xuất nhận tín hiệu logic từ ba cảm biến A, B, C (mức 1: có sự cố, mức 0: bình thường). Tín hiệu A và B được đưa vào một cổng AND; đầu ra của cổng AND cùng với tín hiệu C được đưa vào một cổng OR; đầu ra của cổng OR là tín hiệu Y điều khiển còi (Y = 1 thì còi kêu).", [
    ["Biểu thức logic của mạch là $Y = A\\cdot B + C$.", true],
    ["Khi A = 1, B = 0, C = 0 thì còi kêu.", false],
    ["Trong bảng chân lí của mạch (8 tổ hợp tín hiệu vào) có đúng 4 tổ hợp cho Y = 1.", false],
    ["Nếu thay cổng OR bằng cổng NOR thì còi chỉ kêu khi cả ba cảm biến đều báo sự cố.", false],
  ], "a) Đúng: cổng AND cho $A\\cdot B$, cổng OR cộng thêm C ⇒ $Y = A\\cdot B + C$.\nb) Sai: $A\\cdot B = 1\\cdot 0 = 0$ và C = 0 ⇒ Y = 0, còi không kêu.\nc) Sai: Y = 1 khi C = 1 (4 tổ hợp: 001, 011, 101, 111) hoặc khi A = B = 1, C = 0 (tổ hợp 110) ⇒ có 5 tổ hợp.\nd) Sai: với cổng NOR, $Y = \\overline{A\\cdot B + C}$; khi A = B = C = 1 thì Y = 0 nên còi không kêu; còi lại kêu khi C = 0 và A, B không đồng thời bằng 1 (kể cả khi không có sự cố nào)."),
];

export const CN_CONG_NGHIEP_EXAM: DemoExam = {
  slug: "cong-nghe-cong-nghiep",
  subjectName: "Công nghệ Công nghiệp",
  title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Công nghệ Công nghiệp",
  durationMinutes: 50,
  shortAnswerPoints: "0.25",
  topics: TOPICS,
  description: `${DEMO_NOTE}\nCấu trúc: Phần I – 24 câu trắc nghiệm nhiều lựa chọn (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu). Thời gian làm bài: 50 phút.`,
  questions: QUESTIONS,
};
