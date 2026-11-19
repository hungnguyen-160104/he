/**
 * DEMO mock exam for Sinh học (Biology) following the THPT graduation exam format from 2025:
 * part I – 18 single-choice items, part II – 4 true/false items (experiment/data based),
 * part III – 6 numeric short-answer items (0.25 point each), 50 minutes. Content spans molecular
 * genetics, inheritance, population genetics, evolution, ecology and grade-11 organism biology.
 * These are original practice items written for the demo, not official exam content.
 */
import { createBuilders, DEMO_NOTE, type DemoExam, type DemoQuestion } from "./builders";

const { mc, tf, sa } = createBuilders();

const TOPICS = [
  "Di truyền phân tử",
  "Di truyền nhiễm sắc thể và các quy luật di truyền",
  "Di truyền quần thể và ứng dụng di truyền học",
  "Tiến hóa",
  "Sinh thái học và bảo vệ môi trường",
  "Sinh học cơ thể",
];

const QUESTIONS: DemoQuestion[] = [
  // ── Phần I (18 câu) ──
  mc(0, "EASY", "Trong quá trình phiên mã, enzyme trực tiếp tổng hợp mạch RNA dựa trên mạch khuôn của gene là", ["RNA polymerase", "DNA polymerase", "DNA ligase", "enzyme cắt giới hạn (restrictase)"], "A",
    "RNA polymerase bám vào vùng khởi động, tháo xoắn gene và tổng hợp mạch RNA theo chiều 5' → 3' dựa trên mạch khuôn 3' → 5'. DNA polymerase hoạt động trong tái bản DNA; ligase nối các đoạn DNA; restrictase cắt DNA."),
  mc(0, "EASY", "Trong quá trình dịch mã, bộ ba đối mã (anticodon) khớp bổ sung với codon trên mRNA nằm trên phân tử", ["tRNA", "mRNA", "rRNA", "DNA"], "A",
    "Mỗi tRNA mang một bộ ba đối mã khớp bổ sung với codon trên mRNA, nhờ đó vận chuyển đúng amino acid đến ribosome."),
  mc(0, "MEDIUM", "Ở vi khuẩn E. coli, khi môi trường không có lactose, protein ức chế do gene điều hòa lacI tổng hợp sẽ", ["liên kết với vùng vận hành (O), ngăn cản phiên mã các gene cấu trúc Z, Y, A", "liên kết với vùng khởi động (P), làm tăng phiên mã các gene cấu trúc Z, Y, A", "bị biến đổi cấu hình không gian và tách khỏi vùng vận hành (O)", "không được tổng hợp vì gene điều hòa lacI ngừng phiên mã"], "A",
    "Gene điều hòa luôn tổng hợp protein ức chế. Khi không có lactose, protein ức chế gắn vào vùng vận hành, cản trở RNA polymerase nên các gene cấu trúc không được phiên mã. Chỉ khi có lactose (allolactose), protein ức chế mới bị biến đổi cấu hình và tách khỏi vùng vận hành."),
  mc(0, "MEDIUM", "Dạng đột biến điểm nào sau đây xảy ra trong vùng mã hóa của gene làm thay đổi khung đọc mã di truyền kể từ vị trí đột biến?", ["Thêm một cặp nucleotide", "Thay thế một cặp A–T bằng một cặp T–A", "Thay thế một cặp G–C bằng một cặp A–T", "Thay thế một cặp nucleotide trong bộ ba kết thúc"], "A",
    "Mã di truyền được đọc liên tục theo từng bộ ba. Thêm (hoặc mất) một cặp nucleotide làm dịch khung đọc, các bộ ba từ vị trí đột biến trở về sau đều thay đổi. Đột biến thay thế một cặp nucleotide chỉ ảnh hưởng tới một bộ ba."),
  mc(1, "EASY", "Cho phép lai P: AaBb × aabb. Biết mỗi gene quy định một tính trạng, alen trội là trội hoàn toàn và các gene phân li độc lập. Tỉ lệ kiểu hình ở F₁ là", ["1 : 1 : 1 : 1", "9 : 3 : 3 : 1", "3 : 1", "1 : 2 : 1"], "A",
    "AaBb tạo 4 loại giao tử AB, Ab, aB, ab với tỉ lệ bằng nhau; aabb chỉ tạo giao tử ab. F₁ có 4 kiểu gene AaBb, Aabb, aaBb, aabb tương ứng 4 kiểu hình với tỉ lệ 1 : 1 : 1 : 1."),
  mc(1, "MEDIUM", "Ở người, bệnh mù màu đỏ – lục do alen lặn m nằm trên vùng không tương đồng của nhiễm sắc thể X quy định, alen M quy định nhìn màu bình thường. Một cặp vợ chồng có kiểu gene $X^MX^m$ × $X^MY$. Xác suất để đứa con đầu lòng của họ là con trai bị mù màu là", ["25%", "50%", "12,5%", "0%"], "A",
    "Các kiểu gene ở đời con: $X^MX^M$, $X^MX^m$, $X^MY$, $X^mY$ với xác suất mỗi loại 1/4. Con trai bị mù màu ($X^mY$) chiếm 1/4 = 25% trong tổng số con (còn trong số con trai thì là 1/2)."),
  mc(1, "MEDIUM", "Ở một loài thực vật, cho cây F₁ dị hợp tử về hai cặp gene (nằm trên hai cặp nhiễm sắc thể khác nhau) tự thụ phấn, thu được F₂ gồm 9 cây hoa đỏ : 7 cây hoa trắng. Tính trạng màu hoa di truyền theo quy luật", ["tương tác bổ sung giữa hai gene không alen", "tương tác cộng gộp giữa hai gene không alen", "trội không hoàn toàn của một gene", "liên kết gene hoàn toàn"], "A",
    "F₂ có 9 + 7 = 16 tổ hợp ⇒ F₁ tạo 4 loại giao tử, hai gene phân li độc lập cùng quy định một tính trạng. Chỉ khi có mặt cả hai alen trội (A-B-) mới cho hoa đỏ (9/16), các kiểu gene còn lại cho hoa trắng (7/16): đó là tương tác bổ sung."),
  mc(1, "HARD", "Một cơ thể có kiểu gene $\\dfrac{AB}{ab}$Dd giảm phân bình thường, xảy ra hoán vị gene giữa A và B với tần số 20%. Theo lí thuyết, loại giao tử Ab D chiếm tỉ lệ", ["5%", "10%", "20%", "2,5%"], "A",
    "Với tần số hoán vị 20%, giao tử hoán vị Ab chiếm 20% : 2 = 10%. Cặp Dd phân li độc lập cho giao tử D chiếm 1/2. Vậy tỉ lệ giao tử Ab D = 10% · 1/2 = 5%."),
  mc(2, "MEDIUM", "Quần thể nào sau đây đang ở trạng thái cân bằng di truyền theo định luật Hardy – Weinberg?", ["0,36AA : 0,48Aa : 0,16aa", "0,40AA : 0,40Aa : 0,20aa", "0,60AA : 0,20Aa : 0,20aa", "0,25AA : 0,60Aa : 0,15aa"], "A",
    "Quần thể cân bằng khi cấu trúc có dạng p²AA : 2pqAa : q²aa. Với 0,36AA : 0,48Aa : 0,16aa: p = 0,6; q = 0,4; p² = 0,36; 2pq = 0,48; q² = 0,16 — thỏa mãn. Ba quần thể còn lại đều có tỉ lệ AA khác p² (ví dụ quần thể 0,40AA : 0,40Aa : 0,20aa có p = 0,6 nhưng AA = 0,40 ≠ 0,36)."),
  mc(2, "EASY", "Khi cho một quần thể thực vật tự thụ phấn bắt buộc qua nhiều thế hệ, cấu trúc di truyền của quần thể thay đổi theo hướng", ["tỉ lệ kiểu gene dị hợp giảm dần, tỉ lệ kiểu gene đồng hợp tăng dần", "tỉ lệ kiểu gene dị hợp tăng dần, tỉ lệ kiểu gene đồng hợp giảm dần", "tần số alen trội tăng dần, tần số alen lặn giảm dần", "tần số alen lặn tăng dần, tần số alen trội giảm dần"], "A",
    "Mỗi thế hệ tự thụ phấn, tỉ lệ dị hợp giảm đi một nửa và phần giảm đó được chia đều cho hai loại đồng hợp; tần số các alen không thay đổi."),
  mc(2, "EASY", "Trong kĩ thuật tạo DNA tái tổ hợp, enzyme được dùng để nối đoạn gene cần chuyển vào thể truyền (vector) là", ["DNA ligase", "enzyme cắt giới hạn (restrictase)", "RNA polymerase", "enzyme phiên mã ngược"], "A",
    "Restrictase cắt DNA tạo các đầu dính tương ứng; DNA ligase xúc tác hình thành liên kết phosphodiester để nối đoạn gene vào thể truyền, tạo DNA tái tổ hợp."),
  mc(3, "EASY", "Theo thuyết tiến hóa tổng hợp hiện đại, nhân tố nào sau đây làm thay đổi tần số alen của quần thể theo một hướng xác định?", ["Chọn lọc tự nhiên", "Đột biến", "Phiêu bạt di truyền", "Dòng gene"], "A",
    "Chọn lọc tự nhiên giữ lại các kiểu gene quy định kiểu hình thích nghi, làm tần số alen thay đổi theo hướng thích nghi với môi trường, nên là nhân tố tiến hóa có hướng. Đột biến, phiêu bạt di truyền và dòng gene làm thay đổi tần số alen không theo hướng xác định."),
  mc(3, "MEDIUM", "Cặp cơ quan nào sau đây là cơ quan tương đồng?", ["Cánh dơi và chi trước của mèo", "Cánh chim và cánh bướm", "Mang cá và mang tôm", "Gai xương rồng và gai hoa hồng"], "A",
    "Cánh dơi và chi trước của mèo có cùng nguồn gốc (chi trước của tổ tiên động vật có vú), cấu tạo xương tương tự nhau dù thực hiện chức năng khác nhau ⇒ cơ quan tương đồng. Các cặp còn lại có nguồn gốc khác nhau nhưng chức năng giống nhau ⇒ cơ quan tương tự (gai xương rồng là lá biến dạng, gai hoa hồng do biểu bì thân phát triển thành)."),
  mc(3, "MEDIUM", "Hai loài thực vật có bộ nhiễm sắc thể lần lượt là $2n_A$ và $2n_B$ lai với nhau tạo con lai bất thụ. Con lai được đa bội hóa thành thể song nhị bội có khả năng sinh sản hữu tính và cách li sinh sản với hai loài bố mẹ. Đây là ví dụ về", ["hình thành loài bằng lai xa kèm đa bội hóa", "hình thành loài bằng cách li địa lí", "hình thành loài bằng cách li tập tính", "hình thành loài bằng cách li sinh thái"], "A",
    "Con lai xa bất thụ do bộ nhiễm sắc thể không tồn tại thành cặp tương đồng; sau đa bội hóa, mỗi nhiễm sắc thể có cặp tương đồng nên giảm phân bình thường, tạo loài mới (thể song nhị bội) cách li sinh sản với hai loài gốc."),
  mc(4, "EASY", "Trong hệ sinh thái, nhóm sinh vật nào sau đây là sinh vật sản xuất?", ["Tảo lục đơn bào", "Nấm rơm", "Giun đất", "Châu chấu"], "A",
    "Tảo lục có diệp lục, quang hợp tổng hợp chất hữu cơ từ chất vô cơ nên là sinh vật sản xuất. Nấm rơm và giun đất là sinh vật phân giải; châu chấu là sinh vật tiêu thụ."),
  mc(4, "EASY", "Mối quan hệ giữa vi khuẩn Rhizobium sống trong nốt sần rễ cây họ Đậu với cây họ Đậu là quan hệ", ["cộng sinh", "hội sinh", "kí sinh", "ức chế – cảm nhiễm"], "A",
    "Vi khuẩn cố định nitrogen cung cấp nitrogen cho cây, cây cung cấp chất hữu cơ cho vi khuẩn; hai loài cùng có lợi và gắn bó chặt chẽ ⇒ cộng sinh."),
  mc(5, "EASY", "Ở thực vật C₃, chu trình Calvin (pha tối của quang hợp) diễn ra ở", ["chất nền (stroma) của lục lạp", "màng thylakoid của lục lạp", "chất nền của ti thể", "tế bào chất của tế bào lá"], "A",
    "Các enzyme của chu trình Calvin nằm trong chất nền lục lạp; pha sáng diễn ra trên màng thylakoid."),
  mc(5, "EASY", "Ở người, khi tâm thất trái co, máu được đẩy vào", ["động mạch chủ", "động mạch phổi", "tĩnh mạch chủ", "tĩnh mạch phổi"], "A",
    "Tâm thất trái đẩy máu giàu O₂ vào động mạch chủ để đi nuôi cơ thể (vòng tuần hoàn lớn); tâm thất phải đẩy máu vào động mạch phổi."),
  // ── Phần II ──
  tf(0, "MEDIUM", "Để nghiên cứu sự điều hòa hoạt động của operon lac ở vi khuẩn E. coli, người ta sử dụng chủng kiểu dại và ba chủng đột biến:\n- Chủng 1: đột biến ở gene điều hòa lacI làm protein ức chế không liên kết được với vùng vận hành.\n- Chủng 2: đột biến ở vùng vận hành (O) làm protein ức chế không liên kết được với vùng này.\n- Chủng 3: đột biến ở vùng khởi động (P) của operon làm RNA polymerase không bám được vào vùng này.\nCác chủng được nuôi trong môi trường không có lactose và môi trường có lactose (không có glucose).", [
    ["Ở chủng kiểu dại, trong môi trường không có lactose, các gene cấu trúc Z, Y, A hầu như không được phiên mã.", true],
    ["Ở chủng 1, các gene cấu trúc Z, Y, A được phiên mã cả khi môi trường không có lactose.", true],
    ["Ở chủng 3, khi môi trường có lactose, các gene cấu trúc Z, Y, A vẫn được phiên mã bình thường.", false],
    ["Ở chủng 2, gene điều hòa lacI không được phiên mã nên không tạo ra protein ức chế.", false],
  ], "a) Đúng: protein ức chế liên kết với vùng vận hành, ngăn RNA polymerase phiên mã các gene cấu trúc.\nb) Đúng: protein ức chế không gắn được vào vùng vận hành nên các gene cấu trúc được phiên mã liên tục, kể cả khi không có lactose.\nc) Sai: RNA polymerase không bám được vào vùng khởi động nên các gene cấu trúc không được phiên mã dù có lactose.\nd) Sai: gene điều hòa có vùng khởi động riêng, nằm ngoài operon; đột biến ở vùng vận hành không ảnh hưởng đến phiên mã gene lacI. Protein ức chế vẫn được tạo ra nhưng không gắn được vào vùng vận hành đột biến."),
  tf(1, "HARD", "Ở một loài thực vật, alen A quy định thân cao trội hoàn toàn so với alen a quy định thân thấp; alen B quy định hoa đỏ trội hoàn toàn so với alen b quy định hoa trắng. Cho cây F₁ dị hợp tử về hai cặp gene lai phân tích, thu được Fₐ gồm: 410 cây thân cao, hoa đỏ; 90 cây thân cao, hoa trắng; 90 cây thân thấp, hoa đỏ; 410 cây thân thấp, hoa trắng.", [
    ["Hai cặp gene quy định hai tính trạng trên cùng nằm trên một cặp nhiễm sắc thể và đã xảy ra hoán vị gene.", true],
    ["Kiểu gene của cây F₁ là $\\dfrac{Ab}{aB}$.", false],
    ["Tần số hoán vị gene giữa hai gene A và B là 18%.", true],
    ["Nếu cho cây F₁ tự thụ phấn và hoán vị gene xảy ra ở cả hai giới với tần số như trên thì tỉ lệ cây thân thấp, hoa trắng ở F₂ là 16,81%.", true],
  ], "a) Đúng: tỉ lệ Fₐ là 41 : 9 : 9 : 41, khác 1 : 1 : 1 : 1 của phân li độc lập và khác 1 : 1 của liên kết hoàn toàn ⇒ hai gene liên kết không hoàn toàn (có hoán vị).\nb) Sai: hai lớp kiểu hình chiếm tỉ lệ lớn (cao, đỏ và thấp, trắng) sinh ra từ giao tử liên kết AB và ab ⇒ F₁ có kiểu gene $\\dfrac{AB}{ab}$.\nc) Đúng: f = (90 + 90) : 1000 = 18%.\nd) Đúng: giao tử ab = (100% − 18%) : 2 = 41% ⇒ tỉ lệ aabb = 0,41 · 0,41 = 0,1681 = 16,81%."),
  tf(2, "MEDIUM", "Một quần thể thực vật giao phấn ngẫu nhiên có cấu trúc di truyền ở thế hệ xuất phát (P) là 0,40AA : 0,40Aa : 0,20aa. Alen A quy định hoa đỏ trội hoàn toàn so với alen a quy định hoa trắng. Giả sử quần thể không chịu tác động của các nhân tố tiến hóa.", [
    ["Tần số alen A ở thế hệ P là 0,6.", true],
    ["Quần thể ở thế hệ P đang ở trạng thái cân bằng di truyền.", false],
    ["Ở thế hệ F₁, tỉ lệ cây hoa trắng là 16%.", true],
    ["Nếu quần thể P tự thụ phấn bắt buộc qua 2 thế hệ thì tỉ lệ kiểu gene dị hợp Aa là 0,20.", false],
  ], "a) Đúng: p(A) = 0,40 + 0,40 : 2 = 0,6; q(a) = 0,4.\nb) Sai: nếu cân bằng thì tỉ lệ AA phải là p² = 0,36, khác 0,40.\nc) Đúng: sau một thế hệ giao phấn ngẫu nhiên, quần thể đạt cân bằng: aa = q² = 0,4² = 0,16 = 16%.\nd) Sai: mỗi thế hệ tự thụ phấn, tỉ lệ dị hợp giảm một nửa: Aa = 0,40 · (1/2)² = 0,10."),
  tf(4, "HARD", "Trong một hệ sinh thái đồng cỏ, các mối quan hệ dinh dưỡng được mô tả như sau: cỏ là thức ăn của châu chấu, thỏ và chuột; châu chấu là thức ăn của ếch và chim sẻ; ếch là thức ăn của rắn; chuột là thức ăn của rắn và cú mèo; thỏ là thức ăn của cáo; rắn là thức ăn của cú mèo. Biết năng lượng tích lũy ở cỏ là 2 000 000 kcal và tổng năng lượng tích lũy ở châu chấu, thỏ và chuột là 180 000 kcal (số liệu giả định, mang tính minh họa). Ngoài các loài trên, trong hệ sinh thái không còn loài nào khác tham gia vào lưới thức ăn.", [
    ["Lưới thức ăn này có 5 chuỗi thức ăn.", true],
    ["Rắn và cú mèo chỉ có quan hệ cạnh tranh với nhau.", false],
    ["Hiệu suất sinh thái giữa bậc dinh dưỡng cấp 2 và bậc dinh dưỡng cấp 1 là 0,9%.", false],
    ["Nếu loài ếch bị loại bỏ hoàn toàn khỏi hệ sinh thái thì lưới thức ăn chỉ còn 3 chuỗi thức ăn.", false],
  ], "a) Đúng: các chuỗi là cỏ → châu chấu → ếch → rắn → cú mèo; cỏ → châu chấu → chim sẻ; cỏ → thỏ → cáo; cỏ → chuột → rắn → cú mèo; cỏ → chuột → cú mèo.\nb) Sai: cú mèo ăn rắn (quan hệ sinh vật ăn sinh vật), đồng thời hai loài cạnh tranh nguồn thức ăn là chuột.\nc) Sai: bậc dinh dưỡng cấp 2 gồm châu chấu, thỏ, chuột; hiệu suất = 180 000 : 2 000 000 · 100% = 9%.\nd) Sai: chỉ mất chuỗi cỏ → châu chấu → ếch → rắn → cú mèo, lưới thức ăn còn 4 chuỗi."),
  // ── Phần III ──
  sa(0, "EASY", "Một gene ở sinh vật nhân sơ có tổng số 3000 nucleotide, trong đó số nucleotide loại A chiếm 20% tổng số nucleotide của gene. Số nucleotide loại G của gene là bao nhiêu?", "900",
    "Theo nguyên tắc bổ sung A + G = 50% ⇒ G = 50% − 20% = 30%. Số nucleotide loại G = 30% · 3000 = 900."),
  sa(0, "HARD", "Vùng mã hóa trên một phân tử mRNA (tính từ bộ ba mở đầu đến hết bộ ba kết thúc) gồm 1500 nucleotide. Khi phân tử mRNA này được dịch mã, mỗi chuỗi polypeptide được tổng hợp (chưa cắt bỏ amino acid mở đầu) gồm bao nhiêu amino acid?", "499",
    "Số bộ ba = 1500 : 3 = 500. Bộ ba kết thúc không mã hóa amino acid ⇒ chuỗi polypeptide có 500 − 1 = 499 amino acid (kể cả amino acid mở đầu)."),
  sa(1, "MEDIUM", "Cho phép lai P: AaBbDd × AaBbdd. Biết mỗi gene quy định một tính trạng, alen trội là trội hoàn toàn và các gene phân li độc lập. Theo lí thuyết, tỉ lệ cá thể có kiểu hình trội về cả ba tính trạng ở F₁ là bao nhiêu? (Viết kết quả dưới dạng số thập phân, làm tròn đến hai chữ số sau dấu phẩy.)", "0,28",
    "Aa × Aa → A- = 3/4; Bb × Bb → B- = 3/4; Dd × dd → D- = 1/2. Tỉ lệ A-B-D- = 3/4 · 3/4 · 1/2 = 9/32 = 0,28125 ≈ 0,28."),
  sa(1, "HARD", "Ở ruồi giấm, alen B quy định thân xám trội hoàn toàn so với alen b quy định thân đen; alen V quy định cánh dài trội hoàn toàn so với alen v quy định cánh cụt; hai gene cùng nằm trên một cặp nhiễm sắc thể thường. Cho phép lai P: ♀ $\\dfrac{BV}{bv}$ × ♂ $\\dfrac{BV}{bv}$. Biết ruồi cái xảy ra hoán vị gene với tần số 20%, ruồi đực không xảy ra hoán vị gene. Theo lí thuyết, tỉ lệ ruồi thân xám, cánh dài ở F₁ là bao nhiêu? (Viết kết quả dưới dạng số thập phân.)", "0,7",
    "Ruồi cái cho giao tử bv = (1 − 0,2) : 2 = 0,4; ruồi đực cho giao tử bv = 0,5. Tỉ lệ bbvv = 0,4 · 0,5 = 0,2. Tỉ lệ thân xám, cánh dài (B-V-) = 0,5 + bbvv = 0,5 + 0,2 = 0,7."),
  sa(2, "HARD", "Một quần thể thực vật giao phấn ngẫu nhiên đang ở trạng thái cân bằng di truyền, trong đó cây hoa trắng chiếm 9%. Biết alen A quy định hoa đỏ trội hoàn toàn so với alen a quy định hoa trắng. Trong số các cây hoa đỏ của quần thể, cây có kiểu gene dị hợp chiếm tỉ lệ bao nhiêu? (Viết kết quả dưới dạng số thập phân, làm tròn đến hai chữ số sau dấu phẩy.)", "0,46",
    "q² = 0,09 ⇒ q(a) = 0,3; p(A) = 0,7. AA = 0,49; Aa = 2 · 0,7 · 0,3 = 0,42. Cây hoa đỏ = 0,49 + 0,42 = 0,91. Tỉ lệ dị hợp trong số cây hoa đỏ = 0,42 : 0,91 ≈ 0,4615 ≈ 0,46."),
  sa(4, "EASY", "Một quần thể động vật có 1500 cá thể vào đầu năm. Trong năm đó, tỉ lệ sinh là 12%, tỉ lệ tử vong là 8% và tỉ lệ xuất cư là 2% (đều tính theo số cá thể đầu năm); không có nhập cư. Số cá thể của quần thể vào cuối năm là bao nhiêu?", "1530",
    "Kích thước quần thể cuối năm = N₀ + số sinh − số tử − số xuất cư = 1500 + 1500 · (12% − 8% − 2%) = 1500 + 30 = 1530 cá thể."),
];

export const SINH_HOC_EXAM: DemoExam = {
  slug: "sinh-hoc",
  subjectName: "Sinh học",
  title: "[DEMO] Đề thi thử tốt nghiệp THPT — Môn Sinh học",
  durationMinutes: 50,
  shortAnswerPoints: "0.25",
  topics: TOPICS,
  description: `${DEMO_NOTE}\nCấu trúc: Phần I – 18 câu trắc nghiệm nhiều lựa chọn (0,25 điểm/câu); Phần II – 4 câu đúng/sai (tối đa 1 điểm/câu); Phần III – 6 câu trả lời ngắn (0,25 điểm/câu). Thời gian làm bài: 50 phút.`,
  questions: QUESTIONS,
};
