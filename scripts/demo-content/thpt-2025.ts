/**
 * DEMO exam content modelled on the structure/format of the Vietnamese THPT graduation exam from
 * 2025 (Bộ GD&ĐT): three parts — I. multiple choice (4 options), II. true/false (4 statements,
 * scored 0.1/0.25/0.5/1 for 1/2/3/4 correct statements), III. short numeric answer.
 *   Toán:    22 questions (12 / 4 / 6), 90 minutes, part III = 0.5 point each  → 3 + 4 + 3   = 10
 *   Vật lí:  28 questions (18 / 4 / 6), 50 minutes, part III = 0.25 point each → 4.5 + 4 + 1.5 = 10
 *   Hóa học: 28 questions (18 / 4 / 6), 50 minutes, part III = 0.25 point each → 4.5 + 4 + 1.5 = 10
 * All questions are ORIGINAL practice items written for this demo (not copied from any official
 * exam). Every item ships with a worked solution. Remove with `pnpm seed:demo --remove`.
 */
import { createBuilders, DEMO_NOTE, type DemoExam, type DemoQuestion } from "./builders";

export type { DemoExam, DemoQuestion } from "./builders";

// One builder shared by Toán/Vật lí/Hóa học keeps their answer-letter spread unchanged.
const { mc, tf, sa } = createBuilders();

const NOTE = `${DEMO_NOTE} (3 phần: trắc nghiệm nhiều lựa chọn, đúng/sai, trả lời ngắn).`;

// ═════════════════════════════════════ TOÁN ═════════════════════════════════════
const TOAN_TOPICS = [
  "Ứng dụng đạo hàm và khảo sát hàm số",
  "Hàm số mũ và logarit",
  "Nguyên hàm – tích phân",
  "Hình học không gian",
  "Phương pháp tọa độ trong không gian",
  "Thống kê và xác suất",
  "Lượng giác – dãy số",
];

