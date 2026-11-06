from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).resolve().parents[1]
repo = out.parents[1]
fonts = {}
for weight in ['Regular', 'Bold']:
    fonts[weight] = (repo / 'src/assets/fonts/vazir' / f'Vazirmatn-FD-{weight}.woff2').read_bytes()
scale = 2
im = Image.new('RGB', (1024 * scale, 860 * scale), '#f1f5f9')
d = ImageDraw.Draw(im)
ink = '#464647'
muted = '#7e7e7f'
brand = '#536dfe'
danger = '#ff627d'

def box(x, y, w, h, fill='#ffffff', radius=12):
    d.rounded_rectangle((x * scale, y * scale, (x + w) * scale, (y + h) * scale), radius * scale, fill)

def text(x, y, value, size=12, color=ink, bold=False, rtl=True):
    font = ImageFont.truetype(BytesIO(fonts['Bold' if bold else 'Regular']), size * scale)
    d.text((x * scale, y * scale), value, font=font, fill=color, anchor='ra' if rtl else 'la', direction='rtl' if rtl else 'ltr')

def center(x, y, value, size=11, color=ink, bold=False):
    font = ImageFont.truetype(BytesIO(fonts['Bold' if bold else 'Regular']), size * scale)
    left, top, right, bottom = d.textbbox((0, 0), value, font=font, direction='rtl')
    d.text((x * scale - (left + right) / 2, y * scale - (top + bottom) / 2), value, font=font, fill=color, direction='rtl')

def row(x, y, title, meta, overdue=False, action=True):
    d.ellipse(((x + 252) * scale, (y + 6) * scale, (x + 268) * scale, (y + 22) * scale), outline=muted, width=scale)
    text(x + 240, y, title)
    text(x + 240, y + 24, meta, 10, danger if overdue else muted)
    if action:
        box(x + 152, y + 44, 88, 32, '#eef0ff', 8)
        center(x + 196, y + 60, 'تغییر تاریخ', 11, brand)

text(984, 24, 'تودویست · تغییر تاریخ تسک', 24, bold=True)
text(984, 65, 'تایید شده با دکمه‌ی تغییر تاریخ همه', 12, muted)
text(40, 34, 'Widgetify / reschedule', 14, bold=True, rtl=False)
for index, x in enumerate([40, 368, 696]):
    text(x + 288, 108, ['تسک‌های عقب‌افتاده می‌مونن', 'انتخاب سریع تاریخ', 'انتخاب تاریخ دلخواه'][index], 14, bold=True)
    box(x, 144, 288, 604, radius=24)
    text(x + 272, 160, 'تودویست', 12, bold=True)
    text(x + 88, 164, 'به‌روز ۱۰:۱۵', 10, muted)
    box(x + 12, 196, 264, 40, '#f8fafc')
    for j, label in enumerate(['امروز', 'فردا', 'پیش رو']):
        tx = x + 12 + (2 - j) * 88
        if j == 0:
            box(tx + 4, 200, 80, 32, '#eef0ff')
        center(tx + 44, 216, label, 11, brand if j == 0 else muted, j == 0)
    box(x + 12, 248, 264, 32, '#f8fafc')
    text(x + 264, 254, 'همه پروژه‌ها', 11)
    text(x + 264, 291, '+ تسک جدید', 12, brand)
    text(x + 264, 329, 'عقب‌افتاده‌ها · ۲', 11, danger, True)
    box(x + 12, 320, 124, 32, '#eef0ff', 8)
    center(x + 74, 336, 'تغییر تاریخ همه', 10, brand)
    row(x, 360, 'فرستادن گزارش', 'دیروز · ساعت ۰۹:۰۰ · کار', True)
    row(x, 452, 'مرور برنامه هفته', 'امروز · ساعت ۰۸:۳۰ · شخصی', True)
    text(x + 264, 554, 'امروز', 11, muted, True)
    row(x, 588, 'جلسه تیم طراحی', '۱۱:۰۰ تا ۱۲:۰۰ · تقویم گوگل', action=False)
    row(x, 649, 'آماده کردن طرح', '۱۴:۳۰ · کار', action=False)
    if index == 1:
        box(x + 12, 354, 264, 196, '#ffffff', 16)
        d.rounded_rectangle(((x + 12) * scale, 354 * scale, (x + 276) * scale, 550 * scale), 16 * scale, outline='#e3e3e3', width=scale)
        text(x + 260, 368, 'تغییر تاریخ همه', 12, bold=True)
        text(x + 260, 394, '۲ تسک عقب‌افتاده', 10, muted)
        for j, label in enumerate(['امروز', 'فردا', 'انتخاب تاریخ…']):
            yy = 420 + j * 38
            if j == 0:
                box(x + 20, yy, 248, 34, '#eef0ff')
            text(x + 254, yy + 7, label, 12, brand if j == 0 else ink)
    if index == 2:
        box(x + 12, 398, 264, 336, '#ffffff', 16)
        d.rounded_rectangle(((x + 12) * scale, 398 * scale, (x + 276) * scale, 734 * scale), 16 * scale, outline='#e3e3e3', width=scale)
        text(x + 260, 412, 'انتخاب تاریخ…', 12, bold=True)
        text(x + 260, 438, '۲ تسک عقب‌افتاده', 10, muted)
        center(x + 144, 477, 'آبان ۱۴۰۵', 12, bold=True)
        text(x + 40, 465, '‹', 20, muted)
        text(x + 254, 465, '›', 20, muted)
        for j, day in enumerate(['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']):
            center(x + 246 - j * 34, 512, day, 10, muted)
        for n in range(1, 31):
            col = (n + 5) % 7
            week = (n + 5) // 7
            cx = x + 246 - col * 34
            cy = 542 + week * 28
            if n == 18:
                box(cx - 14, cy - 14, 28, 28, '#536dfe', 8)
            center(cx, cy, str(n), 11, '#ffffff' if n == 18 else ink)
        box(x + 152, 692, 108, 32, '#536dfe', 8)
        center(x + 206, 708, 'ذخیره', 11, '#ffffff', True)
        center(x + 66, 708, 'بی‌خیال', 11, muted)
text(984, 780, 'ساعت و تکرار تسک حفظ میشه · تغییر تاریخ در تودویست هم ذخیره میشه', 12)
text(984, 812, 'اگه ذخیره نشه، تسک با تاریخ قبلی می‌مونه و می‌تونی دوباره امتحان کنی', 11, muted)
im.save(out / 'assets/reschedule-all.png')
