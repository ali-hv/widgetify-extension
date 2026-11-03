from io import BytesIO
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root = Path(__file__).resolve().parents[1]
repo = root.parents[1]
fonts = {}
for weight in ['Regular', 'Bold']:
    font = TTFont(repo / f'src/assets/fonts/vazir/Vazirmatn-FD-{weight}.woff2')
    font.flavor = None
    buffer = BytesIO()
    font.save(buffer)
    fonts[weight] = buffer.getvalue()
S=2
im=Image.new('RGB',(1160*S,860*S),'#f1f5f9')
d=ImageDraw.Draw(im)
fg='#464647'; muted='#7e7e7f'; brand='#536dfe'; line='#e3e3e3'; white='#ffffff'; bg='#f8fafc'
def box(x,y,w,h,fill=white,r=12,outline=None):
    d.rounded_rectangle((x*S,y*S,(x+w)*S,(y+h)*S),r*S,fill,outline,width=S)
def text(x,y,value,size=12,color=fg,bold=False,rtl=True):
    font=ImageFont.truetype(BytesIO(fonts['Bold' if bold else 'Regular']),size*S)
    d.text((x*S,y*S),value,font=font,fill=color,anchor='ra' if rtl else 'la',direction='rtl' if rtl else 'ltr')
def button(x,y,w,label,primary=False):
    box(x,y,w,32,brand if primary else bg)
    text(x+w/2,y+6,label,12,white if primary else fg,True)
def field(x,y,w,label,value,ltr=False):
    text(x+w,y,label,11,muted)
    box(x,y+24,w,40,bg,12,line)
    text(x+12 if ltr else x+w-12,y+34,value,12,rtl=not ltr)
def header(x,y,w):
    text(x+w-12,y+14,'تودویست',12,bold=True)
    for i in range(3):
        d.ellipse(((x+17+i*4)*S,(y+23)*S,(x+18+i*4)*S,(y+24)*S),fill=fg)
    d.arc(((x+42)*S,(y+17)*S,(x+56)*S,(y+31)*S),25,320,fill=muted,width=2*S)
    d.line([(int((x+55)*S),int((y+17)*S)),(int((x+56)*S),int((y+22)*S)),(int((x+51)*S),int((y+21)*S))],fill=muted,width=S)
text(1120,28,'ویجت تودویست',24,bold=True)
text(1120,72,'پیشنهاد طراحی · در انتظار تایید',12,muted)
text(40,34,'Widgetify / Todoist',16,bold=True,rtl=False)
text(40,66,'LIGHT THEME · DRAFT',11,muted,rtl=False)
for x,w,title in [(40,280,'۱ · اتصال حساب'),(344,280,'۲ · فهرست تسک‌ها'),(648,448,'۳ · ویرایش تسک')]:
    text(x+w,112,title,14,bold=True)
    box(x,148,w,384,white,24)
    header(x,148,w)
text(308,216,'تسک‌هات رو اینجا ببین',16,bold=True)
text(308,252,'توکن تودویست رو وارد کن تا وصل بشی',12,muted)
field(52,292,256,'توکن API','••••••••••••••••••••',True)
text(308,366,'توکن رو از کجا بردارم؟',11,brand)
button(52,402,256,'وصل شو',True)
text(308,456,'توکن روی همین مرورگر نگه داشته می‌شه',11,muted)
text(308,478,'و فقط برای تودویست فرستاده می‌شه',11,muted)
box(356,196,256,32,bg)
text(600,202,'همه پروژه‌ها',12)
text(368,202,'⌄',12,rtl=False)
for y,title,meta,priority in [(248,'آماده کردن طرح صفحه اصلی','امروز · کار',brand),(312,'مرور برنامه هفته','فردا · شخصی',muted),(376,'پیاده‌روی عصر','هر روز · ساعت ۱۸',muted)]:
    d.ellipse((588*S,(y+6)*S,604*S,(y+22)*S),outline=priority,width=S)
    text(576,y,title,12)
    text(576,y+24,meta,10,muted)
text(600,448,'+ تسک جدید',12,brand)
text(600,496,'آخرین همگام‌سازی: همین الان',10,muted)
text(1084,196,'ویرایش تسک',16,bold=True)
field(664,232,416,'عنوان','آماده کردن طرح صفحه اصلی')
field(664,308,416,'توضیحات','نسخه تازه رو برای تیم بفرست')
field(880,384,200,'پروژه','کار')
field(664,384,200,'بخش','طراحی')
text(1080,466,'تاریخ و تکرار، اولویت و برچسب‌ها در ادامه',11,muted)
box(648,552,448,264,white,24)
field(880,564,200,'تاریخ و ساعت','فردا · ۱۰:۰۰')
field(664,564,200,'تکرار','هر هفته')
field(880,640,200,'اولویت','اولویت ۲')
field(664,640,200,'برچسب‌ها','طراحی، تیم')
button(960,744,120,'ذخیره',True)
button(872,744,80,'بی‌خیال')
text(708,752,'حذف',12,'#ff627d')
box(40,552,584,264,white,24)
text(608,570,'حالت‌های دیگر',14,bold=True)
for y,title,body in [(610,'فهرست خالی','هنوز تسکی نداری · از «تسک جدید» شروع کن'),(660,'اینترنت قطع شده','نسخه ذخیره‌شده رو می‌بینی · دوباره امتحان کن'),(710,'توکن معتبر نیست','توکن رو بررسی کن یا یه توکن تازه وارد کن'),(760,'حذف تسک','این تسک حذف بشه؟ · حذف / نه')]:
    text(608,y,title,12,bold=True)
    text(608,y+22,body,11,muted)
im.save(root/'assets/proposal.png')