const TOAN: DemoQuestion[] = [
  // ── Phần I ──
  mc(6, "EASY", "Nghiệm của phương trình $\\cos x = \\dfrac{1}{2}$ là", ["$x = \\pm\\dfrac{\\pi}{3} + k2\\pi,\\ k\\in\\mathbb{Z}$", "$x = \\pm\\dfrac{\\pi}{6} + k2\\pi,\\ k\\in\\mathbb{Z}$", "$x = \\dfrac{\\pi}{3} + k\\pi,\\ k\\in\\mathbb{Z}$", "$x = \\pm\\dfrac{2\\pi}{3} + k2\\pi,\\ k\\in\\mathbb{Z}$"], "A",
    "Vì $\\cos\\dfrac{\\pi}{3} = \\dfrac{1}{2}$ nên $\\cos x = \\cos\\dfrac{\\pi}{3} \\Leftrightarrow x = \\pm\\dfrac{\\pi}{3} + k2\\pi,\\ k\\in\\mathbb{Z}$."),
  mc(1, "EASY", "Nghiệm của phương trình $\\log_2(x - 1) = 3$ là", ["$x = 7$", "$x = 8$", "$x = 9$", "$x = 10$"], "C",
    "Điều kiện $x > 1$. Ta có $\\log_2(x-1) = 3 \\Leftrightarrow x - 1 = 2^3 = 8 \\Leftrightarrow x = 9$ (thỏa mãn)."),
  mc(6, "EASY", "Cho cấp số cộng $(u_n)$ có $u_1 = 2$ và công sai $d = 3$. Số hạng $u_{10}$ bằng", ["$29$", "$32$", "$30$", "$27$"], "A",
    "$u_{10} = u_1 + 9d = 2 + 9\\cdot 3 = 29$."),
  mc(0, "EASY", "Hàm số $y = x^3 - 3x^2 + 2$ đồng biến trên khoảng nào dưới đây?", ["$(0;\\,2)$", "$(-\\infty;\\,0)$", "$(-1;\\,3)$", "$(1;\\,+\\infty)$"], "B",
    "$y' = 3x^2 - 6x = 3x(x-2)$; $y' > 0 \\Leftrightarrow x < 0$ hoặc $x > 2$. Vậy hàm số đồng biến trên $(-\\infty;0)$ và $(2;+\\infty)$. Trong các khoảng đã cho chỉ có $(-\\infty;0)$ thỏa mãn (khoảng $(1;+\\infty)$ chứa $(1;2)$ là nơi hàm số nghịch biến)."),
  mc(0, "MEDIUM", "Giá trị lớn nhất của hàm số $f(x) = x^3 - 3x + 1$ trên đoạn $[0;\\,2]$ bằng", ["$3$", "$1$", "$-1$", "$5$"], "A",
    "$f'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$; trên $[0;2]$ chỉ lấy $x = 1$. Ta có $f(0) = 1$, $f(1) = -1$, $f(2) = 3$. Vậy $\\max\\limits_{[0;2]} f(x) = f(2) = 3$."),
  mc(0, "EASY", "Tiệm cận đứng của đồ thị hàm số $y = \\dfrac{2x + 1}{x - 1}$ là đường thẳng", ["$x = 1$", "$x = 2$", "$y = 2$", "$x = -1$"], "A",
    "$\\lim\\limits_{x\\to 1^+} \\dfrac{2x+1}{x-1} = +\\infty$ nên $x = 1$ là tiệm cận đứng ($y = 2$ là tiệm cận ngang)."),
  mc(2, "EASY", "Họ nguyên hàm của hàm số $f(x) = 3x^2 + 2x$ là", ["$x^3 + x^2 + C$", "$6x + 2 + C$", "$x^3 + 2x^2 + C$", "$3x^3 + x^2 + C$"], "A",
    "$\\displaystyle\\int (3x^2 + 2x)\\,dx = 3\\cdot\\dfrac{x^3}{3} + 2\\cdot\\dfrac{x^2}{2} + C = x^3 + x^2 + C$."),
  mc(2, "EASY", "Cho $\\displaystyle\\int_0^2 f(x)\\,dx = 3$ và $\\displaystyle\\int_0^2 g(x)\\,dx = -1$. Giá trị của $\\displaystyle\\int_0^2 \\big[2f(x) - g(x)\\big]\\,dx$ bằng", ["$7$", "$5$", "$1$", "$-7$"], "A",
    "$\\displaystyle\\int_0^2 [2f(x) - g(x)]\\,dx = 2\\int_0^2 f(x)\\,dx - \\int_0^2 g(x)\\,dx = 2\\cdot 3 - (-1) = 7$."),
  mc(4, "EASY", "Trong không gian $Oxyz$, cho $\\vec a = (1;\\,-2;\\,3)$ và $\\vec b = (2;\\,1;\\,0)$. Tích vô hướng $\\vec a\\cdot\\vec b$ bằng", ["$0$", "$4$", "$-4$", "$2$"], "A",
    "$\\vec a\\cdot\\vec b = 1\\cdot 2 + (-2)\\cdot 1 + 3\\cdot 0 = 0$ (hai vectơ vuông góc)."),
  mc(4, "MEDIUM", "Trong không gian $Oxyz$, khoảng cách từ gốc tọa độ $O$ đến mặt phẳng $(P): 2x - y + 2z - 3 = 0$ bằng", ["$1$", "$3$", "$\\dfrac{1}{3}$", "$2$"], "A",
    "$d(O,(P)) = \\dfrac{|2\\cdot 0 - 0 + 2\\cdot 0 - 3|}{\\sqrt{2^2 + (-1)^2 + 2^2}} = \\dfrac{3}{3} = 1$."),
  mc(5, "EASY", "Thời gian tập thể dục mỗi ngày (phút) của 40 học sinh được cho trong bảng:\n[10; 20): 5 học sinh; [20; 30): 12 học sinh; [30; 40): 15 học sinh; [40; 50): 6 học sinh; [50; 60): 2 học sinh.\nKhoảng biến thiên của mẫu số liệu ghép nhóm trên là", ["$50$", "$40$", "$15$", "$13$"], "A",
    "Khoảng biến thiên của mẫu số liệu ghép nhóm bằng đầu mút phải của nhóm cuối trừ đầu mút trái của nhóm đầu: $R = 60 - 10 = 50$ (phút)."),
  mc(3, "MEDIUM", "Cho hình lập phương $ABCD.A'B'C'D'$. Góc giữa hai đường thẳng $AC$ và $A'D'$ bằng", ["$45^\\circ$", "$30^\\circ$", "$60^\\circ$", "$90^\\circ$"], "A",
    "Vì $A'D' \\parallel AD$ nên góc giữa $AC$ và $A'D'$ bằng góc giữa $AC$ và $AD$. Trong hình vuông $ABCD$, đường chéo $AC$ tạo với cạnh $AD$ góc $45^\\circ$."),
  // ── Phần II ──
  tf(0, "MEDIUM", "Cho hàm số $f(x) = x^3 - 3x^2 - 9x + 5$.", [
    ["$f'(x) = 3x^2 - 6x - 9$.", true],
    ["Hàm số đồng biến trên khoảng $(-1;\\,3)$.", false],
    ["Giá trị cực đại của hàm số bằng $10$.", true],
    ["Giá trị nhỏ nhất của hàm số trên đoạn $[0;\\,4]$ bằng $-15$.", false],
  ], "a) Đúng: $f'(x) = 3x^2 - 6x - 9 = 3(x+1)(x-3)$.\nb) Sai: $f'(x) < 0$ với $x\\in(-1;3)$ nên hàm số nghịch biến trên $(-1;3)$.\nc) Đúng: $f'$ đổi dấu từ $+$ sang $-$ tại $x = -1$ nên $f_{CĐ} = f(-1) = -1 - 3 + 9 + 5 = 10$.\nd) Sai: $f(0) = 5$, $f(3) = -22$, $f(4) = -15$ nên $\\min\\limits_{[0;4]} f(x) = -22$."),
  tf(2, "MEDIUM", "Một vật chuyển động thẳng với vận tốc $v(t) = 3t^2 + 2$ (m/s), trong đó $t$ (giây) là thời gian kể từ lúc bắt đầu chuyển động.", [
    ["Quãng đường vật đi được từ $t = 0$ đến $t = 2$ là $12$ m.", true],
    ["Gia tốc của vật tại thời điểm $t = 1$ là $6$ m/s².", true],
    ["Vận tốc của vật tại thời điểm $t = 2$ là $12$ m/s.", false],
    ["Quãng đường vật đi được trong giây thứ ba (từ $t = 2$ đến $t = 3$) là $21$ m.", true],
  ], "a) Đúng: $s = \\displaystyle\\int_0^2 (3t^2 + 2)\\,dt = \\big[t^3 + 2t\\big]_0^2 = 12$ (m).\nb) Đúng: $a(t) = v'(t) = 6t \\Rightarrow a(1) = 6$ (m/s²).\nc) Sai: $v(2) = 3\\cdot 4 + 2 = 14$ (m/s).\nd) Đúng: $\\displaystyle\\int_2^3 (3t^2 + 2)\\,dt = (27 + 6) - (8 + 4) = 21$ (m)."),
  tf(4, "MEDIUM", "Trong không gian $Oxyz$, cho hai điểm $A(1;\\,0;\\,2)$, $B(3;\\,2;\\,0)$ và mặt phẳng $(P): x + y + z - 3 = 0$.", [
    ["Trung điểm của đoạn thẳng $AB$ là $I(2;\\,1;\\,1)$.", true],
    ["Độ dài đoạn thẳng $AB$ bằng $2\\sqrt{2}$.", false],
    ["Điểm $I$ thuộc mặt phẳng $(P)$.", false],
    ["Mặt phẳng trung trực của đoạn $AB$ có phương trình $x + y - z - 2 = 0$.", true],
  ], "a) Đúng: $I\\left(\\dfrac{1+3}{2};\\dfrac{0+2}{2};\\dfrac{2+0}{2}\\right) = (2;1;1)$.\nb) Sai: $\\overrightarrow{AB} = (2;2;-2) \\Rightarrow AB = \\sqrt{4+4+4} = 2\\sqrt{3}$.\nc) Sai: $2 + 1 + 1 - 3 = 1 \\ne 0$.\nd) Đúng: mặt phẳng trung trực qua $I$, nhận $\\tfrac{1}{2}\\overrightarrow{AB} = (1;1;-1)$ làm vectơ pháp tuyến: $(x-2) + (y-1) - (z-1) = 0 \\Leftrightarrow x + y - z - 2 = 0$."),
  tf(5, "MEDIUM", "Một lớp học có 40 học sinh, trong đó có 25 học sinh nữ. Có 15 học sinh nữ và 5 học sinh nam đạt loại giỏi môn Toán. Chọn ngẫu nhiên một học sinh của lớp. Gọi $A$ là biến cố \"Chọn được học sinh nữ\", $B$ là biến cố \"Chọn được học sinh giỏi Toán\".", [
    ["$P(A) = \\dfrac{5}{8}$.", true],
    ["$P(B) = \\dfrac{1}{2}$.", true],
    ["$P(B\\mid A) = \\dfrac{3}{8}$.", false],
    ["$P(A\\mid B) = \\dfrac{3}{5}$.", false],
  ], "a) Đúng: $P(A) = \\dfrac{25}{40} = \\dfrac{5}{8}$.\nb) Đúng: có $15 + 5 = 20$ học sinh giỏi Toán nên $P(B) = \\dfrac{20}{40} = \\dfrac{1}{2}$.\nc) Sai: $P(B\\mid A) = \\dfrac{P(AB)}{P(A)} = \\dfrac{15/40}{25/40} = \\dfrac{3}{5}$.\nd) Sai: $P(A\\mid B) = \\dfrac{P(AB)}{P(B)} = \\dfrac{15}{20} = \\dfrac{3}{4}$."),
  // ── Phần III ──
  sa(2, "EASY", "Tính tích phân $I = \\displaystyle\\int_1^2 (2x + 1)\\,dx$.", "4",
    "$I = \\big[x^2 + x\\big]_1^2 = (4 + 2) - (1 + 1) = 4$."),
  sa(3, "MEDIUM", "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh bằng $2$, cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA = 6$. Tính thể tích của khối chóp $S.ABCD$.", "8",
    "$V = \\dfrac{1}{3}\\cdot S_{ABCD}\\cdot SA = \\dfrac{1}{3}\\cdot 2^2\\cdot 6 = 8$."),
  sa(5, "MEDIUM", "Một hộp có 5 viên bi đỏ và 3 viên bi xanh. Lấy ngẫu nhiên đồng thời 2 viên bi. Tính xác suất để lấy được 2 viên bi đỏ (kết quả làm tròn đến hàng phần trăm).", "0,36",
    "$n(\\Omega) = C_8^2 = 28$; số cách lấy 2 bi đỏ là $C_5^2 = 10$. Xác suất $P = \\dfrac{10}{28} \\approx 0{,}357 \\approx 0{,}36$."),
  sa(0, "HARD", "Từ một tấm bìa hình vuông cạnh 12 cm, người ta cắt bỏ bốn hình vuông bằng nhau ở bốn góc rồi gấp phần còn lại thành một chiếc hộp không nắp. Hỏi cạnh của hình vuông bị cắt bỏ bằng bao nhiêu xentimét để thể tích chiếc hộp lớn nhất?", "2",
    "Gọi cạnh hình vuông cắt bỏ là $x$ ($0 < x < 6$). Thể tích hộp $V(x) = x(12 - 2x)^2$.\n$V'(x) = (12-2x)^2 - 4x(12-2x) = (12-2x)(12-6x)$; $V'(x) = 0 \\Leftrightarrow x = 2$ (vì $x < 6$). $V'$ đổi dấu từ $+$ sang $-$ tại $x = 2$ nên $V$ lớn nhất khi $x = 2$ cm ($V_{\\max} = 128$ cm³)."),
  sa(1, "HARD", "Một người gửi tiết kiệm 100 triệu đồng với lãi suất 6% một năm theo hình thức lãi kép (lãi mỗi năm được nhập vào vốn). Hỏi sau ít nhất bao nhiêu năm thì người đó có tổng số tiền (cả vốn và lãi) vượt quá 150 triệu đồng? (Giả sử lãi suất không đổi và người đó không rút tiền.)", "7",
    "Sau $n$ năm số tiền là $100\\cdot 1{,}06^n$ (triệu đồng). Cần $1{,}06^n > 1{,}5 \\Leftrightarrow n > \\log_{1{,}06} 1{,}5 \\approx 6{,}96$. Vậy $n = 7$ (kiểm tra: $1{,}06^6 \\approx 1{,}419$, $1{,}06^7 \\approx 1{,}504$)."),
  sa(4, "HARD", "Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 25$ và mặt phẳng $(P): 2x - 2y + z + 3 = 0$. Biết $(P)$ cắt $(S)$ theo một đường tròn. Tính bán kính của đường tròn đó.", "3",
    "Mặt cầu có tâm $I(1;-2;3)$, bán kính $R = 5$. Khoảng cách $d = \\dfrac{|2 + 4 + 3 + 3|}{\\sqrt{4 + 4 + 1}} = \\dfrac{12}{3} = 4$. Bán kính đường tròn giao tuyến $r = \\sqrt{R^2 - d^2} = \\sqrt{25 - 16} = 3$."),
];

