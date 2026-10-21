from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
from pathlib import Path
import shutil
out=Path('output/pdf');out.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(out/'moodrobe-case-study.pdf'),pagesize=(595,842));c.setTitle('Moodrobe | Project brief');c.setAuthor('Moodrobe project')
ink=HexColor('#1d2926');peach=HexColor('#f2b59d');paper=HexColor('#f9f8f3')
def base(n,label):
 c.setFillColor(paper);c.rect(0,0,595,842,fill=1,stroke=0);c.setFillColor(ink);c.setFont('Helvetica-Bold',18);c.drawString(42,800,'moodrobe.');c.setFont('Helvetica',9);c.drawRightString(553,802,label);c.setStrokeColor(ink);c.line(42,782,553,782);c.setFont('Helvetica',8);c.drawString(42,28,'WORKING RESEARCH PROTOTYPE / 21 OCTOBER 2026');c.drawRightString(553,28,f'{n} / 2')
def text(y,title,body):
 c.setFillColor(ink);c.setFont('Helvetica-Bold',12);c.drawString(42,y,title);y-=19;c.setFont('Helvetica',10)
 for line in simpleSplit(body,'Helvetica',10,500):c.drawString(42,y,line);y-=14
 return y-20
base(1,'PROBLEM / EXPERIENCE')
c.setFillColor(peach);c.rect(42,606,511,153,fill=1,stroke=0);c.setFillColor(ink);c.setFont('Helvetica-Bold',30);c.drawString(60,714,'A wardrobe that starts');c.drawString(60,677,'with how you feel.');c.setFont('Helvetica',11);c.drawString(60,634,'A local AI outfit recommender using clothes a person already owns.')
y=text(578,'01 / Problem and hypothesis','Owning many clothes can still leave a person struggling to remember, combine and choose them. Moodrobe explores whether self-reported context and a short, explained selection can reduce this friction and encourage rediscovery. This is a product hypothesis, not a finding from completed interviews.')
y=text(y,'02 / A complete daily journey','Check in with mood, occasion, temperature and a free-text brief. Browse a photographic sample wardrobe or add personal pieces and local photos. Generate three combinations, inspect the garments, provide preference feedback, save and plan a look, then record an actual wear in the diary.')
y=text(y,'03 / Designed for inspection','A separate, tab-local sample demo lets a reviewer explore without changing a personal wardrobe. The project brief, model explanation, source model attribution and limitations are one click away. Photographs illustrate pieces; the app does not generate a virtual try-on.')
y=text(y,'04 / What can be claimed now','Working software, genuine browser-side neural inference and a trainable local preference head. Automated checks cover the main journeys, data persistence, accessibility and real model execution. No user-study participants, accuracy figures or environmental savings have been invented.')
c.setFont('Helvetica-Bold',10);c.drawString(42,90,'Review route: Project brief > Guided sample demo > Inside the AI')
c.setFont('Helvetica',9);c.drawString(42,73,'The hosted preview remains private. Grant reviewer access before sharing its link.')
c.showPage();base(2,'MODEL / EVIDENCE / NEXT TEST')
y=text(749,'05 / A hybrid model, with explicit boundaries','A pinned, quantised all-MiniLM-L6-v2 encoder represents the daily brief and garment descriptions as 384-dimensional vectors. ONNX Runtime performs inference in a Web Worker. A structural assembler creates valid owned-item combinations; semantic similarity ranks them, and a regularised logistic preference head learns locally from accepted and rejected suggestions.')
y=text(y,'06 / What the AI does and does not infer','The pretrained encoder is reused; this is not a foundation model trained from scratch. Rules still constrain outfit completeness and availability. Garment text is the model input, not photographs. Mood is self-reported: camera, voice and RR tools do not provide a validated emotion or health diagnosis. Semantic ranking is not a calibrated probability of a good outfit.')
y=text(y,'07 / Privacy and engineering tradeoffs','Inference and wardrobe storage run locally, with no paid API key. The first AI run loads roughly 37 MB of local model/runtime assets; performance depends on the device. Personal photos stay in browser storage and deliberate backup files. Backup/restore and deletion are available. Model failures use an explicitly labelled rule-based fallback. Local storage can still be cleared by the browser.')
y=text(y,'08 / A real usability study is prepared, not completed','The included protocol invites 5-8 consenting adults to set context, run the model, save an outfit, record a wear and inspect limitations. The optional consent flow records actual task events and cumulative elapsed times. Participants decide whether to export anonymous session files. A local dashboard separates sample, mixed and personal wardrobes and starts with zero imported results.')
y=text(y,'09 / Evidence needed before stronger claims','Collect real observations, report recruitment and limitations, and connect each observed obstacle to a documented change. Ease ratings and small-sample task completion are formative usability evidence. Claims about mood improvement, purchasing or clothing utilisation require a separate appropriately designed longitudinal evaluation.')
y=text(y,'Reproduce and inspect','Use the guided sample route, compare contrasting briefs and inspect changed outfit rankings. In the source package run npm ci, npm test, npm run test:e2e and npm run build. The release includes the protocol, observation log, a captioned 90-second walkthrough and verification notes.')
c.setFont('Helvetica',8);c.drawString(42,65,'Model: huggingface.co/Xenova/all-MiniLM-L6-v2 | Sentence-BERT: arxiv.org/abs/1908.10084')
c.linkURL('https://huggingface.co/Xenova/all-MiniLM-L6-v2',(42,59,553,77),relative=0)
c.save();shutil.copy(out/'moodrobe-case-study.pdf','public/application/moodrobe-case-study.pdf')
import pypdfium2 as pdfium
pdf=pdfium.PdfDocument(str(out/'moodrobe-case-study.pdf'))
Path('tmp/pdfs').mkdir(parents=True,exist_ok=True)
for i,p in enumerate(pdf):p.render(scale=1.3).to_pil().save(f'tmp/pdfs/page-{i+1}.png')
print('PDF pages:',len(pdf))
