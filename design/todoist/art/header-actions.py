from pathlib import Path
from io import BytesIO
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
out=Path(__file__).resolve().parents[1]
repo=out.parents[1]
fonts={}
for weight in ['Regular','Bold']:
 font=TTFont(repo/'src/assets/fonts/vazir'/f'Vazirmatn-FD-{weight}.woff2')
 font.flavor=None
 buffer=BytesIO()
 font.save(buffer)
 fonts[weight]=buffer.getvalue()
scale=2
im=Image.new('RGB',(1024*scale,716*scale),'#f1f5f9')
d=ImageDraw.Draw(im)
ink='#464647'; muted='#7e7e7f';brand='#536dfe';surface='#ffffff';field='#f8fafc'
def box(x,y,w,h,fill=surface,r=12):
 d.rounded_rectangle((x*scale,y*scale,(x+w)*scale,(y+h)*scale),r*scale,fill)
def text(x,y,value,size=12,color=ink,bold=False,rtl=True):
 f=ImageFont.truetype(BytesIO(fonts['Bold' if bold else 'Regular']),size*scale)
 d.text((x*scale,y*scale),value,font=f,fill=color,anchor='ra' if rtl else 'la',direction='rtl' if rtl else 'ltr')
def task(x,y,title,meta):
 d.ellipse(((x+252)*scale,(y+6)*scale,(x+268)*scale,(y+22)*scale),outline=muted,width=scale)
 text(x+240,y,title)
 text(x+240,y+25,meta,10,muted)
def event(x,y,title,meta):
 d.rounded_rectangle(((x+252)*scale,(y+6)*scale,(x+268)*scale,(y+22)*scale),3*scale,outline=muted,width=scale)
 d.line(((x+252)*scale,(y+11)*scale,(x+268)*scale,(y+11)*scale),fill=muted,width=scale)
 text(x+240,y,title)
 text(x+240,y+25,meta,10,muted)
text(984,24,'تودویست · نمایش تسک‌ها',24,bold=True)
text(984,66,'چیدمان دکمه و زمان به‌روزرسانی',12,muted)
text(40,34,'Widgetify / task views',14,bold=True,rtl=False)
labels=['امروز','فردا','پیش رو']
for i,x in enumerate([40,368,696]):
 text(x+288,108,labels[i],14,bold=True)
 box(x,144,288,480,r=24)
 text(x+272,160,'تودویست',12,bold=True)
 text(x+80,164,'به‌روز ۱۰:۱۵',10,muted)
 d.arc(((x+94)*scale,166*scale,(x+108)*scale,180*scale),25,320,fill=muted,width=scale)
 box(x+12,196,264,40,field)
 for j,label in enumerate(labels):
  tx=x+12+(2-j)*88
  if i==j:box(tx+4,200,80,32,'#eef0ff')
  font=ImageFont.truetype(BytesIO(fonts['Bold' if i==j else 'Regular']),11*scale)
  left,top,right,bottom=d.textbbox((0,0),label,font=font,direction='rtl')
  d.text(((tx+44)*scale-(left+right)/2,216*scale-(top+bottom)/2),label,font=font,fill=brand if i==j else muted,direction='rtl')
 box(x+12,248,264,32,field)
 text(x+264,254,'همه پروژه‌ها',11)
 text(x+264,290,'+ تسک جدید',12,brand)
 if i==0:
  task(x,332,'آماده کردن طرح صفحه اصلی','امروز · ساعت ۱۰:۳۰ · کار')
  task(x,390,'پیاده‌روی عصر','امروز · هر روز')
  text(x+264,476,'رویدادهای تقویم گوگل',11,bold=True)
  event(x,508,'جلسه تیم طراحی','امروز · ۱۱:۰۰ تا ۱۲:۰۰')
 elif i==1:
  task(x,332,'مرور برنامه هفته','فردا · شخصی')
  text(x+264,422,'رویدادهای تقویم گوگل',11,bold=True)
  event(x,454,'گفت‌وگو با سارا','فردا · ۱۴:۰۰ تا ۱۴:۳۰')
 else:
  task(x,332,'فرستادن گزارش','دیروز · کار')
  task(x,390,'آماده کردن طرح صفحه اصلی','امروز · کار')
  task(x,448,'مرور برنامه هفته','فردا · شخصی')
  task(x,506,'خواندن کتاب تازه','بدون تاریخ · شخصی')
text(984,652,'امروز: فقط امروز · فردا: فقط فردا · پیش رو: همه تسک‌های فعال، حتی عقب‌افتاده و بدون تاریخ',12)
text(984,681,'رویدادهای تقویم از اتصال گوگل در ویجتیفای خوانده می‌شن و با کلیک در تقویم باز می‌شن',11,muted)
im.save(out/'assets/header-actions.png')