// ═════════════════════════════════════ VẬT LÍ ═════════════════════════════════════
const LY_TOPICS = ["Vật lí nhiệt", "Khí lí tưởng", "Từ trường", "Vật lí hạt nhân"];
const LY_NOTE_CONST = "Cho: $R = 8{,}31$ J/(mol.K); $k = 1{,}38\\cdot 10^{-23}$ J/K; $1\\,\\text{u} = 931{,}5$ MeV/c².";

const LY: DemoQuestion[] = [
  // ── Phần I (18 câu) ──
  mc(0, "EASY", "Nhiệt độ $27\\,^\\circ\\text{C}$ ứng với nhiệt độ nào trong thang nhiệt độ Kelvin?", ["$300$ K", "$246$ K", "$273$ K", "$327$ K"], "A",
    "$T = t + 273 = 27 + 273 = 300$ K."),
  mc(0, "EASY", "Nội năng của một vật là", ["tổng động năng và thế năng tương tác của các phân tử cấu tạo nên vật", "tổng động năng của vật", "nhiệt lượng mà vật nhận được", "thế năng của vật trong trọng trường"], "A",
    "Theo định nghĩa, nội năng của vật là tổng động năng chuyển động nhiệt và thế năng tương tác của các phân tử cấu tạo nên vật."),
  mc(0, "EASY", "Nhiệt lượng cần cung cấp để làm nóng 2 kg nước từ $20\\,^\\circ\\text{C}$ lên $70\\,^\\circ\\text{C}$ là bao nhiêu? Biết nhiệt dung riêng của nước là $4200$ J/(kg.K).", ["$420$ kJ", "$210$ kJ", "$588$ kJ", "$168$ kJ"], "A",
    "$Q = mc\\Delta t = 2\\cdot 4200\\cdot (70 - 20) = 420\\,000$ J $= 420$ kJ."),
  mc(0, "MEDIUM", "Biết nhiệt nóng chảy riêng của nước đá là $3{,}34\\cdot 10^5$ J/kg. Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn 0,5 kg nước đá ở $0\\,^\\circ\\text{C}$ là", ["$1{,}67\\cdot 10^5$ J", "$3{,}34\\cdot 10^5$ J", "$6{,}68\\cdot 10^5$ J", "$1{,}67\\cdot 10^4$ J"], "A",
    "$Q = \\lambda m = 3{,}34\\cdot 10^5\\cdot 0{,}5 = 1{,}67\\cdot 10^5$ J."),
  mc(0, "MEDIUM", "Một khối khí nhận nhiệt lượng 100 J và thực hiện công 40 J lên môi trường. Độ biến thiên nội năng của khối khí là", ["$60$ J", "$140$ J", "$-60$ J", "$40$ J"], "A",
    "Theo định luật I nhiệt động lực học $\\Delta U = A + Q$ với $Q = +100$ J (nhận nhiệt), $A = -40$ J (khí thực hiện công). Vậy $\\Delta U = 60$ J."),
  mc(0, "EASY", "Sự chuyển từ thể lỏng sang thể khí xảy ra ở bề mặt chất lỏng được gọi là", ["sự bay hơi", "sự sôi", "sự ngưng tụ", "sự thăng hoa"], "A",
    "Bay hơi là quá trình hóa hơi xảy ra ở bề mặt chất lỏng; sôi là hóa hơi xảy ra cả ở bề mặt và trong lòng chất lỏng."),
  mc(1, "EASY", "Một lượng khí lí tưởng có thể tích 6 lít ở áp suất 1 atm. Nén đẳng nhiệt lượng khí đến thể tích 2 lít thì áp suất của khí là", ["$3$ atm", "$2$ atm", "$\\dfrac{1}{3}$ atm", "$12$ atm"], "A",
    "Định luật Boyle: $p_1V_1 = p_2V_2 \\Rightarrow p_2 = \\dfrac{1\\cdot 6}{2} = 3$ atm."),
  mc(1, "MEDIUM", "Một lượng khí lí tưởng có thể tích 3 lít ở $27\\,^\\circ\\text{C}$. Nung nóng đẳng áp lượng khí đến $127\\,^\\circ\\text{C}$ thì thể tích của khí là", ["$4$ lít", "$14{,}1$ lít", "$2{,}25$ lít", "$3{,}5$ lít"], "A",
    "Định luật Charles: $\\dfrac{V_1}{T_1} = \\dfrac{V_2}{T_2} \\Rightarrow V_2 = 3\\cdot\\dfrac{400}{300} = 4$ lít (chú ý dùng nhiệt độ Kelvin)."),
  mc(1, "EASY", "Ở điều kiện $0\\,^\\circ\\text{C}$ và áp suất 1 atm, 1 mol khí lí tưởng chiếm thể tích xấp xỉ", ["$22{,}4$ lít", "$24{,}8$ lít", "$11{,}2$ lít", "$2{,}24$ lít"], "A",
    "$V = \\dfrac{nRT}{p} = \\dfrac{1\\cdot 8{,}31\\cdot 273}{1{,}013\\cdot 10^5} \\approx 0{,}0224$ m³ $= 22{,}4$ lít."),
  mc(1, "MEDIUM", "Khi nhiệt độ tuyệt đối của một khối khí lí tưởng tăng gấp đôi thì động năng tịnh tiến trung bình của các phân tử khí", ["tăng gấp đôi", "tăng gấp bốn", "tăng $\\sqrt{2}$ lần", "không đổi"], "A",
    "$\\overline{W}_đ = \\dfrac{3}{2}kT$ tỉ lệ thuận với nhiệt độ tuyệt đối $T$, nên tăng gấp đôi."),
  mc(1, "EASY", "Phát biểu nào sau đây là SAI khi nói về mô hình khí lí tưởng?", ["Các phân tử chuyển động hỗn loạn không ngừng.", "Kích thước của các phân tử có thể bỏ qua.", "Các phân tử chỉ tương tác với nhau khi va chạm.", "Giữa các phân tử luôn có lực hút rất mạnh."], "D",
    "Trong mô hình khí lí tưởng, các phân tử chỉ tương tác khi va chạm, lực tương tác giữa chúng khi không va chạm được bỏ qua. Vì vậy phát biểu \"giữa các phân tử luôn có lực hút rất mạnh\" là sai."),
  mc(2, "EASY", "Một đoạn dây dẫn thẳng dài 0,2 m mang dòng điện 4 A đặt vuông góc với các đường sức của một từ trường đều có cảm ứng từ 0,5 T. Độ lớn lực từ tác dụng lên đoạn dây là", ["$0{,}4$ N", "$0{,}2$ N", "$0{,}8$ N", "$4$ N"], "A",
    "$F = BIL\\sin\\alpha = 0{,}5\\cdot 4\\cdot 0{,}2\\cdot\\sin 90^\\circ = 0{,}4$ N."),
  mc(2, "EASY", "Đơn vị đo cảm ứng từ trong hệ SI là", ["tesla (T)", "weber (Wb)", "henry (H)", "vôn (V)"], "A",
    "Cảm ứng từ có đơn vị tesla (T); weber là đơn vị của từ thông."),
  mc(2, "MEDIUM", "Một khung dây phẳng có diện tích $0{,}02$ m² đặt trong từ trường đều có cảm ứng từ 0,4 T. Vectơ pháp tuyến của mặt phẳng khung hợp với vectơ cảm ứng từ một góc $60^\\circ$. Từ thông qua khung dây là", ["$4\\cdot 10^{-3}$ Wb", "$6{,}9\\cdot 10^{-3}$ Wb", "$8\\cdot 10^{-3}$ Wb", "$2\\cdot 10^{-3}$ Wb"], "A",
    "$\\Phi = BS\\cos\\alpha = 0{,}4\\cdot 0{,}02\\cdot\\cos 60^\\circ = 4\\cdot 10^{-3}$ Wb."),
  mc(2, "MEDIUM", "Từ thông qua một mạch kín giảm đều từ $0{,}06$ Wb về 0 trong thời gian $0{,}02$ s. Độ lớn suất điện động cảm ứng xuất hiện trong mạch là", ["$3$ V", "$0{,}3$ V", "$1{,}2$ V", "$1{,}2\\cdot 10^{-3}$ V"], "A",
    "$|e_c| = \\left|\\dfrac{\\Delta\\Phi}{\\Delta t}\\right| = \\dfrac{0{,}06}{0{,}02} = 3$ V."),
  mc(2, "EASY", "Cường độ dòng điện xoay chiều trong một đoạn mạch có biểu thức $i = 2\\sqrt{2}\\cos(100\\pi t)$ (A). Cường độ dòng điện hiệu dụng là", ["$2$ A", "$2\\sqrt{2}$ A", "$4$ A", "$\\sqrt{2}$ A"], "A",
    "$I = \\dfrac{I_0}{\\sqrt{2}} = \\dfrac{2\\sqrt{2}}{\\sqrt{2}} = 2$ A."),
  mc(3, "EASY", "Hạt nhân $^{235}_{\\ 92}\\text{U}$ có bao nhiêu nơtron?", ["$143$", "$92$", "$235$", "$327$"], "A",
    "Số nơtron $N = A - Z = 235 - 92 = 143$."),
  mc(3, "MEDIUM", "Một chất phóng xạ có chu kì bán rã 8 ngày. Sau 24 ngày, số hạt nhân chất phóng xạ còn lại bằng bao nhiêu phần trăm số hạt nhân ban đầu?", ["$12{,}5\\%$", "$25\\%$", "$33{,}3\\%$", "$87{,}5\\%$"], "A",
    "$t = 24$ ngày $= 3T$ nên $\\dfrac{N}{N_0} = 2^{-3} = \\dfrac{1}{8} = 12{,}5\\%$."),
  // ── Phần II ──
  tf(0, "MEDIUM", "Thả một miếng nhôm khối lượng 0,5 kg đang ở nhiệt độ $100\\,^\\circ\\text{C}$ vào 2 kg nước ở $20\\,^\\circ\\text{C}$. Bỏ qua sự trao đổi nhiệt với bình chứa và môi trường. Nhiệt dung riêng của nhôm là $880$ J/(kg.K), của nước là $4200$ J/(kg.K).", [
    ["Miếng nhôm tỏa nhiệt, nước thu nhiệt.", true],
    ["Nhiệt độ khi cân bằng nhiệt xấp xỉ $24\\,^\\circ\\text{C}$.", true],
    ["Nhiệt lượng nước thu vào lớn hơn nhiệt lượng miếng nhôm tỏa ra.", false],
    ["Nếu chỉ dùng 1 kg nước thì nhiệt độ cân bằng sẽ thấp hơn $24\\,^\\circ\\text{C}$.", false],
  ], "a) Đúng: nhiệt truyền từ vật nóng hơn (nhôm) sang vật lạnh hơn (nước).\nb) Đúng: $0{,}5\\cdot 880\\cdot(100 - t) = 2\\cdot 4200\\cdot(t - 20) \\Rightarrow t = \\dfrac{212\\,000}{8840} \\approx 24{,}0\\,^\\circ\\text{C}$.\nc) Sai: khi bỏ qua hao phí, $Q_{\\text{thu}} = Q_{\\text{tỏa}}$.\nd) Sai: lượng nước ít hơn thì nước nóng lên nhiều hơn, nhiệt độ cân bằng cao hơn ($t \\approx 27{,}5\\,^\\circ\\text{C}$)."),
  tf(1, "MEDIUM", `Một lượng khí lí tưởng chứa trong xilanh có thể tích 10 lít, áp suất $2\\cdot 10^5$ Pa và nhiệt độ 300 K. ${LY_NOTE_CONST}`, [
    ["Số mol khí trong xilanh xấp xỉ $0{,}8$ mol.", true],
    ["Nung nóng đẳng tích lượng khí đến 450 K thì áp suất khí là $3\\cdot 10^5$ Pa.", true],
    ["Nén đẳng nhiệt lượng khí đến thể tích 5 lít thì áp suất khí là $1\\cdot 10^5$ Pa.", false],
    ["Ở 300 K, động năng tịnh tiến trung bình của một phân tử khí xấp xỉ $6{,}2\\cdot 10^{-21}$ J.", true],
  ], "a) Đúng: $n = \\dfrac{pV}{RT} = \\dfrac{2\\cdot 10^5\\cdot 10^{-2}}{8{,}31\\cdot 300} \\approx 0{,}80$ mol.\nb) Đúng: đẳng tích $\\dfrac{p_2}{p_1} = \\dfrac{T_2}{T_1} = 1{,}5 \\Rightarrow p_2 = 3\\cdot 10^5$ Pa.\nc) Sai: đẳng nhiệt $p_2 = p_1\\dfrac{V_1}{V_2} = 4\\cdot 10^5$ Pa.\nd) Đúng: $\\overline{W}_đ = \\dfrac{3}{2}kT = 1{,}5\\cdot 1{,}38\\cdot 10^{-23}\\cdot 300 \\approx 6{,}2\\cdot 10^{-21}$ J."),
  tf(2, "MEDIUM", "Một khung dây phẳng hình vuông cạnh 10 cm gồm 100 vòng dây, đặt trong từ trường đều có cảm ứng từ 0,2 T sao cho mặt phẳng khung vuông góc với các đường sức từ.", [
    ["Từ thông qua mỗi vòng dây là $2\\cdot 10^{-3}$ Wb.", true],
    ["Nếu quay khung để mặt phẳng khung song song với các đường sức từ thì từ thông qua khung bằng 0.", true],
    ["Nếu cảm ứng từ giảm đều về 0 trong 0,1 s thì độ lớn suất điện động cảm ứng trong khung là 0,2 V.", false],
    ["Nếu khung quay đều với tốc độ góc $100\\pi$ rad/s quanh một trục nằm trong mặt phẳng khung và vuông góc với các đường sức từ thì suất điện động cực đại trong khung xấp xỉ 62,8 V.", true],
  ], "a) Đúng: $S = 0{,}01$ m², $\\Phi_1 = BS = 0{,}2\\cdot 0{,}01 = 2\\cdot 10^{-3}$ Wb.\nb) Đúng: khi đó pháp tuyến vuông góc với $\\vec B$, $\\cos 90^\\circ = 0$.\nc) Sai: $|e| = N\\dfrac{\\Delta\\Phi_1}{\\Delta t} = 100\\cdot\\dfrac{2\\cdot 10^{-3}}{0{,}1} = 2$ V.\nd) Đúng: $E_0 = NBS\\omega = 100\\cdot 0{,}2\\cdot 0{,}01\\cdot 100\\pi = 20\\pi \\approx 62{,}8$ V."),
  tf(3, "MEDIUM", "Hạt nhân $^4_2\\text{He}$ có khối lượng $4{,}0015$ u. Cho khối lượng prôtôn $m_p = 1{,}0073$ u, khối lượng nơtron $m_n = 1{,}0087$ u và $1\\,\\text{u} = 931{,}5$ MeV/c².", [
    ["Hạt nhân $^4_2\\text{He}$ gồm 2 prôtôn và 2 nơtron.", true],
    ["Độ hụt khối của hạt nhân $^4_2\\text{He}$ là $0{,}0350$ u.", false],
    ["Năng lượng liên kết của hạt nhân $^4_2\\text{He}$ xấp xỉ $28{,}4$ MeV.", true],
    ["Năng lượng liên kết riêng của hạt nhân $^4_2\\text{He}$ xấp xỉ $14{,}2$ MeV/nuclôn.", false],
  ], "a) Đúng: $Z = 2$, $N = A - Z = 2$.\nb) Sai: $\\Delta m = 2\\cdot 1{,}0073 + 2\\cdot 1{,}0087 - 4{,}0015 = 0{,}0305$ u.\nc) Đúng: $W_{lk} = \\Delta m\\cdot c^2 = 0{,}0305\\cdot 931{,}5 \\approx 28{,}4$ MeV.\nd) Sai: $\\varepsilon = \\dfrac{W_{lk}}{A} \\approx \\dfrac{28{,}4}{4} \\approx 7{,}1$ MeV/nuclôn."),
  // ── Phần III ──
  sa(0, "EASY", "Cần cung cấp bao nhiêu kilôjun nhiệt lượng để đun nóng 2 kg nước từ $30\\,^\\circ\\text{C}$ đến $100\\,^\\circ\\text{C}$? Biết nhiệt dung riêng của nước là $4200$ J/(kg.K).", "588",
    "$Q = mc\\Delta t = 2\\cdot 4200\\cdot 70 = 588\\,000$ J $= 588$ kJ."),
  sa(1, "EASY", "Một bình kín chứa khí lí tưởng ở $27\\,^\\circ\\text{C}$ có áp suất 1,2 atm. Nung nóng bình đến $127\\,^\\circ\\text{C}$ (thể tích bình không đổi). Áp suất khí trong bình lúc đó là bao nhiêu atm?", "1,6",
    "Đẳng tích: $p_2 = p_1\\dfrac{T_2}{T_1} = 1{,}2\\cdot\\dfrac{400}{300} = 1{,}6$ atm."),
  sa(1, "MEDIUM", "Một bình kín có thể tích 8,31 lít chứa 0,5 mol khí lí tưởng ở nhiệt độ 300 K. Biết $R = 8{,}31$ J/(mol.K). Áp suất khí trong bình bằng bao nhiêu ($\\times 10^5$ Pa)?", "1,5",
    "$p = \\dfrac{nRT}{V} = \\dfrac{0{,}5\\cdot 8{,}31\\cdot 300}{8{,}31\\cdot 10^{-3}} = 1{,}5\\cdot 10^5$ Pa."),
  sa(2, "EASY", "Một đoạn dây dẫn thẳng dài 0,5 m mang dòng điện 2 A đặt vuông góc với các đường sức từ của một từ trường đều thì chịu tác dụng của lực từ có độ lớn 0,3 N. Cảm ứng từ của từ trường bằng bao nhiêu tesla?", "0,3",
    "$B = \\dfrac{F}{IL} = \\dfrac{0{,}3}{2\\cdot 0{,}5} = 0{,}3$ T."),
  sa(3, "MEDIUM", "Một chất phóng xạ có chu kì bán rã 5 năm. Sau bao nhiêu năm thì số hạt nhân chất phóng xạ còn lại bằng $\\dfrac{1}{16}$ số hạt nhân ban đầu?", "20",
    "$\\dfrac{N}{N_0} = 2^{-t/T} = \\dfrac{1}{16} = 2^{-4} \\Rightarrow t = 4T = 20$ năm."),
  sa(3, "EASY", "Hạt nhân $^{60}_{27}\\text{Co}$ có bao nhiêu nơtron?", "33",
    "$N = A - Z = 60 - 27 = 33$."),
];

// ═════════════════════════════════════ HÓA HỌC ═════════════════════════════════════
const HOA_TOPICS = ["Ester – lipid", "Carbohydrate", "Amine – amino acid – protein", "Polymer", "Pin điện và điện phân", "Kim loại"];
const HOA_ATOMIC = "Cho nguyên tử khối: H = 1; C = 12; O = 16; Na = 23; Mg = 24; Al = 27; Cl = 35,5; Fe = 56; Cu = 64; Ag = 108. Thể tích mol khí ở điều kiện chuẩn (25 °C, 1 bar) là 24,79 L/mol.";

const HOA: DemoQuestion[] = [
  // ── Phần I (18 câu) ──
  mc(0, "EASY", "Công thức cấu tạo của ethyl acetate là", ["CH₃COOC₂H₅", "HCOOC₂H₅", "C₂H₅COOCH₃", "CH₃COOCH₃"], "A",
    "Ethyl acetate là ester của acetic acid (CH₃COOH) và ethanol (C₂H₅OH): CH₃COOC₂H₅."),
  mc(0, "EASY", "Thủy phân hoàn toàn chất béo trong dung dịch NaOH (phản ứng xà phòng hóa) thu được", ["glycerol và muối sodium của acid béo", "glycerol và acid béo", "ethanol và muối sodium của acid béo", "glucose và acid béo"], "A",
    "Chất béo là triester của glycerol và acid béo; xà phòng hóa tạo glycerol và muối của acid béo (xà phòng)."),
  mc(0, "MEDIUM", `Xà phòng hóa hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là (${HOA_ATOMIC})`, ["8,2 gam", "4,1 gam", "9,6 gam", "6,8 gam"], "A",
    "n(CH₃COOC₂H₅) = 8,8 : 88 = 0,1 mol. CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH. m(CH₃COONa) = 0,1 · 82 = 8,2 gam."),
  mc(1, "EASY", "Chất nào sau đây thuộc loại monosaccharide?", ["Glucose", "Saccharose", "Tinh bột", "Cellulose"], "A",
    "Glucose (C₆H₁₂O₆) là monosaccharide; saccharose là disaccharide; tinh bột và cellulose là polysaccharide."),
  mc(1, "MEDIUM", "Cho 9 gam glucose phản ứng hoàn toàn với lượng dư dung dịch AgNO₃ trong NH₃ (thuốc thử Tollens). Khối lượng Ag thu được là", ["10,8 gam", "5,4 gam", "21,6 gam", "16,2 gam"], "A",
    "n(glucose) = 9 : 180 = 0,05 mol; mỗi mol glucose tạo 2 mol Ag ⇒ n(Ag) = 0,1 mol ⇒ m(Ag) = 10,8 gam."),
  mc(1, "EASY", "Thuốc thử dùng để nhận biết hồ tinh bột là", ["dung dịch iodine", "Cu(OH)₂", "dung dịch AgNO₃ trong NH₃", "quỳ tím"], "A",
    "Hồ tinh bột tạo với iodine hợp chất màu xanh tím đặc trưng."),
  mc(2, "EASY", "Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?", ["Methylamine", "Aniline", "Glycine", "Acetic acid"], "A",
    "Methylamine (CH₃NH₂) có tính base đủ mạnh làm xanh quỳ tím; aniline có tính base rất yếu; glycine gần trung tính; acetic acid làm đỏ quỳ."),
  mc(2, "EASY", "Phân tử glycine (H₂N–CH₂–COOH) có", ["1 nhóm –NH₂ và 1 nhóm –COOH", "2 nhóm –NH₂ và 1 nhóm –COOH", "1 nhóm –NH₂ và 2 nhóm –COOH", "không có nhóm –NH₂"], "A",
    "Glycine là amino acid đơn giản nhất, chứa 1 nhóm amino và 1 nhóm carboxyl."),
  mc(2, "EASY", "Protein (lòng trắng trứng) phản ứng với Cu(OH)₂ trong môi trường kiềm tạo hợp chất có màu", ["tím", "xanh lam", "đỏ gạch", "vàng"], "A",
    "Đây là phản ứng màu biuret của peptide (từ tripeptide trở lên) và protein, cho màu tím."),
  mc(3, "EASY", "Polymer nào sau đây được điều chế bằng phản ứng trùng hợp?", ["Polyethylene", "Nylon-6,6", "Poly(ethylene terephthalate)", "Cellulose"], "A",
    "Polyethylene được trùng hợp từ ethylene; nylon-6,6 và PET được điều chế bằng phản ứng trùng ngưng; cellulose là polymer thiên nhiên."),
  mc(3, "EASY", "Monomer dùng để điều chế poly(vinyl chloride) (PVC) là", ["CH₂=CHCl", "CH₂=CH₂", "CH₂=CH–CN", "CH₂=CH–CH₃"], "A",
    "n CH₂=CHCl → (–CH₂–CHCl–)ₙ (PVC)."),
  mc(4, "EASY", "Trong pin điện hóa Zn–Cu, điện cực âm (anode) là", ["thanh Zn", "thanh Cu", "dung dịch CuSO₄", "cầu muối"], "A",
    "Zn có tính khử mạnh hơn Cu nên bị oxi hóa (Zn → Zn²⁺ + 2e) ở anode – điện cực âm."),
  mc(4, "MEDIUM", "Cho thế điện cực chuẩn E°(Zn²⁺/Zn) = –0,76 V và E°(Cu²⁺/Cu) = +0,34 V. Sức điện động chuẩn của pin Zn–Cu là", ["1,10 V", "0,42 V", "–1,10 V", "0,34 V"], "A",
    "E°pin = E°(cathode) – E°(anode) = 0,34 – (–0,76) = 1,10 V."),
  mc(4, "EASY", "Điện phân dung dịch CuSO₄ với điện cực trơ, chất thu được ở cathode là", ["Cu", "O₂", "H₂SO₄", "SO₂"], "A",
    "Ở cathode, Cu²⁺ bị khử: Cu²⁺ + 2e → Cu; ở anode nước bị oxi hóa tạo O₂."),
  mc(5, "EASY", "Kim loại nào sau đây dẫn điện tốt nhất?", ["Ag", "Cu", "Au", "Al"], "A",
    "Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe."),
  mc(5, "EASY", "Kim loại nào sau đây tác dụng với nước ở nhiệt độ thường?", ["Na", "Fe", "Cu", "Ag"], "A",
    "Kim loại kiềm như Na phản ứng mạnh với nước: 2Na + 2H₂O → 2NaOH + H₂."),
  mc(5, "MEDIUM", `Cho 5,6 gam Fe tác dụng hoàn toàn với dung dịch HCl dư. Thể tích khí H₂ thu được ở điều kiện chuẩn là (${HOA_ATOMIC})`, ["2,479 lít", "2,240 lít", "3,719 lít", "1,240 lít"], "A",
    "n(Fe) = 0,1 mol; Fe + 2HCl → FeCl₂ + H₂ ⇒ n(H₂) = 0,1 mol ⇒ V = 0,1 · 24,79 = 2,479 lít."),
  mc(5, "MEDIUM", "Chất nào sau đây có thể làm mềm cả nước cứng tạm thời và nước cứng vĩnh cửu?", ["Na₂CO₃", "NaCl", "HCl", "Ca(OH)₂"], "A",
    "Na₂CO₃ kết tủa được cả Ca²⁺ và Mg²⁺ (dạng carbonate) dù đi kèm anion HCO₃⁻, Cl⁻ hay SO₄²⁻. Ca(OH)₂ chỉ làm mềm nước cứng tạm thời."),
  // ── Phần II ──
  tf(0, "MEDIUM", "Tristearin có công thức (C₁₇H₃₅COO)₃C₃H₅.", [
    ["Tristearin là chất béo no, ở điều kiện thường tồn tại ở thể rắn.", true],
    ["Thủy phân hoàn toàn 1 mol tristearin trong dung dịch NaOH thu được 3 mol sodium stearate và 1 mol glycerol.", true],
    ["Tristearin tan tốt trong nước.", false],
    ["Phân tử khối của tristearin là 890.", true],
  ], "a) Đúng: gốc acid béo no (C₁₇H₃₅–) nên tristearin là chất rắn.\nb) Đúng: (C₁₇H₃₅COO)₃C₃H₅ + 3NaOH → 3C₁₇H₃₅COONa + C₃H₅(OH)₃.\nc) Sai: chất béo không tan trong nước, tan trong dung môi hữu cơ.\nd) Đúng: C₅₇H₁₁₀O₆: 57·12 + 110 + 6·16 = 890."),
  tf(1, "MEDIUM", "Glucose và fructose là hai carbohydrate phổ biến trong tự nhiên.", [
    ["Glucose và fructose là đồng phân của nhau, có cùng công thức phân tử C₆H₁₂O₆.", true],
    ["Glucose tham gia phản ứng tráng bạc.", true],
    ["Fructose không hòa tan được Cu(OH)₂ ở nhiệt độ thường.", false],
    ["Lên men hoàn toàn 180 gam glucose (hiệu suất 100%) thu được 46 gam ethanol.", false],
  ], "a) Đúng.\nb) Đúng: glucose có nhóm –CHO.\nc) Sai: fructose có nhiều nhóm –OH kề nhau nên hòa tan Cu(OH)₂ tạo dung dịch xanh lam.\nd) Sai: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂; 1 mol glucose tạo 2 mol ethanol = 92 gam."),
  tf(4, "HARD", "Điện phân dung dịch CuSO₄ (dư) bằng điện cực trơ với cường độ dòng điện 1,93 A trong 2000 giây, hiệu suất 100%. Cho hằng số Faraday F = 96485 C/mol; Cu = 64.", [
    ["Ở cathode xảy ra quá trình khử ion Cu²⁺.", true],
    ["Khối lượng Cu bám vào cathode là 1,28 gam.", true],
    ["Ở anode thu được 0,01 mol khí O₂.", true],
    ["pH của dung dịch sau điện phân lớn hơn pH ban đầu.", false],
  ], "n(e) = It/F = 1,93 · 2000 / 96485 = 0,04 mol.\na) Đúng: Cu²⁺ + 2e → Cu.\nb) Đúng: n(Cu) = 0,02 mol ⇒ m = 1,28 gam.\nc) Đúng: 2H₂O → O₂ + 4H⁺ + 4e ⇒ n(O₂) = 0,01 mol.\nd) Sai: anode sinh ra H⁺ (tạo H₂SO₄) nên pH giảm."),
  tf(5, "MEDIUM", `Cho 2,7 gam Al phản ứng vừa đủ với dung dịch HCl. ${HOA_ATOMIC}`, [
    ["Số mol HCl đã phản ứng là 0,2 mol.", false],
    ["Thể tích khí H₂ thu được ở điều kiện chuẩn xấp xỉ 3,72 lít.", true],
    ["Khối lượng muối AlCl₃ thu được là 13,35 gam.", true],
    ["Trong phản ứng, Al đóng vai trò chất oxi hóa.", false],
  ], "n(Al) = 0,1 mol; 2Al + 6HCl → 2AlCl₃ + 3H₂.\na) Sai: n(HCl) = 3 · 0,1 = 0,3 mol.\nb) Đúng: n(H₂) = 0,15 mol ⇒ V = 0,15 · 24,79 ≈ 3,72 lít.\nc) Đúng: m(AlCl₃) = 0,1 · 133,5 = 13,35 gam.\nd) Sai: Al nhường electron (Al → Al³⁺ + 3e) nên là chất khử."),
  // ── Phần III ──
  sa(0, "MEDIUM", "Có bao nhiêu ester mạch hở có cùng công thức phân tử C₄H₈O₂?", "4",
    "Các ester: HCOOCH₂CH₂CH₃, HCOOCH(CH₃)₂, CH₃COOC₂H₅, C₂H₅COOCH₃ ⇒ 4 đồng phân."),
  sa(1, "EASY", "Cần bao nhiêu gam glucose để tạo ra 21,6 gam Ag khi thực hiện phản ứng tráng bạc (hiệu suất 100%)? (Ag = 108; glucose: M = 180.)", "18",
    "n(Ag) = 0,2 mol ⇒ n(glucose) = 0,1 mol ⇒ m = 18 gam."),
  sa(2, "EASY", "Phân tử peptide Ala–Gly–Val–Gly có bao nhiêu liên kết peptide?", "3",
    "Peptide tạo từ 4 gốc α-amino acid có 4 – 1 = 3 liên kết peptide."),
  sa(3, "MEDIUM", "Một mẫu PVC có phân tử khối trung bình là 62 500. Hệ số polymer hóa trung bình của mẫu PVC đó là bao nhiêu? (C = 12; H = 1; Cl = 35,5.)", "1000",
    "M(–CH₂–CHCl–) = 62,5 ⇒ n = 62 500 : 62,5 = 1000."),
  sa(5, "MEDIUM", "Hòa tan hoàn toàn 2,4 gam Mg vào dung dịch HCl dư. Thể tích khí H₂ thu được ở điều kiện chuẩn là bao nhiêu lít? (Mg = 24; thể tích mol khí ở điều kiện chuẩn là 24,79 L/mol; làm tròn kết quả đến hàng phần trăm.)", "2,48",
    "n(Mg) = 0,1 mol; Mg + 2HCl → MgCl₂ + H₂ ⇒ n(H₂) = 0,1 mol ⇒ V = 2,479 ≈ 2,48 lít."),
  sa(4, "MEDIUM", "Cho E°(Mg²⁺/Mg) = –2,37 V và E°(Cu²⁺/Cu) = +0,34 V. Sức điện động chuẩn của pin điện hóa Mg–Cu là bao nhiêu vôn?", "2,71",
    "E°pin = E°(Cu²⁺/Cu) – E°(Mg²⁺/Mg) = 0,34 – (–2,37) = 2,71 V."),
];

export const THPT_2025_DEMO_EXAMS: DemoExam[] = [
  { slug: "toan", subjectName: "Toán", title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Toán", durationMinutes: 90, shortAnswerPoints: "0.5", topics: TOAN_TOPICS, description: `${NOTE}\nCấu trúc: Phần I – 12 câu (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu); Phần III – 6 câu trả lời ngắn (0,5 điểm/câu). Thời gian làm bài: 90 phút.`, questions: TOAN },
  { slug: "vat-li", subjectName: "Vật lí", title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Vật lí", durationMinutes: 50, shortAnswerPoints: "0.25", topics: LY_TOPICS, description: `${NOTE}\nCấu trúc: Phần I – 18 câu (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu); Phần III – 6 câu trả lời ngắn (0,25 điểm/câu). Thời gian làm bài: 50 phút.\n${LY_NOTE_CONST}`, questions: LY },
  { slug: "hoa-hoc", subjectName: "Hóa học", title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Hóa học", durationMinutes: 50, shortAnswerPoints: "0.25", topics: HOA_TOPICS, description: `${NOTE}\nCấu trúc: Phần I – 18 câu (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu); Phần III – 6 câu trả lời ngắn (0,25 điểm/câu). Thời gian làm bài: 50 phút.\n${HOA_ATOMIC}`, questions: HOA },
];
